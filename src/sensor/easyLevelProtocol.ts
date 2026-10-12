/**
 * EasyLevel BLE box — pure packet parsing, kept apart from the Web
 * Bluetooth transport so it is testable with plain byte arrays.
 *
 * Reverse-engineered by decompiling the official Android apps
 * (`EasyLevel 5.0.7`, `EasyLevelRV 2.5.0` — same logic under different
 * obfuscated names — and `EasyLevelRV 2.2.2`, map-based dispatch,
 * consistent as far as checked); no public spec exists. Class names below
 * are from `EasyLevel 5.0.7` and are not stable across builds:
 * `Lz0/b$b;->onCharacteristicChanged()` calls `Ly0/a;->i(characteristic,
 * value)`, the app's BLE ViewModel, which branches on the UUID.
 *
 * **Axis mapping:** the `faf52c21-...` branch reads bytes 0–5 as signed
 * int16 LE accelX/Y/Z (6–11 gyroX/Y/Z). They feed `C0.a`, whose
 * `toString()` names its fields `accnGyrXangle`, `accnGyrYangle`
 * (gyro-fused), `accXangle`, `accYangle` (accel-only). `LO0/e;->k()`
 * (case 1, `MainActivity`'s dispatcher) reads prefs `"sensor_Placing"` and
 * `"SF_INVERTED"`, then `MainActivity.S()` (`"level0_LeftRight"`) and
 * `.U()` (`"level0_FrontBack"`): **accelX drives Left/Right (roll), accelY
 * drives Front/Back (pitch)** — Libell's `x`→roll, `y`→pitch, for the
 * default `sensor_Placing` of `1`.
 *
 * The app's formula is `atan2(accel_i, sqrt(other² + other²))`; Libell
 * keeps its simpler `atan2(x, z)`/`atan2(y, z)` (`src/domain/leveling.ts`)
 * so every source shares one tested path. The two agree closely over the
 * ±30° range both operate in.
 *
 * **Unresolved: absolute polarity.** Whether a more positive accelX means
 * the right or left side is low depends on the MEMS chip's mounting on the
 * board, which decompilation cannot reveal. The app's `S()` negates
 * (`-accXangle`) for the default placement, which could be compensating
 * for the chip or for something else. Libell passes `x`/`y` through
 * unflipped; only a physical box can settle this.
 *
 * **Mounting rotation (`"sensor_Placing"` 1/2):** the app's settings
 * (`dialog_sensor.xml`, `top_wideside_rv.webp` / `top_shortside_rv.webp`)
 * show the same box rotated 90°. The box does not transmit how it is
 * mounted, so it is a user setting (`applyEasyLevelMounting`). `LO0/e;->k()`
 * computes, from the same fields regardless of placement:
 * ```
 * placement 1 (default): Left/Right = -accXangle,  Front/Back =  accYangle
 * placement 2:            Left/Right = -accYangle,  Front/Back = -accXangle
 * ```
 * so `(Roll2, Pitch2) = (-Pitch1, Roll1)` — a clean 90° rotation,
 * independent of the unresolved absolute polarity. On the gravity vector
 * that is `(x, y)` → `(-y, x)`; `z` is untouched (no placement transform
 * or calibration in the app ever remaps Z).
 *
 * **Calibration bias, tier ≥ 3:** the `faf52c22-...` branch decodes bytes
 * 8–19 as six signed int16 LE zero-bias offsets (accelX/Y/Z, gyroX/Y/Z)
 * when firmware tier ≥ 3 (raw byte7 ≥ 48), stored for the next accel
 * notification. `D0.b.a()` subtracts them from the raw counts (additive,
 * per axis) *before* scaling by `1/16384` and `atan2` — an additive offset
 * does NOT cancel out of `atan2`, so `parseAccelPacket` applies it too.
 *
 * **Calibration bias, legacy tier < 3:** the ViewModel defaults its tier
 * to `16` (legacy) until a status notification arrives, and on legacy
 * firmware reads accelX/Y/Z bias from bytes 12–17 of the `faf52c21-...`
 * packet itself (gyro zeroed) into the same struct, through the same
 * `D0.b.a()`. A legacy accel packet is therefore always 18 bytes and newer
 * firmware's never carries bytes 12–17, so "payload ≥ 18 bytes" identifies
 * the legacy format with no tier state across calls.
 *
 * **Deliberately not reimplemented:** the app's tier-≥-3 two-stage
 * complementary filter (IIR ≈0.0083/0.005 per axis plus a gyro-rate
 * rotation step), which runs after the bias correction. Libell's leveling
 * trig depends only on the ratio between the bias-corrected axes, so the
 * accel triplet maps straight into a `GravityVector` with no unit
 * conversion — the same contract the phone sensor fulfills.
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting } from '../domain/settings';

/**
 * `faf52c21-...` (NOTIFY): 6x signed int16, little-endian, in order
 * accelX, accelY, accelZ, gyroX, gyroY, gyroZ. Some firmware only
 * populates the first 6 bytes (accel only, no gyro) — gyro is never read
 * here anyway, since only the accel ratios feed the gravity vector.
 */
const ACCEL_PACKET_MIN_BYTES = 6;

/** Anything `DataView`-constructible, or a plain byte array (tests). */
export type PacketBytes = DataView | ArrayBufferLike | ArrayLike<number>;

function toDataView(data: PacketBytes): DataView {
  if (data instanceof DataView) return data;
  if (data instanceof ArrayBuffer) return new DataView(data);
  // A plain array/typed-array-like of byte values (unit tests, mainly).
  return new DataView(Uint8Array.from(data as ArrayLike<number>).buffer);
}

