/**
 * Xparkle RVS01 "Smart RV Leveling Navigator" (SkyRC) — pure byte codec,
 * kept apart from the Web Bluetooth transport so it is testable with plain
 * byte arrays.
 *
 * Reverse-engineered by decompiling the official Android app
 * (`com.skyrc.pbox` 1.4.6, versionCode 20260414), which is **not
 * obfuscated**: every claim below is read off named code —
 * `com.skyrc.balance.config.Cmd`, `com.skyrc.balance.config.Constants`,
 * `com.skyrc.balance.data.ConnectListener` and
 * `com.skyrc.balance.model.b_main.RvBalanceMainViewModel`. See
 * `docs/competitor-notes.md` for which rows are Verified vs. Unknown.
 *
 * The app's source cannot answer whether the live read is refused before
 * the password command, or what the box puts in its BLE advertisement.
 * Neither affects the byte layouts.
 *
 * ## What makes this device different from EasyLevel
 *
 * EasyLevel streams raw accelerometer counts and Libell derives the angles
 * (`atan2`) from them. This box does its own fusion, its own zeroing and
 * its own mounting transform, and reports **two finished angles plus a
 * direction flag each**. There is no gravity vector on the wire and no
 * bias block to subtract. `gravityFromAngles` below therefore synthesizes
 * the vector the `OrientationSensor` seam requires (ADR 0014) instead of
 * passing raw axes through — deliberately, so every source still meets
 * `domain/`'s one input shape and no second leveling path exists.
 *
 * ## Sign convention (traced, not assumed)
 *
 * The live payload carries magnitudes, never signed values; direction is a
 * separate flag byte per axis. Mapping those flags onto Libell's own
 * signed roll/pitch is the one thing here that would be dangerous to get
 * wrong (it names the wrong wheel while looking perfectly plausible), so
 * it is traced through to the app's own display rather than inferred from
 * its debug-log wording alone:
 *
 * `RvBalanceMainViewModel` fills the four corner readouts of its top view
 * from `isUphill()` and `isLeftTilt()`. With `uphill && leftTilt` it sets
 * `topRightValue` to "0.00" — the zero corner is the one needing no lift,
 * i.e. the highest — and gives `bottomLeftValue` the sum of both lifts,
 * i.e. the lowest corner. With `!uphill && !leftTilt` the zero corner is
 * `bottomLeft` instead. Reading the top view's top edge as the vehicle's
 * front (the app's own "Front View / Rear View / Top View" tabs, and the
 * `*_top` vehicle artwork it draws there), both cases agree on:
 *
 * - `uphill` (byte 0 = 1) → the **front is high** (nose up)
 * - `leftTilt` (byte 3 = 1) → the **left side is low**
 *
 * Libell's own convention (`domain/leveling.ts`: wheel height is
 * `x·tan(roll) + y·tan(pitch)` with x = right, y = front) makes both of
 * those **positive**: a positive pitch lifts the front wheels, a positive
 * roll lifts the right-hand wheels, i.e. drops the left. Hence the signs
 * in `parseLivePayload` below.
 *
 * The remaining assumption — that the top view's top edge is the front —
 * is the one thing a physical box would settle for good.
 *
 * ## What is deliberately NOT reproduced here
 *
 * - **The app's display truncation.** It computes `raw / 10` as a Java int
 *   and then divides by `10f`, i.e. it shows 0.1° steps from a 1/100° wire
 *   value. Libell keeps the full wire precision: the truncation is the
 *   vendor app's display choice, and throwing away a digit before the
 *   leveling math would only add error.
 * - **The app's lift math** (`sin(angle) × vehicle dimension`, rounded to a
 *   user-chosen 0.25/0.5/1.0/1.5 step). Libell computes its own per-wheel
 *   guidance from the gravity vector through the one already-tested path
 *   in `domain/`, and has a ramp plan (ADR 0011) the vendor app has no
 *   equivalent of.
 * - **OTA firmware upgrade** (command `0xFF`). It needs the vendor's own
 *   firmware images and has no place in a leveling app.
 *
 * Commands to the box are framed in `xparkleCommands.ts`, and its replies
 * are read back in `xparkleReplies.ts`.
 */
import type { GravityVector } from '../domain/leveling';

/** Anything `DataView`-constructible, or a plain byte array (tests). */
export type PacketBytes = DataView | ArrayBufferLike | ArrayLike<number>;

export function toDataView(data: PacketBytes): DataView {
  if (data instanceof DataView) return data;
  if (data instanceof ArrayBuffer) return new DataView(data);
  return new DataView(Uint8Array.from(data as ArrayLike<number>).buffer);
}

/**
 * GATT service and characteristics (`com.skyrc.balance.config.Constants`).
 * These are 16-bit-derived UUIDs rather than vendor-random ones like
 * EasyLevel's `faf52c20-...`, and none of them is on Web Bluetooth's
 * blocklist. The box also has `fff1` (serial number / firmware read, and
 * the OTA write target) and `fff6` (device name read), which Libell does
 * not use.
 */
