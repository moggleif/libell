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

  describe('calibration bias subtraction (#215)', () => {
    // Ly0/a;->i()'s tier-≥-3 path computes `accelX_raw - bias.accelX` (and
    // the same for Y/Z) BEFORE scaling and atan2 — an additive correction,
    // matched here rather than the "atan2 only cares about ratios, so a
    // shared scale factor would cancel out" argument the issue explicitly
    // warned does not apply to an additive offset.
    it('subtracts the bias from x/y/z when calibration is given', () => {
      const bytes = le16(1000, -500, 9800);
      const calibration = { accelX: 200, accelY: -50, accelZ: 100, gyroX: 0, gyroY: 0, gyroZ: 0 };
      expect(parseAccelPacket(bytes, calibration)).toEqual({ x: 800, y: -450, z: 9700 });
    });

    it('passes raw values through unmodified when calibration is omitted, matching every existing call site untouched by #215', () => {
      const bytes = le16(1000, -500, 9800);
      expect(parseAccelPacket(bytes)).toEqual({ x: 1000, y: -500, z: 9800 });
    });

    it('passes raw values through unmodified when calibration is explicitly null (no faf52c22 status yet, or firmware tier < 3)', () => {
      const bytes = le16(1000, -500, 9800);
      expect(parseAccelPacket(bytes, null)).toEqual({ x: 1000, y: -500, z: 9800 });
    });

    it('never touches the gyro fields the calibration also carries — gyro is unused throughout this codebase', () => {
      const bytes = le16(1000, -500, 9800);
      const calibration = {
        accelX: 0,
        accelY: 0,
        accelZ: 0,
        gyroX: 9999,
        gyroY: 9999,
        gyroZ: 9999,
      };
      expect(parseAccelPacket(bytes, calibration)).toEqual({ x: 1000, y: -500, z: 9800 });
    });

    it('a bias that exactly matches the raw reading zeroes that axis out, the expected "box calibrated to its own zero point" case', () => {
      const bytes = le16(42, -17, 9800);
      const calibration = { accelX: 42, accelY: -17, accelZ: 0, gyroX: 0, gyroY: 0, gyroZ: 0 };
      expect(parseAccelPacket(bytes, calibration)).toEqual({ x: 0, y: 0, z: 9800 });
    });

    it('demonstrates why the offset must be subtracted before atan2, not skipped as "only ratios matter" — an uncorrected bias changes the angle, a corrected one recovers the true one', () => {
      // A box whose true tilt is x=0,y=0 (flat), but whose accelerometer
      // has a manufacturing/mounting bias of +300 on X — exactly the
      // scenario bytes 8-19 exist to correct for.
      const bytes = le16(300, 0, 9800);
      const trueFlatAngle = Math.atan2(0, 9800);
      const uncorrected = parseAccelPacket(bytes)!;
      expect(Math.atan2(uncorrected.x, uncorrected.z)).not.toBeCloseTo(trueFlatAngle, 5);

      const calibration = { accelX: 300, accelY: 0, accelZ: 0, gyroX: 0, gyroY: 0, gyroZ: 0 };
      const corrected = parseAccelPacket(bytes, calibration)!;
      expect(Math.atan2(corrected.x, corrected.z)).toBeCloseTo(trueFlatAngle, 10);
    });
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
    expect(parseEasyLevelStatus(bytes)?.calibration).toBeNull();
  });

  describe('calibration: bytes 8–19, six signed int16 LE (#215)', () => {
    /** Appends bytes 8–19 (accelX/Y/Z, gyroX/Y/Z, in that order — the same
     * axis order the `faf52c21-...` accel/gyro packet uses) to an 8-byte
     * status payload, matching `Ly0/a;->i()`'s own decode. */
    function withCalibration(
      base: Uint8Array,
      accelX: number,
      accelY: number,
      accelZ: number,
      gyroX: number,
      gyroY: number,
      gyroZ: number,
    ): Uint8Array {
      const view = new DataView(new ArrayBuffer(20));
      new Uint8Array(view.buffer).set(base);
      view.setInt16(8, accelX, true);
      view.setInt16(10, accelY, true);
      view.setInt16(12, accelZ, true);
      view.setInt16(14, gyroX, true);
      view.setInt16(16, gyroY, true);
      view.setInt16(18, gyroZ, true);
      return new Uint8Array(view.buffer);
    }

    it('decodes bytes 8–19 when firmware tier ≥ 3 and the payload is long enough — this is the bug #215 fixed: neither this function nor parseAccelPacket read these bytes before', () => {
      const bytes = withCalibration(statusBytes(0, 0, 2500, 48), 10, -20, 30, 1, -2, 3);
      expect(parseEasyLevelStatus(bytes)?.calibration).toEqual({
        accelX: 10,
        accelY: -20,
        accelZ: 30,
        gyroX: 1,
        gyroY: -2,
        gyroZ: 3,
      });
    });

    it('decodes negative values as two-s complement, not unsigned', () => {
      const bytes = withCalibration(statusBytes(0, 0, 2500, 48), -1, -32768, 32767, 0, 0, 0);
      expect(parseEasyLevelStatus(bytes)?.calibration).toEqual({
        accelX: -1,
        accelY: -32768,
        accelZ: 32767,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
      });
    });

    it('stays null when the payload has bytes 8–19 but firmware tier < 3 — matches the official app: it never reads past byte 7 on that firmware either', () => {
      // byte7 = 47 is the last raw value still below the tier-3 threshold
      // (firmwareTierFromByte's own 48 boundary).
      const bytes = withCalibration(statusBytes(0, 0, 2500, 47), 10, -20, 30, 1, -2, 3);
      expect(parseEasyLevelStatus(bytes)?.firmwareTier).toBe(2);
      expect(parseEasyLevelStatus(bytes)?.calibration).toBeNull();
    });

    it('stays null when firmware tier ≥ 3 but the payload is only 8 bytes long (no calibration block present at all)', () => {
      const bytes = statusBytes(0, 0, 2500, 48);
      expect(parseEasyLevelStatus(bytes)?.firmwareTier).toBe(3);
      expect(parseEasyLevelStatus(bytes)?.calibration).toBeNull();
    });
  });

  describe('battery: clamp(trunc(rawMv × 0.1 − 200), 0, 100)', () => {
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

    it("truncates toward zero, never rounds — matches the official app's own (int) cast", () => {
      // rawMv = 2604 -> 2604 * 0.1 - 200 = 60.4 -> truncated to 60, not
      // rounded to 60.4 or 60. A naive `Math.round` would also give 60
      // here, so a value whose fraction rounds up is needed to actually
      // distinguish truncation from rounding.
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2609, 0))?.batteryPercent).toBe(60);
    });
  });

  describe('temperature: firmware-tier-dependent formula', () => {
    it('firmware tier 1 (byte7 < 32): clamp(trunc(byte[0] / 16 + 25), -40, 80), byte[0] signed', () => {
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, 0))?.temperatureCelsius).toBeCloseTo(25);
      expect(parseEasyLevelStatus(statusBytes(16, 0, 2500, 0))?.temperatureCelsius).toBeCloseTo(26);
      // byte[0] = -16 as an unsigned byte is 240.
      expect(parseEasyLevelStatus(statusBytes(240, 0, 2500, 31))?.temperatureCelsius).toBeCloseTo(
        24,
      );
    });

    it('truncates tier-1 fractional results toward zero, never rounds', () => {
      // byte[0] = 10 -> 10 / 16 + 25 = 25.625 -> truncated to 25, not
      // rounded to 26.
      expect(parseEasyLevelStatus(statusBytes(10, 0, 2500, 0))?.temperatureCelsius).toBe(25);
      // byte[0] = -10 (unsigned 246) -> -10 / 16 + 25 = 24.375 -> truncated
      // to 24.
      expect(parseEasyLevelStatus(statusBytes(246, 0, 2500, 0))?.temperatureCelsius).toBe(24);
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
      [127, 7],
    ])('byte7 = %i -> tier %i', (byte7, tier) => {
      expect(firmwareTierFromByte(byte7)).toBe(tier);
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, byte7))?.firmwareTier).toBe(tier);
    });

    // The official app reads byte7 into a Java `byte` (-128..127), not an
    // unsigned value, and compares that signed reading against these same
    // thresholds (confirmed by decompiling `EasyLevel 5.0.7` directly) — so
    // any raw byte ≥ 128 is negative in its own comparison and always
    // resolves to tier 1, never the tier a naive unsigned reading would
    // suggest. 255 previously asserted tier 7 here, which matched an
    // unsigned reading but not the app's own signed one.
    it.each([
      [128, 1],
      [200, 1],
      [255, 1],
    ])('byte7 = %i (sign bit set) always resolves to tier 1, matching the app', (byte7, tier) => {
      expect(firmwareTierFromByte(byte7)).toBe(tier);
      expect(parseEasyLevelStatus(statusBytes(0, 0, 2500, byte7))?.firmwareTier).toBe(tier);
    });
  });

  it('a byte7 ≥ 128 also selects the tier-1 temperature formula, not just the tier label', () => {
    // byte[0] = 16 under the tier-1 formula (16 / 16 + 25 = 26) vs. the
    // same two bytes read as a tier-2+ int16 would give a wildly different
    // result — this confirms the temperature branch, not just
    // `firmwareTier` itself, follows the same signed byte7 comparison.
    expect(parseEasyLevelStatus(statusBytes(16, 0, 2500, 200))?.temperatureCelsius).toBeCloseTo(26);
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
