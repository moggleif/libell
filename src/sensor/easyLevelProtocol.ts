/**
 * EasyLevel BLE box — pure packet parsing (#116, re-verified end to end by
 * #215).
 *
 * Reverse-engineered by decompiling the official Android apps — no public
 * spec exists, and no physical box has been available to verify against.
 * #215 redid this from the actual `.xapk`/`.apk` files (`EasyLevel 5.0.7`,
 * `EasyLevelRV 2.5.0`, `EasyLevelRV 2.2.2`, all APKPure), tracing the full
 * `faf52c21-...` NOTIFY handler through to the app's own displayed
 * roll/pitch, not just the packet layout #116/#123 had already confirmed.
 * Kept in its own module, separate from `easyLevelSensor.ts`'s Web
 * Bluetooth transport, so the byte parsing is fully unit-testable with
 * plain synthetic byte arrays — no `navigator.bluetooth` mocking needed.
 *
 * #215's traced call chain, `EasyLevel 5.0.7` class names (obfuscated;
 * `EasyLevelRV 2.5.0` is the same logic byte-for-byte under different
 * obfuscated names — confirmed by decompiling both — `EasyLevelRV 2.2.2`
 * uses a map-based dispatch for the same two UUIDs, consistent as far as
 * checked but not re-derived formula-by-formula):
 * `Lz0/b$b;->onCharacteristicChanged()` (the `BluetoothGattCallback`) calls
 * the abstract `Lz0/b;->i(characteristic, value)`, implemented by
 * `Ly0/a;->i()` (the app's BLE ViewModel) — this is the one method that
 * both branches below trace back to.
 *
 * **Axis mapping (established, not assumed):** `Ly0/a;->i()` branches on
 * `characteristic.getUuid()`; the `faf52c21-...` branch reads bytes 0–1,
 * 2–3, 4–5 as signed int16 LE accelX/Y/Z (bytes 6–11 likewise for
 * gyroX/Y/Z) — matching this module's existing layout below, now confirmed
 * end to end rather than just at the byte-offset level. Those three values
 * feed `D0.b.a()`/inline `D0.c` code computing `C0.a` — a Kotlin data class
 * whose own `toString()` names its four fields `accnGyrXangle`,
 * `accnGyrYangle` (gyro-fused), `accXangle`, `accYangle` (accel-only) — so
 * "X" tracks the accelX packet field and "Y" tracks accelY, no swap. That
 * `C0.a` is observed in `LO0/e;->k()` (case 1, `MainActivity`'s dispatcher
 * lambda), which reads prefs `"sensor_Placing"` (1 or 2 — a *mounting*
 * rotation choice, not a protocol detail, see below) and `"SF_INVERTED"`,
 * then calls `MainActivity.S()`/`.U()`. `S()` reads pref keys
 * `"level0_LeftRight"`/`"custom_LeftRight"`; `U()` reads
 * `"level0_FrontBack"`/`"custom_FrontBack"` — confirming **the accelX
 * packet field drives the app's own Left/Right (roll) display, and accelY
 * drives Front/Back (pitch)**, exactly Libell's existing `x`→roll,
 * `y`→pitch convention, for the app's default `sensor_Placing` setting (its
 * stored default is `1`).
 *
 * The official formula itself is `atan2(accel_i, sqrt(other² + other²))`
 * (tilt-compensated, using both other axes) rather than this app's simpler
 * `atan2(x, z)`/`atan2(y, z)` (`src/domain/leveling.ts`) — a formula-shape
 * difference, not an axis or sign bug; the two agree closely over the
 * ±30° range both apps operate in, and Libell intentionally keeps its own
 * formula so every source (phone, `?demo`, EasyLevel) shares one already-
 * tested code path. Not reproduced here.
 *
 * **What #215 could NOT establish from the app alone:** the *absolute*
 * polarity — whether a physically-more-positive accelX reading means the
 * vehicle's right or left side is low — depends on the MEMS chip's
 * package/silkscreen orientation, a hardware fact no amount of app
 * decompilation resolves. The app's own `S()` applies a sign flip
 * (`s1 = -accXangle` for the default placement) that could just as easily
 * be compensating for the chip's polarity as for something else. Absent
 * new evidence, Libell's existing unflipped `x`/`y` passthrough is left
 * unchanged rather than guessing a new sign — flagged here as the one
 * remaining risk a physical box would be needed to close.
 *
 * **Mounting rotation (`"sensor_Placing"`, pref values `1`/`2`) — now
 * implemented (#217):** the app's own settings screen (`dialog_sensor.xml`,
 * `ivSensorPlacing1`/`2`) shows this as two illustrations,
 * `top_wideside_rv.webp` / `top_shortside_rv.webp` — the same physical box
 * rotated 90°, mounted either wide-edge-forward or short-edge-forward. This
 * is a genuine **installation** fact (how one specific user physically
 * bolted the box in), not a protocol fact — the box does not transmit which
 * way it is mounted, so no packet inspection can recover it for any given
 * install; Libell exposes it as a user-facing setting instead (#217,
 * `EasyLevelMounting`/`applyEasyLevelMounting` below), the same way the
 * official app does.
 *
 * `LO0/e;->k()`'s dispatcher (case 1, re-verified against `EasyLevel 5.0.7`
 * directly for #217) computes, from the same `angle.a`/`b`/`c`/`d`
 * (`accnGyrXangle`/`accnGyrYangle`/`accXangle`/`accYangle`) fields
 * regardless of placement:
 * ```
 * placement 1 (default): Left/Right = -accXangle,  Front/Back =  accYangle
 * placement 2:            Left/Right = -accYangle,  Front/Back = -accXangle
 * ```
 * Solving placement 2's pair in terms of placement 1's own (i.e. what
 * placement 2 displays given the same raw reading placement 1 would call
 * `(Roll1, Pitch1)`): `accXangle = -Roll1`, `accYangle = Pitch1`, so
 * `Roll2 = -accYangle = -Pitch1` and `Pitch2 = -accXangle = Roll1` — a
 * clean 90° rotation of the (Roll, Pitch) pair, `(Roll2, Pitch2) =
 * (-Pitch1, Roll1)`, independent of either side's absolute sign
 * convention (only the *relative* rotation between the two placements is
 * used here — Libell's own unresolved absolute-polarity question, above,
 * is unaffected and unchanged by this). `applyEasyLevelMounting` applies
 * that same rotation directly to Libell's own gravity vector: `x` (roll
 * driver) and `y` (pitch driver) become `(-y, x)`; `z` is untouched (bytes
 * 12–17/8–19's calibration and every placement transform in the app only
 * ever remap which raw axis feeds Left/Right vs Front/Back — none of them
 * touch Z).
 *
 * `faf52c22-...`'s battery/temperature/firmware-tier bytes were added later
 * (#123), re-reading the same decompiled sources: under-reported in #116's
 * original pass as "undecoded beyond byte 7," they were not — see
 * `parseEasyLevelStatus` below.
 *
 * Battery and tier-1 temperature truncation (whole units, not fractional)
 * were added after directly decompiling the official `EasyLevel 5.0.7`
 * `.xapk` end to end (`Ly0/a;->i()`'s NOTIFY handler) — #116/#123's earlier
 * passes read the right formulas but missed the `(int)` casts the app
 * applies before its own clamp.
 *
 * **Bytes 8–19 calibration — #215 found these ARE used, contradicting an
 * earlier comment here that claimed they already were applied in Libell's
 * own math (they were not — `parseAccelPacket` ignored them entirely).**
 * `Ly0/a;->i()`'s `faf52c22-...` branch decodes bytes 8–19 as six signed
 * int16 LE — accelX, accelY, accelZ, gyroX, gyroY, gyroZ zero-bias offsets,
 * in the same axis order as the `faf52c21-...` packet — whenever firmware
 * tier ≥ 3 (raw byte7 ≥ 48), storing them for the next accel notification
 * to consume. `D0.b.a()`/the inline `D0.c` tier-≥-5 path both start by
 * subtracting this bias from the raw accel/gyro counts (`accelX_raw -
 * bias.accelX`, additive, matched by axis) *before* scaling by `1/16384`
 * (the standard ±2g/16-bit LSB size) and computing `atan2` — an additive
 * offset applied before the ratio, which does NOT cancel out of `atan2`
 * the way a shared multiplicative scale would. `parseAccelPacket` below
 * now applies this same additive correction.
 *
 * **Legacy firmware calibration (bytes 12–17 of `faf52c21-...` itself,
 * tier < 3) — now implemented (#217):** re-verified directly against
 * `Ly0/a;->i()`'s `faf52c21-...` branch. Whenever the last-known firmware
 * tier byte is < 48 (tier < 3 — read unconditionally, since this ViewModel
 * defaults `this.n` to `16` before any status notification has ever
 * arrived, i.e. the app itself assumes legacy firmware until told
 * otherwise), it reads three MORE signed int16 LE values straight out of
 * the same accel packet at bytes 12–17 — accelX, accelY, accelZ, in that
 * order, no gyro equivalent — into the *identical* bias struct
 * (`D0.b.f`/this module's `EasyLevelCalibration`) the tier-≥-3 status
 * bytes populate, with the gyro fields zeroed, then calls the *same*
 * bias-subtraction function (`D0.b.a()`) tier 3–4 firmware uses. Same
 * offsets, same axes, same additive semantics as the faf52c22 case above —
 * only the wire location differs. This means a legacy accel packet is
 * always 18 bytes, never 6 or 12: tier ≥ 3 firmware's shorter packets
 * never carry bytes 12–17 at all (confirmed by the same decompiled
 * branch), so `parseAccelPacket` below treats "payload ≥ 18 bytes" as a
 * reliable, purely-local proxy for "this is the legacy embedded-
 * calibration format," taking priority over any `calibration` argument
 * passed in — exactly mirroring the official app's own tier gate without
 * needing `parseAccelPacket` to track firmware tier as separate state
 * across calls (this module stays a pure function of each packet's own
 * bytes for this path, unlike the faf52c22-sourced case, which
 * necessarily depends on a previous notification).
 *
 * Deliberate simplification — do not reimplement the box's own filter:
 * `D0.b.a()`/`D0.c`'s tier-≥-3 path runs the bias-corrected accel-only
 * angle through a two-stage complementary filter (concrete IIR
 * coefficients ≈0.0083/0.005 per axis, plus a gyro-rate frame-rotation
 * step) before the app displays it — genuine smoothing/fusion for
 * responsiveness, confirmed structurally distinct from the bias/coordinate
 * correction above (which happens strictly before the filter, on the raw
 * per-sample reading). Libell does NOT reimplement that filter: roll/pitch
 * throughout this app is computed as `atan2(x, z)` / `atan2(y, z)`-style
 * trig (`src/domain/leveling.ts`), which only depends on the RATIO between
 * the (now bias-corrected) accelerometer axes — not their absolute unit or
 * scale. So beyond the bias subtraction, the accel triplet is mapped
 * directly into a `GravityVector` with no unit conversion: proportional
 * units are enough, exactly the same contract the phone sensor already
 * fulfills for `domain/`. This is simpler, avoids guessing undocumented
 * filter constants, and keeps all leveling math in the one already-tested
 * place.
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting } from '../domain/settings';

/**
 * `faf52c21-...` (NOTIFY): 6x signed int16, little-endian, in order
 * accelX, accelY, accelZ, gyroX, gyroY, gyroZ. Some firmware only
 * populates the first 6 bytes (accel only, no gyro) — gyro is never read
 * here anyway, since only the accel ratios feed the gravity vector.
 */
