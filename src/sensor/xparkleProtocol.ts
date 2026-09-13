/**
 * Xparkle RVS01 "Smart RV Leveling Navigator" (SkyRC) — pure byte codec
 * (#269).
 *
 * Reverse-engineered by decompiling the official Android app, the same way
 * `easyLevelProtocol.ts` was, with one large difference in kind: the
 * Xparkle app (`com.skyrc.pbox`, version 1.4.6, versionCode 20260414) is
 * **not obfuscated**. Real class, method and field names survive, so every
 * claim below is read off named code — `com.skyrc.balance.config.Cmd`,
 * `com.skyrc.balance.config.Constants`, `com.skyrc.balance.data.
 * ConnectListener` and `com.skyrc.balance.model.b_main.
 * RvBalanceMainViewModel` — rather than reconstructed from obfuscated
 * bytecode. See `docs/competitor-notes.md` for the full writeup and for
 * which rows are Verified vs. Unknown.
 *
 * Kept separate from `xparkleSensor.ts`'s Web Bluetooth transport (#270)
 * so the bytes are fully unit-testable from plain synthetic arrays, with
 * no `navigator.bluetooth` mocking — the same split, for the same reason,
 * that `easyLevelProtocol.ts` / `easyLevelSensor.ts` already use.
 *
 * **No physical box has been tested.** Two things the app's own source
 * structurally cannot answer are tracked in #273: whether the live read is
 * refused before the password command, and what the box actually puts in
 * its BLE advertisement. Neither affects the byte layouts below.
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
 * is the one thing a physical box would settle for good (#273), and it is
 * the same class of open question `easyLevelProtocol.ts` still carries for
 * its own absolute polarity.
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
 */
import type { GravityVector } from '../domain/leveling';

/** Anything `DataView`-constructible, or a plain byte array (tests). */
export type PacketBytes = DataView | ArrayBufferLike | ArrayLike<number>;

function toDataView(data: PacketBytes): DataView {
  if (data instanceof DataView) return data;
  if (data instanceof ArrayBuffer) return new DataView(data);
  return new DataView(Uint8Array.from(data as ArrayLike<number>).buffer);
}

/**
 * GATT service and characteristics (`com.skyrc.balance.config.Constants`).
 * These are 16-bit-derived UUIDs rather than vendor-random ones like
 * EasyLevel's `faf52c20-...`, and none of them is on Web Bluetooth's
 * blocklist.
 */
export const XPARKLE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
/** Serial number / firmware read, and the OTA write target. */
export const XPARKLE_VERSION_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
/** Live tilt + battery. READ, polled — never notified (see `xparkleSensor.ts`). */
export const XPARKLE_LIVE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
/** Command frames are written here (`buildCommandFrame` below). */
export const XPARKLE_WRITE_CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';
/** NOTIFY — carries command replies only, not live readings. */
export const XPARKLE_NOTIFY_CHARACTERISTIC_UUID = '0000fff4-0000-1000-8000-00805f9b34fb';
/** Device name read. */
export const XPARKLE_NAME_CHARACTERISTIC_UUID = '0000fff6-0000-1000-8000-00805f9b34fb';

/**
 * Advertised-name fragments the official app matches on
 * (`BaseConstants.BALANCE`, via `AppUtil.getDeviceMode()`); it scans with
 * no service filter at all and accepts any device whose name contains one
 * of these. Whether the box also advertises `XPARKLE_SERVICE_UUID` is
 * unknown (#273) — which is exactly the trap #215 had to undo for
 * EasyLevel, where Libell had been filtering `requestDevice()` on a
 * service real boxes never advertise, so the OS picker listed nothing.
 */
export const XPARKLE_DEVICE_NAME_FRAGMENTS = ['RVLevel', 'RVbalance'] as const;

/** The factory password every box ships with (`Constants.DEFAULT_PASSWORD`). */
export const XPARKLE_DEFAULT_PASSWORD = '0000';

