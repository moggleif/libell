import { describe, expect, it } from 'vitest';
import {
  computeLeveling,
  liftSeverity,
  recommendStep,
  WHEEL_IDS,
  type GravityVector,
} from './leveling';
import { DEFAULT_SETTINGS } from './settings';

const G = 9.81;

/** Gravity vector for a device rolled/pitched by the given angles (degrees). */
function gravityFor(rollDeg: number, pitchDeg: number): GravityVector {
  const roll = (rollDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  // Inverse of roll = atan2(gx, gz), pitch = atan2(gy, gz) for small angles.
  const z = G;
  return { x: z * Math.tan(roll), y: z * Math.tan(pitch), z };
}

describe('computeLeveling', () => {
  it('reports level with zero lifts when flat', () => {
    const result = computeLeveling({ x: 0, y: 0, z: G }, DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(true);
    expect(result.rollDeg).toBeCloseTo(0);
    expect(result.pitchDeg).toBeCloseTo(0);
    for (const id of WHEEL_IDS) {
      expect(result.wheels[id].liftMm).toBeCloseTo(0);
      expect(result.wheels[id].stepMm).toBe(0);
    }
  });

  it('pure roll: lifts the low side, the high side is the reference', () => {
    // Negative roll = right side low, so right wheels need lifting.
    const result = computeLeveling(gravityFor(-2, 0), DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.wheels.frontLeft.liftMm).toBeCloseTo(0);
    expect(result.wheels.rearLeft.liftMm).toBeCloseTo(0);
    const expected = DEFAULT_SETTINGS.trackWidthFrontMm * Math.tan((2 * Math.PI) / 180);
    expect(result.wheels.frontRight.liftMm).toBeCloseTo(expected);
    expect(result.wheels.rearRight.liftMm).toBeCloseTo(expected);
  });

  it('uses each axle’s own track width when they differ', () => {
    // Wider front axle: under pure roll the front-left wheel sits furthest
    // out and highest, so even the rear-left wheel needs a small lift.
    const settings = { ...DEFAULT_SETTINGS, trackWidthFrontMm: 2000, trackWidthRearMm: 1600 };
    const result = computeLeveling(gravityFor(-2, 0), settings);
    const t = Math.tan((2 * Math.PI) / 180);
    expect(result.wheels.frontLeft.liftMm).toBeCloseTo(0);
    expect(result.wheels.rearLeft.liftMm).toBeCloseTo(((2000 - 1600) / 2) * t);
    expect(result.wheels.frontRight.liftMm).toBeCloseTo(2000 * t);
    expect(result.wheels.rearRight.liftMm).toBeCloseTo(((2000 + 1600) / 2) * t);
  });

  it('pure pitch: lifts the low end, the high end is the reference', () => {
    // Negative pitch = front low, so front wheels need lifting.
    const result = computeLeveling(gravityFor(0, -1.5), DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.wheels.rearLeft.liftMm).toBeCloseTo(0);
    expect(result.wheels.rearRight.liftMm).toBeCloseTo(0);
    const expected = DEFAULT_SETTINGS.wheelbaseMm * Math.tan((1.5 * Math.PI) / 180);
    expect(result.wheels.frontLeft.liftMm).toBeCloseTo(expected);
    expect(result.wheels.frontRight.liftMm).toBeCloseTo(expected);
  });

  it('combined roll + pitch: exactly three wheels need lifting', () => {
    // Right side low and front low → rear left is the single highest corner.
    const result = computeLeveling(gravityFor(-2, -1), DEFAULT_SETTINGS);
    const lifts = WHEEL_IDS.map((id) => result.wheels[id].liftMm);
    expect(lifts.filter((lift) => lift > 0.1)).toHaveLength(3);
    expect(result.wheels.rearLeft.liftMm).toBeCloseTo(0);
    // The opposite corner is lowest, so it needs the most lift.
    const max = Math.max(...lifts);
    expect(result.wheels.frontRight.liftMm).toBeCloseTo(max);
  });

  it('recommends the available ramp step closest to the lift', () => {
    const settings = { ...DEFAULT_SETTINGS, rampStepHeightsMm: [20, 40, 60, 90] };
    // Roll of −2° over a 1800 mm track lifts the right side ≈ 63 mm.
    const result = computeLeveling(gravityFor(-2, 0), settings);
    expect(result.wheels.frontRight.liftMm).toBeCloseTo(62.9, 0);
    expect(result.wheels.frontRight.stepMm).toBe(60);
    expect(result.wheels.frontLeft.stepMm).toBe(0);
  });

  it('subtracts the phone calibration from the reading', () => {
    // The phone itself reads 1°/−0.5° on a level surface; with that
    // stored as calibration the same reading is level again.
    const biased = gravityFor(1, -0.5);
    const uncalibrated = computeLeveling(biased, DEFAULT_SETTINGS);
    expect(uncalibrated.isLevel).toBe(false);
    const calibrated = computeLeveling(biased, DEFAULT_SETTINGS, { rollDeg: 1, pitchDeg: -0.5 });
    expect(calibrated.isLevel).toBe(true);
    expect(calibrated.rollDeg).toBeCloseTo(0);
    expect(calibrated.pitchDeg).toBeCloseTo(0);
    for (const id of WHEEL_IDS) {
      expect(calibrated.wheels[id].liftMm).toBeCloseTo(0);
    }
  });

  it('is level when no wheel sits more than the mm tolerance below the highest', () => {
    // Height-based: geometry is inherent in the lifts. Default tolerance
    // 20 mm — a pitch lifting the front 15 mm is level, 28 mm is not.
    const small = computeLeveling(gravityFor(0, -0.21), DEFAULT_SETTINGS);
    expect(small.wheels.frontLeft.liftMm).toBeLessThan(20);
    expect(small.isLevel).toBe(true);
    const beyond = computeLeveling(gravityFor(0, -0.4), DEFAULT_SETTINGS);
    expect(beyond.wheels.frontLeft.liftMm).toBeGreaterThan(20);
    expect(beyond.isLevel).toBe(false);
  });
});

describe('recommendStep', () => {
  it('picks the nearest step in mm, with "no step" as a candidate', () => {
    const steps = [20, 40, 60, 90];
    expect(recommendStep(5, steps)).toBe(0);
    expect(recommendStep(12, steps)).toBe(20);
    expect(recommendStep(48, steps)).toBe(40);
    expect(recommendStep(78, steps)).toBe(90);
    expect(recommendStep(200, steps)).toBe(90);
  });
});

describe('liftSeverity', () => {
  it('answers "is it worth driving up?" against tolerance and steps', () => {
    const settings = { ...DEFAULT_SETTINGS, rampStepHeightsMm: [20, 40, 60], toleranceMm: 20 };
    // Within tolerance → green, nothing to do.
    expect(liftSeverity(0, settings)).toBe('none');
    expect(liftSeverity(19, settings)).toBe('none');
    // A step brings the wheel within tolerance → orange.
    expect(liftSeverity(30, settings)).toBe('small'); // → 20 or 40 mm step
    expect(liftSeverity(75, settings)).toBe('small'); // → 60 mm step, 15 left
    // Even the best step leaves it outside tolerance → red: not worth it.
    expect(liftSeverity(90, settings)).toBe('large'); // 60 leaves 30
    expect(liftSeverity(200, settings)).toBe('large');
  });
});
