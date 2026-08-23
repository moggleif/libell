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
      expect(result.wheels[id].liftCm).toBeCloseTo(0);
      expect(result.wheels[id].stepMm).toBe(0);
    }
  });

  it('pure roll: lifts the low side, the high side is the reference', () => {
    // Negative roll = right side low, so right wheels need lifting.
    const result = computeLeveling(gravityFor(-2, 0), DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.wheels.frontLeft.liftCm).toBeCloseTo(0);
    expect(result.wheels.rearLeft.liftCm).toBeCloseTo(0);
    const expected = DEFAULT_SETTINGS.trackWidthFrontCm * Math.tan((2 * Math.PI) / 180);
    expect(result.wheels.frontRight.liftCm).toBeCloseTo(expected);
    expect(result.wheels.rearRight.liftCm).toBeCloseTo(expected);
  });

  it('uses each axle’s own track width when they differ', () => {
    // Wider front axle: under pure roll the front-left wheel sits furthest
    // out and highest, so even the rear-left wheel needs a small lift.
    const settings = { ...DEFAULT_SETTINGS, trackWidthFrontCm: 200, trackWidthRearCm: 160 };
    const result = computeLeveling(gravityFor(-2, 0), settings);
    const t = Math.tan((2 * Math.PI) / 180);
    expect(result.wheels.frontLeft.liftCm).toBeCloseTo(0);
    expect(result.wheels.rearLeft.liftCm).toBeCloseTo(((200 - 160) / 2) * t);
    expect(result.wheels.frontRight.liftCm).toBeCloseTo(200 * t);
    expect(result.wheels.rearRight.liftCm).toBeCloseTo(((200 + 160) / 2) * t);
  });

  it('pure pitch: lifts the low end, the high end is the reference', () => {
    // Negative pitch = front low, so front wheels need lifting.
    const result = computeLeveling(gravityFor(0, -1.5), DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.wheels.rearLeft.liftCm).toBeCloseTo(0);
    expect(result.wheels.rearRight.liftCm).toBeCloseTo(0);
    const expected = DEFAULT_SETTINGS.wheelbaseCm * Math.tan((1.5 * Math.PI) / 180);
    expect(result.wheels.frontLeft.liftCm).toBeCloseTo(expected);
    expect(result.wheels.frontRight.liftCm).toBeCloseTo(expected);
  });

  it('combined roll + pitch: exactly three wheels need lifting', () => {
    // Right side low and front low → rear left is the single highest corner.
    const result = computeLeveling(gravityFor(-2, -1), DEFAULT_SETTINGS);
    const lifts = WHEEL_IDS.map((id) => result.wheels[id].liftCm);
    expect(lifts.filter((lift) => lift > 0.01)).toHaveLength(3);
    expect(result.wheels.rearLeft.liftCm).toBeCloseTo(0);
    // The opposite corner is lowest, so it needs the most lift.
    const max = Math.max(...lifts);
    expect(result.wheels.frontRight.liftCm).toBeCloseTo(max);
  });

  it('recommends the available ramp step closest to the lift', () => {
    const settings = { ...DEFAULT_SETTINGS, rampStepHeightsMm: [20, 40, 60, 90] };
    // Roll of −2° over a 180 cm track lifts the right side ≈ 6.3 cm.
    const result = computeLeveling(gravityFor(-2, 0), settings);
    expect(result.wheels.frontRight.liftCm).toBeCloseTo(6.29, 1);
    expect(result.wheels.frontRight.stepMm).toBe(60);
    expect(result.wheels.frontLeft.stepMm).toBe(0);
  });

  it('treats tilt within the tolerance as level', () => {
    const result = computeLeveling(gravityFor(0.3, -0.4), DEFAULT_SETTINGS);
    expect(result.isLevel).toBe(true);
    const beyond = computeLeveling(gravityFor(0.6, 0), DEFAULT_SETTINGS);
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
  it('classifies lifts (cm) relative to the available step heights (mm)', () => {
    const settings = { ...DEFAULT_SETTINGS, rampStepHeightsMm: [20, 40, 60] };
    expect(liftSeverity(0, settings)).toBe('none');
    expect(liftSeverity(0.9, settings)).toBe('none');
    expect(liftSeverity(3, settings)).toBe('small');
    expect(liftSeverity(6, settings)).toBe('small');
    expect(liftSeverity(6.5, settings)).toBe('large');
  });
});
