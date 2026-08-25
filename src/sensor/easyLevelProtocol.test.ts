import { describe, expect, it } from 'vitest';
import {
  firmwareTierFromByte,
  isLowBattery,
  LOW_BATTERY_HYSTERESIS_PERCENT,
  LOW_BATTERY_PERCENT,
  parseAccelPacket,
  parseEasyLevelStatus,
} from './easyLevelProtocol';

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

/**
 * Builds an `faf52c22-...` status payload: byte0/byte1 hold the
 * temperature bits (interpretation depends on firmware tier), bytes 2–3
 * the little-endian `rawMv` battery reading, bytes 4–6 unused padding, and
 * byte 7 the firmware-tier byte. `byte0`/`byte1` are taken as raw unsigned
 * byte values (0–255) so both the FW1 signed-int8 and FW2+ signed-int16
 * interpretations can be exercised from the same low-level builder.
 */
function statusBytes(byte0: number, byte1: number, rawMv: number, byte7: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(8));
  view.setUint8(0, byte0);
  view.setUint8(1, byte1);
  view.setUint16(2, rawMv, true);
  view.setUint8(7, byte7);
  return new Uint8Array(view.buffer);
}

/** Two's-complement encode a signed int16 into its low/high unsigned bytes. */
function int16Bytes(value: number): [number, number] {
  const u = value < 0 ? 0x10000 + value : value;
  return [u & 0xff, (u >> 8) & 0xff];
}

describe('parseEasyLevelStatus (#123)', () => {
  it('returns null for a payload shorter than the 8 bytes battery/temp/tier need, never throws', () => {
    expect(parseEasyLevelStatus([])).toBeNull();
    expect(parseEasyLevelStatus([1, 2, 3])).toBeNull();
    expect(parseEasyLevelStatus(new Uint8Array(7))).toBeNull();
  });

  it('accepts exactly 8 bytes (no calibration bytes present, firmware tier < 3)', () => {
    const bytes = statusBytes(0, 0, 2500, 0);
    expect(parseEasyLevelStatus(bytes)).not.toBeNull();
  });

  it('ignores any trailing calibration bytes (tier ≥ 3, bytes 8–19) — only the first 8 matter here', () => {
    const short = statusBytes(0, 0, 2500, 48);
    const long = new Uint8Array(20);
    long.set(short);
    expect(parseEasyLevelStatus(long)).toEqual(parseEasyLevelStatus(short));
  });

  describe('battery: clamp(rawMv × 0.1 − 200, 0, 100)', () => {
    it('maps the documented 2.0–3.0 V window linearly', () => {
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2000, 0))?.batteryPercent).toBeCloseTo(0);
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, 0))?.batteryPercent).toBeCloseTo(50);
      expect(parseEasyLevelStatus(statusBytes(0, 0, 3000, 0))?.batteryPercent).toBeCloseTo(100);
    });

    it('clamps a very low rawMv to 0%, never negative', () => {
      expect(parseEasyLevelStatus(statusBytes(0, 0, 0, 0))?.batteryPercent).toBe(0);
    });

    it('clamps a very high rawMv to 100%, never over', () => {
      expect(parseEasyLevelStatus(statusBytes(0, 0, 65535, 0))?.batteryPercent).toBe(100);
    });
  });

  describe('temperature: firmware-tier-dependent formula', () => {
    it('firmware tier 1 (byte7 < 32): clamp(byte[0] / 16 + 25, -40, 80), byte[0] signed', () => {
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, 0))?.temperatureCelsius).toBeCloseTo(25);
      expect(parseEasyLevelStatus(statusBytes(16, 0, 2500, 0))?.temperatureCelsius).toBeCloseTo(26);
      // byte[0] = -16 as an unsigned byte is 240.
      expect(parseEasyLevelStatus(statusBytes(240, 0, 2500, 31))?.temperatureCelsius).toBeCloseTo(
        24,
      );
    });

    it('firmware tier 2+ (byte7 >= 32): clamp(int16LE(bytes[0..1]) / 100, -40, 80)', () => {
      const [lo, hi] = int16Bytes(2550);
      expect(parseEasyLevelStatus(statusBytes(lo, hi, 2500, 32))?.temperatureCelsius).toBeCloseTo(
        25.5,
      );
      const [nlo, nhi] = int16Bytes(-500);
      expect(
        parseEasyLevelStatus(statusBytes(nlo, nhi, 2500, 112))?.temperatureCelsius,
      ).toBeCloseTo(-5);
    });

    it('does NOT just apply the FW2+ path regardless of tier — a tier-1 box with the same bytes reads differently', () => {
      const [lo, hi] = int16Bytes(2550);
      const tier1 = parseEasyLevelStatus(statusBytes(lo, hi, 2500, 0))!;
      const tier2 = parseEasyLevelStatus(statusBytes(lo, hi, 2500, 32))!;
      expect(tier1.temperatureCelsius).not.toBeCloseTo(tier2.temperatureCelsius, 1);
    });

    it('clamps an extreme FW2+ reading to the -40..80 band at both ends', () => {
      const [hiLo, hiHi] = int16Bytes(10000);
      expect(parseEasyLevelStatus(statusBytes(hiLo, hiHi, 2500, 32))?.temperatureCelsius).toBe(80);
      const [loLo, loHi] = int16Bytes(-10000);
      expect(parseEasyLevelStatus(statusBytes(loLo, loHi, 2500, 32))?.temperatureCelsius).toBe(-40);
    });
  });

  describe('firmwareTierFromByte: thresholds at 32/48/64/80/96/112', () => {
    it.each([
      [0, 1],
      [31, 1],
      [32, 2],
      [47, 2],
      [48, 3],
      [63, 3],
      [64, 4],
      [79, 4],
      [80, 5],
      [95, 5],
      [96, 6],
      [111, 6],
      [112, 7],
      [255, 7],
    ])('byte7 = %i -> tier %i', (byte7, tier) => {
      expect(firmwareTierFromByte(byte7)).toBe(tier);
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, byte7))?.firmwareTier).toBe(tier);
    });
  });
});

describe('isLowBattery (#123)', () => {
  it('enters the low state once battery drops below LOW_BATTERY_PERCENT', () => {
    expect(isLowBattery(LOW_BATTERY_PERCENT + 1, false)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT, false)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT - 1, false)).toBe(true);
  });

  it('does not leave the low state until back above the hysteresis band, not just the bare threshold', () => {
    // Still below threshold + hysteresis — stays low even though it's
    // technically back above the bare LOW_BATTERY_PERCENT threshold.
    const justAboveThreshold = LOW_BATTERY_PERCENT + 1;
    expect(justAboveThreshold).toBeLessThan(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT);
    expect(isLowBattery(justAboveThreshold, true)).toBe(true);
  });

  it('leaves the low state once clearly above the hysteresis band', () => {
    expect(isLowBattery(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT, true)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT + 1, true)).toBe(
      false,
    );
  });

  it('never flickers right at the bare threshold while already low', () => {
    // A reading oscillating around LOW_BATTERY_PERCENT itself must stay
    // "low" throughout, since it never clears the hysteresis band.
    let low = true;
    for (const percent of [19, 21, 19, 20, 19]) {
      low = isLowBattery(percent, low);
      expect(low).toBe(true);
    }
  });
});