/** Command bytes (`com.skyrc.balance.config.Cmd`). */
export const XPARKLE_COMMAND = {
  factoryReset: 0x01,
  queryParameters: 0x02,
  setParameters: 0x03,
  password: 0x04,
  resetZero: 0x05,
} as const;

export type XparkleCommand = (typeof XPARKLE_COMMAND)[keyof typeof XPARKLE_COMMAND];

/** First byte of every frame, in both directions (`Cmd.base`, and
 * `ConnectListener.onNotify`'s `bytes[0] == 15` start-of-frame test). */
export const XPARKLE_FRAME_HEADER = 0x0f;

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
 * Parse the value read from `XPARKLE_LIVE_CHARACTERISTIC_UUID` (#269).
 * Returns `null` for a payload too short to hold the seven bytes the app
 * itself requires, or one whose angles are outside
 * `MAX_PLAUSIBLE_ANGLE_DEG` — never throws, the same discipline #116 set
 * for EasyLevel, since no payload length has been verified against
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
 * angle inside a quarter turn — proven by a round-trip test rather than
 * asserted here. The vector is unitless on purpose: only the ratios
 * between its axes are ever used (the same contract the phone sensor and
 * the EasyLevel adapter already fulfill), so there is nothing to scale.
 */
export function gravityFromAngles(rollDeg: number, pitchDeg: number): GravityVector {
  const toRad = Math.PI / 180;
  return {
    x: Math.tan(rollDeg * toRad),
    y: Math.tan(pitchDeg * toRad),
    z: 1,
  };
}

/** `gravityFromAngles` applied to a parsed reading — the shape
 * `xparkleSensor.ts` actually needs. */
export function gravityFromReading(reading: XparkleReading): GravityVector {
  return gravityFromAngles(reading.rollDeg, reading.pitchDeg);
}

/**
 * Frame a command for `XPARKLE_WRITE_CHARACTERISTIC_UUID`, byte for byte
 * as `Cmd.base()` does it:
 *
 * ```
 * [0]            0x0F
 * [1]            payload.length + 3
 * [2]            command
 * [3]            0x00                (unused by every command the app sends)
 * [4 .. 4+n-1]   payload
 * [n+4]          checksum
 * [n+5], [n+6]   0xFF, 0xFF
 * ```
 *
 * The checksum is `(1 + Σ bytes[2..])` truncated to a byte. The app's own
 * loop runs over the whole frame including the three trailing bytes, which
 * are still zero when it runs, so this is equivalent to summing the
 * command byte, the unused `[3]`, and the payload. (It sums Java's *signed*
 * bytes, but a signed byte and its unsigned reading are congruent mod 256,
 * so the truncated result is identical either way.)
 */
export function buildCommandFrame(command: number, payload: ArrayLike<number>): Uint8Array {
  const frame = new Uint8Array(payload.length + 7);
  frame[0] = XPARKLE_FRAME_HEADER;
  frame[1] = payload.length + 3;
  frame[2] = command;
  frame[3] = 0;
  frame.set(Uint8Array.from(payload), 4);

  let checksum = 1;
  for (const byte of frame.subarray(2)) checksum += byte;
  frame[payload.length + 4] = checksum & 0xff;
  frame[payload.length + 5] = 0xff;
  frame[payload.length + 6] = 0xff;
  return frame;
}

/**
 * The app passes a single zero byte, not an empty array, as the payload of
 * every argument-less command (`Cmd.factoryReset`/`resetZero`/
 * `queryParameters` all call `base(cmd, new byte[1])`), which makes those
 * frames 8 bytes rather than 7. Reproduced exactly: a box that validates
 * the declared length would reject the shorter form.
 */
const EMPTY_PAYLOAD = [0];

/** Ask the box for its stored parameters (`Cmd.queryParameters`). */
export function buildQueryParameters(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.queryParameters, EMPTY_PAYLOAD);
}