export const XPARKLE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
/** Live tilt + battery. READ, polled — never notified (see `xparkleSensor.ts`). */
export const XPARKLE_LIVE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
/** Command frames are written here (`buildCommandFrame` in `xparkleCommands.ts`). */
export const XPARKLE_WRITE_CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';
/** NOTIFY — carries command replies only, not live readings. */
export const XPARKLE_NOTIFY_CHARACTERISTIC_UUID = '0000fff4-0000-1000-8000-00805f9b34fb';

/**
 * Advertised-name fragments the official app matches on
 * (`BaseConstants.BALANCE`, via `AppUtil.getDeviceMode()`); it scans with
 * no service filter and accepts any device whose name contains one. Do not
 * filter on `XPARKLE_SERVICE_UUID` instead: whether the box advertises it
 * is unknown, and filtering on a service a box never advertises leaves the
 * OS picker empty (as happened with EasyLevel).
 */
export const XPARKLE_DEVICE_NAME_FRAGMENTS = ['RVLevel', 'RVbalance'] as const;

/**
 * Bytes a live payload must have before `parseLivePayload` will read it —
 * the app's own guard is `data.length > 6`, and it reads indices 0 through
 * 6.
 */
export const LIVE_PAYLOAD_MIN_BYTES = 7;

/**
 * Angles this codec will accept. The wire format (an unsigned 16-bit count
 * of 1/100°) can express up to 655°, which no leveling box can mean;
 * anything past a quarter turn is treated as a corrupt payload rather than
 * silently clamped, since a clamped nonsense reading looks exactly like a
 * real one downstream. Libell's own choice, not a documented device limit
 * — the vendor app clips its *display* at a much tighter range but does
 * not validate the wire value at all.
 */
export const MAX_PLAUSIBLE_ANGLE_DEG = 90;

export interface XparkleReading {
  /** Side/side tilt, Libell's sign convention: negative = right side low. */
  rollDeg: number;
  /** Front/back tilt, Libell's sign convention: negative = front low. */
  pitchDeg: number;
  /** Byte 6, a whole percent as the box reports it. */
  batteryPercent: number;
}

/** Big-endian uint16 in 1/100°, as degrees. */
function angleDeg(view: DataView, offset: number): number {
  return view.getUint16(offset, false) / 100;
}

/**
 * Parse the value read from `XPARKLE_LIVE_CHARACTERISTIC_UUID`. Returns
 * `null` for a payload too short to hold the seven bytes the app itself
 * requires, or one whose angles are outside `MAX_PLAUSIBLE_ANGLE_DEG` —
 * never throws, since no payload length has been verified against
 * hardware.
 *
 * Byte layout (`ConnectListener.getRealtimeData`'s read callback):
 * `[0]` front/back direction flag, `[1..2]` big-endian uint16 magnitude in
 * 1/100°, `[3]` left/right direction flag, `[4..5]` the same for the other
 * axis, `[6]` battery percent. See the module doc comment for how the two
 * flags map onto Libell's signed roll/pitch.
 */
export function parseLivePayload(data: PacketBytes): XparkleReading | null {
  const view = toDataView(data);
  if (view.byteLength < LIVE_PAYLOAD_MIN_BYTES) return null;

  const frontHigh = view.getUint8(0) === 1;
  const pitchMagnitude = angleDeg(view, 1);
  const leftLow = view.getUint8(3) === 1;
  const rollMagnitude = angleDeg(view, 4);
  if (pitchMagnitude > MAX_PLAUSIBLE_ANGLE_DEG || rollMagnitude > MAX_PLAUSIBLE_ANGLE_DEG) {
    return null;
  }

  return {
    // `uphill` means nose up, which is a positive pitch here; `leftTilt`
    // means the left side is low, which lifts the right-hand wheels and is
    // therefore a positive roll. Module doc comment has the derivation.
    pitchDeg: frontHigh ? pitchMagnitude : -pitchMagnitude,
    rollDeg: leftLow ? rollMagnitude : -rollMagnitude,
    batteryPercent: view.getUint8(6),
  };
}

/**
 * Build the `GravityVector` the `OrientationSensor` seam expects from a
 * pair of already-finished angles.
 *
 * `domain/leveling.ts` recovers tilt as `atan2(x, z)` / `atan2(y, z)`, so
 * `z = 1`, `x = tan(roll)`, `y = tan(pitch)` inverts it exactly for any
 * angle inside a quarter turn. The vector is unitless on purpose: only the
 * ratios between its axes are ever used, so there is nothing to scale.
 */
export function gravityFromAngles(rollDeg: number, pitchDeg: number): GravityVector {
  const toRad = Math.PI / 180;
  return {
    x: Math.tan(rollDeg * toRad),
    y: Math.tan(pitchDeg * toRad),
    z: 1,
  };
}

export function gravityFromReading(reading: XparkleReading): GravityVector {
  return gravityFromAngles(reading.rollDeg, reading.pitchDeg);
}
