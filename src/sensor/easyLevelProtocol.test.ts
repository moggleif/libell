import { describe, expect, it } from 'vitest';
import { parseAccelPacket } from './easyLevelProtocol';

/** Build a little-endian int16 byte array from signed values. */
function le16(...values: number[]): number[] {
  const bytes: number[] = [];
  for (const v of values) {
    const u = v < 0 ? 0x10000 + v : v;
    bytes.push(u & 0xff, (u >> 8) & 0xff);
  }
  return bytes;
}

describe('parseAccelPacket (#116)', () => {
  it('parses the accel-only 6-byte payload some firmware sends', () => {
    const bytes = le16(100, -200, 9800);
    expect(parseAccelPacket(bytes)).toEqual({ x: 100, y: -200, z: 9800 });
  });

  it('parses the full 12-byte accel+gyro payload, ignoring the gyro bytes', () => {
    const bytes = le16(100, -200, 9800, 5, -5, 0);
    expect(parseAccelPacket(bytes)).toEqual({ x: 100, y: -200, z: 9800 });
  });

  it('handles negative values as two-s complement, not unsigned', () => {
    const bytes = le16(-1, -32768, 32767);
    expect(parseAccelPacket(bytes)).toEqual({ x: -1, y: -32768, z: 32767 });
  });

  it('returns null for a payload shorter than the accel triplet, never throws', () => {
    expect(parseAccelPacket([])).toBeNull();
    expect(parseAccelPacket([1, 2, 3])).toBeNull();
    expect(parseAccelPacket(new Uint8Array(5))).toBeNull();
  });

  it('accepts a DataView directly, as the real characteristic.value provides', () => {
    const bytes = Uint8Array.from(le16(1, 2, 3));
    const view = new DataView(bytes.buffer);
    expect(parseAccelPacket(view)).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('accepts a raw ArrayBuffer', () => {
    const bytes = Uint8Array.from(le16(7, 8, 9));
    expect(parseAccelPacket(bytes.buffer)).toEqual({ x: 7, y: 8, z: 9 });
  });

  it('is scale-invariant, matching the phone sensor contract: only ratios matter downstream', () => {
    // Same direction, wildly different absolute scale — atan2-based
    // roll/pitch (domain/leveling.ts) must treat these identically, so
    // this deliberately does NOT convert units, per the design note above.
    const small = parseAccelPacket(le16(1, 2, 100))!;
    const large = parseAccelPacket(le16(10, 20, 1000))!;
    expect(Math.atan2(small.x, small.z)).toBeCloseTo(Math.atan2(large.x, large.z), 10);
    expect(Math.atan2(small.y, small.z)).toBeCloseTo(Math.atan2(large.y, large.z), 10);
  });
});