/**
 * Zero the box where it currently sits (`Cmd.resetZero`) — the device's
 * own equivalent of R34's installation offset, stored in the box's own
 * firmware. Building it is harmless; issuing it is not, so
 * `xparkleSensor.ts` must only ever send it behind an explicit user
 * action (#270).
 */
export function buildResetZero(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.resetZero, EMPTY_PAYLOAD);
}

/** Wipe the box's stored configuration (`Cmd.factoryReset`). Same caution
 * as `buildResetZero`, more so. */
export function buildFactoryReset(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.factoryReset, EMPTY_PAYLOAD);
}

/**
 * Password mode byte. The app sends `0` on connect with the stored
 * password in the "new" field (i.e. "here is my password, do you accept
 * it") and `1` from its change-password screen with both fields
 * meaningful. Named here because `0` reading as "set password" would be
 * actively misleading at the call site.
 */
export const XPARKLE_PASSWORD_MODE = {
  verify: 0x00,
  change: 0x01,
} as const;

export type XparklePasswordMode =
  (typeof XPARKLE_PASSWORD_MODE)[keyof typeof XPARKLE_PASSWORD_MODE];

/** A box password is exactly four decimal digits (`PasswordViewModel`'s
 * input filter, and the fixed 4-byte slots in `Cmd.setPassword`). */
export const XPARKLE_PASSWORD_LENGTH = 4;

export function isValidXparklePassword(password: string): boolean {
  return new RegExp(`^\\d{${XPARKLE_PASSWORD_LENGTH}}$`).test(password);
}

/**
 * Build the password frame (`Cmd.setPassword`): a 9-byte payload of mode,
 * then the four digits of the *new* password one digit per byte as a
 * plain number (not ASCII), then the four digits of the old one.
 *
 * Returns `null` rather than throwing for anything that is not four
 * digits — the transport should refuse to send a malformed password, not
 * crash the connect flow.
 */
export function buildPasswordFrame(
  mode: XparklePasswordMode,
  oldPassword: string,
  newPassword: string,
): Uint8Array | null {
  if (!isValidXparklePassword(oldPassword) || !isValidXparklePassword(newPassword)) return null;
  const payload = new Uint8Array(9);
  payload[0] = mode;
  for (let i = 0; i < XPARKLE_PASSWORD_LENGTH; i++) {
    payload[1 + i] = Number(newPassword[i]);
    payload[5 + i] = Number(oldPassword[i]);
  }
  return buildCommandFrame(XPARKLE_COMMAND.password, payload);
}

/**
 * The box's own stored vehicle configuration (`Cmd.setParameters`, and the
 * reply to `queryParameters`). Lengths are whole inches or whole
 * centimetres depending on `unit` — this is the box's own unit choice, and
 * is not related to Libell's millimetres-everywhere rule (ADR 0003):
 * nothing in `domain/` ever sees these values, since Libell has its own
 * vehicle geometry and computes its own guidance.
 */
export interface XparkleParameters {
  /** 0 = inch, anything else = cm. */
  unit: number;
  /** The box's own vehicle-type choice; Libell has no use for it. */
  vehicleType: number;
  /** Track width, in whole `unit`s. */
  width: number;
  /** Front-to-rear distance, in whole `unit`s. */
  length: number;
  /** Which way the box is mounted — see `XPARKLE_ORIENTATIONS`. */
  installationOrientation: number;
  /** The app's display rounding step, 0–3; a vendor-app display setting. */
  displayResolution: number;
}

/**
 * The four mounting orientations the box stores and the vendor app offers
 * (`setup_3_activity.xml`: "Installation Orientation", front / rear / left
 * / right). Unlike EasyLevel's `sensor_Placing` — a fact only the user
 * knows, because that box never transmits it — this one is readable back
 * over the wire, which is what makes it a candidate for Libell reading
 * rather than re-asking (#270 settles which).
 */
