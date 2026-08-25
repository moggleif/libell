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