export const ACCEL_PACKET_MIN_BYTES = 6;

/** Anything `DataView`-constructible, or a plain byte array (tests). */
export type PacketBytes = DataView | ArrayBufferLike | ArrayLike<number>;

function toDataView(data: PacketBytes): DataView {
  if (data instanceof DataView) return data;
  if (data instanceof ArrayBuffer) return new DataView(data);
  // A plain array/typed-array-like of byte values (unit tests, mainly).
  return new DataView(Uint8Array.from(data as ArrayLike<number>).buffer);
}

/**
 * Zero-bias offsets decoded from `faf52c22-...` bytes 8–19 (#215) — six
 * signed int16 LE values, same axis order as the `faf52c21-...` accel/gyro
 * packet. Subtracted (additively, per axis) from the raw accel counts
 * before any leveling math, matching `Ly0/a;->i()`'s own
 * `accelX_raw - bias.accelX` step (see the module doc comment above).
 * `gyroX`/`gyroY`/`gyroZ` are decoded for completeness (and to document
 * `faf52c22-...`'s full byte layout) but never consumed downstream — the
 * gyro axes themselves are unused anywhere in this codebase.
 */
export interface EasyLevelCalibration {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

/** Legacy firmware (tier < 3, #217) appends its own accelX/Y/Z bias
 * directly to the `faf52c21-...` packet at bytes 12–17 — see the module
 * doc comment's "Legacy firmware calibration" section. A payload this long
 * (or longer) is never sent by tier-≥-3 firmware, so its presence alone
 * reliably identifies the legacy format, no separate tier tracking needed. */
export const ACCEL_PACKET_WITH_LEGACY_CALIBRATION_MIN_BYTES = 18;

/**
 * Parse `faf52c21-...`'s payload into a `GravityVector`. Returns `null`
 * when the payload is too short to contain even the accel triplet —
 * never throws, since firmware payload length is not fully verified
 * (#116).
 *
 * `calibration` is the most recent `faf52c22-...` bias reading (#215, see
 * `parseEasyLevelStatus`'s `calibration` field) — omitted, or `null` before
 * one has arrived, or on firmware that never provides one (tier < 3), in
 * which case the raw accel counts pass through unmodified, exactly as
 * before #215. Ignored (#217) whenever the payload itself is
 * `ACCEL_PACKET_WITH_LEGACY_CALIBRATION_MIN_BYTES` or longer — that shape
 * only ever occurs on legacy (tier < 3) firmware, which carries its own
 * bias at bytes 12–17 instead, taking priority the same way the official
 * app's own tier gate would.
 */
export function parseAccelPacket(
  data: PacketBytes,
  calibration?: EasyLevelCalibration | null,
): GravityVector | null {
  const view = toDataView(data);
  if (view.byteLength < ACCEL_PACKET_MIN_BYTES) return null;
  const x = view.getInt16(0, true);
  const y = view.getInt16(2, true);
  const z = view.getInt16(4, true);
  const bias =
    view.byteLength >= ACCEL_PACKET_WITH_LEGACY_CALIBRATION_MIN_BYTES
      ? {
          accelX: view.getInt16(12, true),
          accelY: view.getInt16(14, true),
          accelZ: view.getInt16(16, true),
        }
      : calibration;
  if (!bias) return { x, y, z };
  return {
    x: x - bias.accelX,
    y: y - bias.accelY,
    z: z - bias.accelZ,
  };
}

/**
 * Applies the official app's `"sensor_Placing"` mounting transform (#217)
 * to an already bias-corrected `GravityVector` — a 90° rotation of the
 * (x, y) pair for `'rotated90'`, `z` untouched; a no-op for `'standard'`.
 * See the module doc comment for the exact derivation from
 * `LO0/e;->k()`'s decompiled placement-1/2 branches. Deliberately a
 * separate step from `parseAccelPacket` (called after it, never inside
 * it): mounting is a Libell-side *display/orientation* choice the user
 * sets, not a fact recoverable from the packet itself the way calibration
 * is, and this keeps it trivially provable never to reach any other
 * `OrientationSensor` (the phone sensor never calls this function at all).
 */
export function applyEasyLevelMounting(
  gravity: GravityVector,
  mounting: EasyLevelMounting,
): GravityVector {
  if (mounting === 'standard') return gravity;
  return { x: -gravity.y, y: gravity.x, z: gravity.z };
}

/**
 * `faf52c22-...` (NOTIFY/READ) status payload (#123) — battery, temperature,
 * firmware tier and (#215) calibration, decoded straight from the official
 * app's decompiled `Ly0/a;->i()` NOTIFY handler (class names are from the
 * `EasyLevel 5.0.7` `.xapk` decompiled for #215 — obfuscated names are not
 * stable across builds, see the module doc comment's `#116`/`#123`-era
 * names for the same handler in an earlier build). Bytes 8–19 additionally
 * carry six little-endian int16 zero/calibration values on firmware tier
 * ≥ 3 (byte7 ≥ 48) — see `calibration` below; #215 found these were
 * decoded by neither this function nor `parseAccelPacket`, contradicting
 * an earlier version of this comment that claimed they were already used.
 */
export const STATUS_PACKET_MIN_BYTES = 8;
/** Bytes 8–19 (`calibration`, #215) additionally require this many. */
export const STATUS_PACKET_WITH_CALIBRATION_MIN_BYTES = 20;
/** `firmwareTierFromByte`'s tier at and above which `faf52c22-...` carries
 * the bytes-8–19 calibration block (see the module doc comment, #215). */
const CALIBRATION_MIN_FIRMWARE_TIER = 3;

export interface EasyLevelStatus {
  /** Byte 7, tiered 1–7 (see `firmwareTierFromByte`) — which temperature
   * formula applies, and how many calibration int16s (if any) follow. */
  firmwareTier: number;
  /** Bytes 2–3, little-endian uint16 "rawMv" run through
   * `clamp(trunc(rawMv × 0.1 − 200), 0, 100)` — a clean 2.0–3.0 V window
   * matching the CR2450 coin cell the EasyLevel manual specifies. Truncated
   * to a whole percent: the official app's own `(int)` cast does this
   * before its clamp, confirmed by decompiling `EasyLevel 5.0.7`'s
   * `Ly0/a;->i()` handler directly (not just a bytecode fragment
   * read, as #116's original pass was). */
  batteryPercent: number;
  /** Firmware-tier-dependent formula (see `parseEasyLevelStatus`). */
  temperatureCelsius: number;
  /** Bytes 8–19 (#215) — `null` when the payload is shorter than
   * `STATUS_PACKET_WITH_CALIBRATION_MIN_BYTES` or `firmwareTier` is below
   * `CALIBRATION_MIN_FIRMWARE_TIER`, matching the official app's own gate
   * (it never reads these bytes on older firmware either). Feed this
   * straight into `parseAccelPacket`'s `calibration` parameter. */
  calibration: EasyLevelCalibration | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Byte 7's tier thresholds — firmware tier 1 (byte7 < 32) uses one
 * temperature formula, tier 2+ (byte7 ≥ 32) another; the remaining
 * thresholds (48/64/80/96/112) only matter for the calibration-bytes gate
 * (tier ≥ 3) and diagnostics, not the temperature formula itself.
 *
 * `byte7` is the raw byte value (0–255), same as everywhere else in this
 * file — but the official app reads it into a Java `byte` (-128..127) and
 * compares *that* signed value against these thresholds, confirmed by
 * decompiling `EasyLevel 5.0.7` directly. Sign extension means any raw
 * byte ≥ 128 is always negative in the app's own comparison, and therefore
 * always resolves to tier 1 — never tier 5–7, however high the raw byte
 * is. Almost certainly never hit by any real box (tier climbs by 16 per
 * step, so byte7 ≥ 128 would already be an unheard-of tier 8+), but this
 * matches the app's own byte-for-byte behavior rather than a plausible-
 * looking guess, for the exact "unfamiliar firmware tier" case the debug
 * page (`easyLevelStatusPage.ts`) exists to surface honestly.
 */
export function firmwareTierFromByte(byte7: number): number {
  const signed = byte7 >= 128 ? byte7 - 256 : byte7;
  if (signed < 32) return 1;
  if (signed < 48) return 2;
  if (signed < 64) return 3;
  if (signed < 80) return 4;
  if (signed < 96) return 5;
  if (signed < 112) return 6;
  return 7;
}

/**
 * Parse `faf52c22-...`'s payload into battery/temperature/firmware-tier
 * and (#215) calibration. Returns `null` when the payload is too short to
 * contain even the first 8 bytes this needs — never throws, same "firmware
 * payload length is not fully verified" discipline `parseAccelPacket`
 * follows (#116/#123).
 */
export function parseEasyLevelStatus(data: PacketBytes): EasyLevelStatus | null {
  const view = toDataView(data);
  if (view.byteLength < STATUS_PACKET_MIN_BYTES) return null;

  const byte7 = view.getUint8(7);
  const firmwareTier = firmwareTierFromByte(byte7);

  // The official app truncates toward zero (a Java `(int)` cast) before
  // clamping — battery is always a whole percent, never fractional.
  const rawMv = view.getUint16(2, true);
  const batteryPercent = clamp(Math.trunc(rawMv * 0.1 - 200), 0, 100);

  // Firmware tier 1 boxes pack temperature into byte 0 alone (signed,
  // 1/16 °C per unit); tier 2+ upgraded to a full signed int16 LE across
  // bytes 0–1 at 1/100 °C per unit. Branching on the tier here, not just
  // implementing the newer formula, matters: an old-firmware box would
  // otherwise report a wrong temperature. Tier 1 additionally truncates to
  // a whole degree (another `(int)` cast in the official app, applied only
  // on this branch — tier 2+ keeps the fractional 1/100 °C precision).
  //
  // Branches on `firmwareTier === 1` (not `byte7 < 32` directly) so this
  // stays exactly in sync with `firmwareTierFromByte`'s own signed-byte
  // comparison above — including its byte7 ≥ 128 quirk — with no risk of
  // the two silently drifting apart.
  const temperatureCelsius =
    firmwareTier === 1
      ? clamp(Math.trunc(view.getInt8(0) / 16 + 25), -40, 80)
      : clamp(view.getInt16(0, true) / 100, -40, 80);

  // Bytes 8–19 (#215) — six signed int16 LE zero-bias values, gated the
  // same way the official app gates them: both a long-enough payload and
  // firmware tier ≥ 3. Older firmware's `faf52c22-...` genuinely has
  // nothing here (the app never reads past byte 7 on that firmware either).
  const calibration: EasyLevelCalibration | null =
    view.byteLength >= STATUS_PACKET_WITH_CALIBRATION_MIN_BYTES &&
    firmwareTier >= CALIBRATION_MIN_FIRMWARE_TIER
      ? {
          accelX: view.getInt16(8, true),
          accelY: view.getInt16(10, true),
          accelZ: view.getInt16(12, true),
          gyroX: view.getInt16(14, true),
          gyroY: view.getInt16(16, true),
          gyroZ: view.getInt16(18, true),
        }
      : null;

  return { firmwareTier, batteryPercent, temperatureCelsius, calibration };
}

/**
 * Low-battery warning threshold + hysteresis band (#123) — a plain
 * two-state flag, not a full dead-band/dwell stabilizer: this feeds a
 * single settings-page indicator refreshed on menu open
 * (`sensorSourceSection.ts`), not a continuously-redrawn live value like
 * `domain/stability.ts`'s wheel readouts, so a simple sustain band is
 * enough to keep it from flickering right at the threshold. Enters the
 * "low" state below `LOW_BATTERY_PERCENT`, and only leaves it once back
 * above `LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT`.
 */
export const LOW_BATTERY_PERCENT = 20;
export const LOW_BATTERY_HYSTERESIS_PERCENT = 3;

export function isLowBattery(batteryPercent: number, wasLow: boolean): boolean {
  return wasLow
    ? batteryPercent < LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT
    : batteryPercent < LOW_BATTERY_PERCENT;
}