export const XPARKLE_ORIENTATIONS = ['front', 'rear', 'left', 'right'] as const;

export type XparkleOrientation = (typeof XPARKLE_ORIENTATIONS)[number];

export function orientationFromByte(byte: number): XparkleOrientation | null {
  return XPARKLE_ORIENTATIONS[byte] ?? null;
}

/** Bytes a parameter reply needs before every field above is readable. */
export const PARAMETER_REPLY_MIN_BYTES = 12;

/**
 * Parse a completed reply frame to `queryParameters`
 * (`ConnectListener.onNotify`'s `b == 2` branch). Returns `null` for a
 * frame that is not a parameter reply, or is too short — never throws.
 */
export function parseParameterReply(frame: PacketBytes): XparkleParameters | null {
  const view = toDataView(frame);
  if (view.byteLength < PARAMETER_REPLY_MIN_BYTES) return null;
  if (view.getUint8(2) !== XPARKLE_COMMAND.queryParameters) return null;
  return {
    unit: view.getUint8(4),
    vehicleType: view.getUint8(5),
    width: view.getUint16(6, false),
    length: view.getUint16(8, false),
    installationOrientation: view.getUint8(10),
    displayResolution: view.getUint8(11),
  };
}

/**
 * Reassemble command replies arriving on the notify characteristic
 * (`ConnectListener.onNotify`): a reply longer than the negotiated MTU
 * arrives in pieces, and only the first carries the `0x0F` header and the
 * length byte. Declared length is `bytes[1] + 4`, matching a frame's total
 * of payload + 7 (the length byte itself is payload + 3).
 *
 * Stateful by necessity, so it is a small factory rather than a pure
 * function — but it holds nothing but a buffer, takes no time source and
 * touches no browser API, so it stays as testable as the rest of this
 * module. A piece that would overflow the declared length, or a
 * continuation with no start seen, is dropped rather than appended: a
 * corrupt reply must not poison the next one.
 */
export interface XparkleFrameReassembler {
  /** Feed one notification; returns a completed frame, or null. */
  push(chunk: PacketBytes): Uint8Array | null;
  /** Drop any partial frame — call on disconnect. */
  reset(): void;
}

export function createXparkleFrameReassembler(): XparkleFrameReassembler {
  let buffer: Uint8Array | null = null;
  let filled = 0;

  function bytesOf(chunk: PacketBytes): Uint8Array {
    const view = toDataView(chunk);
    const out = new Uint8Array(view.byteLength);
    for (let i = 0; i < view.byteLength; i++) out[i] = view.getUint8(i);
    return out;
  }

  return {
    push(chunk) {
      const bytes = bytesOf(chunk);
      if (bytes.length === 0) return null;

      if (bytes[0] === XPARKLE_FRAME_HEADER) {
        // A new frame always restarts the buffer, even mid-reassembly:
        // that is what the app's own `lastPos == 0 && bytes[0] == 15`
        // branch effectively does, and it is the only way to recover from
        // a reply whose tail never arrived. A lone header byte carries no
        // length yet, so there is nothing to start.
        if (bytes.length < 2) return null;
        const declared = bytes[1]! + 4;
        if (bytes.length > declared) return null;
        buffer = new Uint8Array(declared);
        buffer.set(bytes, 0);
        filled = bytes.length;
      } else if (buffer) {
        if (filled + bytes.length > buffer.length) {
          buffer = null;
          filled = 0;
          return null;
        }
        buffer.set(bytes, filled);
        filled += bytes.length;
      } else {
        // A continuation with no start frame seen — nothing to append to.
        return null;
      }

      if (buffer && filled === buffer.length) {
        const complete = buffer;
        buffer = null;
        filled = 0;
        return complete;
      }
      return null;
    },
    reset() {
      buffer = null;
      filled = 0;
    },
  };
}