/**
 * Zero-bias offsets from `faf52c22-...` bytes 8–19, same axis order as the
 * `faf52c21-...` packet, subtracted per axis from the raw accel counts.
 * The gyro fields document the full byte layout but are never consumed.
 */
export interface EasyLevelCalibration {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

/** Legacy firmware (tier < 3) appends its own accelX/Y/Z bias to the
 * `faf52c21-...` packet at bytes 12–17; tier-≥-3 firmware never sends a
 * payload this long, so its length alone identifies the legacy format. */
const ACCEL_PACKET_WITH_LEGACY_CALIBRATION_MIN_BYTES = 18;

/**
 * Parse `faf52c21-...`'s payload into a `GravityVector`. Returns `null`
 * when the payload is too short for the accel triplet — never throws,
 * since firmware payload length is not fully verified.
 *
 * `calibration` is the latest `faf52c22-...` bias; without one the raw
 * counts pass through. Ignored when the payload carries its own legacy
 * bias (`ACCEL_PACKET_WITH_LEGACY_CALIBRATION_MIN_BYTES` or longer),
 * mirroring the official app's tier gate.
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
 * Applies the user's mounting to an already bias-corrected
 * `GravityVector` — a quarter, half or three-quarter turn of (x, y), `z`
 * untouched; a no-op for `'standard'`.
 *
 * **Why four, when the official app offers two:** a box can just as
 * easily end up 180° or 270° round, and those are the dangerous two: they
 * invert a sign, which the installation offset (R34, a constant) cannot
 * undo — level still reads level, then the app names the wrong wheel. The
 * extra two are continuations of the same rotation group derived from
 * `LO0/e;->k()`, not separately reverse-engineered.
 *
 * Kept separate from `parseAccelPacket`: mounting is a user setting, not a
 * packet fact, and this way it never reaches another `OrientationSensor`.
 */
export function applyEasyLevelMounting(
  gravity: GravityVector,
  mounting: EasyLevelMounting,
): GravityVector {
  switch (mounting) {
    case 'rotated90':
      return { x: -gravity.y, y: gravity.x, z: gravity.z };
    case 'rotated180':
      return { x: -gravity.x, y: -gravity.y, z: gravity.z };
    case 'rotated270':
      return { x: gravity.y, y: -gravity.x, z: gravity.z };
    default:
      return gravity;
  }
}

/**
 * `faf52c22-...` (NOTIFY/READ) status payload — battery, temperature and
 * firmware tier, plus calibration in bytes 8–19 on firmware tier ≥ 3
 * (byte7 ≥ 48), as decoded by the app's `Ly0/a;->i()` handler.
 */
const STATUS_PACKET_MIN_BYTES = 8;
/** Bytes 8–19 (`calibration`) additionally require this many. */
const STATUS_PACKET_WITH_CALIBRATION_MIN_BYTES = 20;
/** `firmwareTierFromByte`'s tier at and above which `faf52c22-...` carries
 * the bytes-8–19 calibration block. */
const CALIBRATION_MIN_FIRMWARE_TIER = 3;

export interface EasyLevelStatus {
  /** Byte 7, tiered 1–7 (see `firmwareTierFromByte`) — which temperature
   * formula applies, and how many calibration int16s (if any) follow. */
  firmwareTier: number;
  /** Bytes 2–3, little-endian uint16 "rawMv" run through
   * `clamp(trunc(rawMv × 0.1 − 200), 0, 100)` — a clean 2.0–3.0 V window
   * matching the CR2450 coin cell the EasyLevel manual specifies. Truncated
   * to a whole percent, like the official app's `(int)` cast before its
   * clamp. */
  batteryPercent: number;
  /** Firmware-tier-dependent formula (see `parseEasyLevelStatus`). */
  temperatureCelsius: number;
  /** Bytes 8–19 — `null` when the payload is shorter than
   * `STATUS_PACKET_WITH_CALIBRATION_MIN_BYTES` or `firmwareTier` is below
   * `CALIBRATION_MIN_FIRMWARE_TIER`, matching the official app's gate. Feed
   * this into `parseAccelPacket`'s `calibration` parameter. */
  calibration: EasyLevelCalibration | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Byte 7's tier thresholds — tier 1 (byte7 < 32) and tier 2+ use different
 * temperature formulas; the higher thresholds only matter for the
 * calibration gate (tier ≥ 3) and diagnostics.
 *
 * `byte7` is the raw 0–255 value, but the official app compares it as a
 * signed Java `byte`, so any raw byte ≥ 128 resolves to tier 1. Unlikely
 * on a real box, but mirrored byte for byte so the debug page shows an
 * unfamiliar tier honestly.
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
 * Parse `faf52c22-...`'s payload. Returns `null` when it is shorter than
 * the 8 bytes this needs — never throws, since firmware payload length is
 * not fully verified.
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

  // Tier 1 packs temperature into byte 0 alone (signed, 1/16 °C per unit,
  // offset 25, truncated to a whole degree by the app's `(int)` cast); tier
  // 2+ uses a signed int16 LE across bytes 0–1 at 1/100 °C. Branches on
  // `firmwareTier`, not `byte7 < 32`, so the signed-byte quirk stays in one
  // place.
  const temperatureCelsius =
    firmwareTier === 1
      ? clamp(Math.trunc(view.getInt8(0) / 16 + 25), -40, 80)
      : clamp(view.getInt16(0, true) / 100, -40, 80);

  // Gated like the official app: a long-enough payload and tier ≥ 3 (the
  // app never reads past byte 7 on older firmware).
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
