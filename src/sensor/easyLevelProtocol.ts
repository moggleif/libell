/**
 * EasyLevel BLE box — pure packet parsing (#116).
 *
 * Reverse-engineered by decompiling three versions of the official
 * EasyLevel/EasyLevelRV apps (see issue #116) — no public spec exists, and
 * no physical box has been available to verify against. Kept in its own
 * module, separate from `easyLevelSensor.ts`'s Web Bluetooth transport,
 * so the byte parsing is fully unit-testable with plain synthetic byte
 * arrays — no `navigator.bluetooth` mocking needed. This mirrors the
 * transport/protocol split #119's iOS bridge issue calls for.
 *
 * `faf52c22-...`'s battery/temperature/firmware-tier bytes were added later
 * (#123), re-reading the same decompiled sources: under-reported in #116's
 * original pass as "undecoded beyond byte 7," they were not — see
 * `parseEasyLevelStatus` below.
 *
 * Deliberate simplification — do not reimplement the box's own filter:
 * the box's firmware runs its own complementary/low-pass filter on top of
 * the raw accel+gyro values to produce its own roll/pitch. Libell does
 * NOT reimplement that (undocumented, guessable-only) filter. Roll/pitch
 * throughout this app is computed as `atan2(x, z)` / `atan2(y, z)`-style
 * trig (`src/domain/leveling.ts`), which only depends on the RATIO
 * between the accelerometer axes — not their absolute unit or scale. So
 * the raw int16 accel triplet is mapped directly into a `GravityVector`
 * with no unit conversion: proportional units are enough, exactly the
 * same contract the phone sensor already fulfills for `domain/`. This is
 * simpler, avoids guessing undocumented filter constants, and keeps all
 * leveling math in the one already-tested place.
 */
import type { GravityVector } from '../domain/leveling';

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
 * Parse `faf52c21-...`'s payload into a `GravityVector`. Returns `null`
 * when the payload is too short to contain even the accel triplet —
 * never throws, since firmware payload length is not fully verified
 * (#116).
 */
export function parseAccelPacket(data: PacketBytes): GravityVector | null {
  const view = toDataView(data);
  if (view.byteLength < ACCEL_PACKET_MIN_BYTES) return null;
  return {
    x: view.getInt16(0, true),
    y: view.getInt16(2, true),
    z: view.getInt16(4, true),
  };
}

/**
 * `faf52c22-...` (NOTIFY/READ) status payload (#123) — battery, temperature
 * and firmware tier, decoded straight from the official app's decompiled
 * `x0/C1656f.java` (`i()`, the NOTIFY handler for this characteristic).
 * Bytes 8–19 additionally carry six little-endian int16 zero/calibration
 * values on firmware tier ≥ 3 (byte7 ≥ 48) — already read and used in the
 * leveling math since #116; only the first 8 bytes (battery + temperature +
 * firmware tier) are this function's concern.
 */
export const STATUS_PACKET_MIN_BYTES = 8;

export interface EasyLevelStatus {
  /** Byte 7, tiered 1–7 (see `firmwareTierFromByte`) — which temperature
   * formula applies, and how many calibration int16s (if any) follow. */
  firmwareTier: number;
  /** Bytes 2–3, little-endian uint16 "rawMv" run through
   * `clamp(rawMv × 0.1 − 200, 0, 100)` — a clean 2.0–3.0 V window matching
   * the CR2450 coin cell the EasyLevel manual specifies. */
  batteryPercent: number;
  /** Firmware-tier-dependent formula (see `parseEasyLevelStatus`). */
  temperatureCelsius: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Byte 7's tier thresholds — firmware tier 1 (byte7 < 32) uses one
 * temperature formula, tier 2+ (byte7 ≥ 32) another; the remaining
 * thresholds (48/64/80/96/112) only matter for the calibration-bytes gate
 * (tier ≥ 3) and diagnostics, not the temperature formula itself.
 */
export function firmwareTierFromByte(byte7: number): number {
  if (byte7 < 32) return 1;
  if (byte7 < 48) return 2;
  if (byte7 < 64) return 3;
  if (byte7 < 80) return 4;
  if (byte7 < 96) return 5;
  if (byte7 < 112) return 6;
  return 7;
}

/**
 * Parse `faf52c22-...`'s payload into battery/temperature/firmware-tier.
 * Returns `null` when the payload is too short to contain even the first
 * 8 bytes this needs — never throws, same "firmware payload length is not
 * fully verified" discipline `parseAccelPacket` follows (#116/#123).
 */
export function parseEasyLevelStatus(data: PacketBytes): EasyLevelStatus | null {
  const view = toDataView(data);
  if (view.byteLength < STATUS_PACKET_MIN_BYTES) return null;

  const byte7 = view.getUint8(7);
  const firmwareTier = firmwareTierFromByte(byte7);

  const rawMv = view.getUint16(2, true);
  const batteryPercent = clamp(rawMv * 0.1 - 200, 0, 100);

  // Firmware tier 1 boxes pack temperature into byte 0 alone (signed,
  // 1/16 °C per unit); tier 2+ upgraded to a full signed int16 LE across
  // bytes 0–1 at 1/100 °C per unit. Branching on byte7 here, not just
  // implementing the newer formula, matters: an old-firmware box would
  // otherwise report a wrong temperature.
  const temperatureCelsius =
    byte7 < 32
      ? clamp(view.getInt8(0) / 16 + 25, -40, 80)
      : clamp(view.getInt16(0, true) / 100, -40, 80);

  return { firmwareTier, batteryPercent, temperatureCelsius };
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
