import { describe, expect, it } from 'vitest';
import { computeLeveling, type GravityVector } from './leveling';
import { DEFAULT_SETTINGS } from './settings';
import {
  isTrimmed,
  NO_TRIM,
  nudgeTrim,
  trimmedZero,
  trimSummary,
  ZERO_TRIM_STEP_DEG,
  type TrimDirection,
} from './zeroTrim';

const G = 9.81;
const rad = (deg: number) => (deg * Math.PI) / 180;

function tilted(rollDeg: number, pitchDeg: number): GravityVector {
  return { x: G * Math.tan(rad(rollDeg)), y: G * Math.tan(rad(pitchDeg)), z: G };
}

function tapped(...directions: TrimDirection[]) {
  return directions.reduce(nudgeTrim, NO_TRIM);
}

describe('fine adjustment of the zero (#596)', () => {
  it('moves the zero one step of 0.1° per tap', () => {
    expect(ZERO_TRIM_STEP_DEG).toBe(0.1);
    expect(tapped('right')).toEqual({ rollDeg: 0.1, pitchDeg: 0 });
    expect(tapped('front', 'front')).toEqual({ rollDeg: 0, pitchDeg: 0.2 });
  });

  it('cancels opposite taps: each axis is one signed sum', () => {
    expect(tapped('left', 'right')).toEqual(NO_TRIM);
    expect(tapped('front', 'back', 'back')).toEqual({ rollDeg: 0, pitchDeg: -0.1 });
    expect(isTrimmed(tapped('left', 'right'))).toBe(false);
  });

  it('never drifts by float noise over many taps', () => {
    const many = Array<TrimDirection>(30).fill('right');
    expect(tapped(...many).rollDeg).toBe(3);
    expect(tapped(...many, ...Array<TrimDirection>(30).fill('left'))).toEqual(NO_TRIM);
  });

  it('"Left up" makes the app call it level only with the left side higher', () => {
    const settings = { ...DEFAULT_SETTINGS, toleranceMm: 0.5 };
    const trim = tapped('left', 'left', 'left', 'left', 'left');
    // Left side 0.5° higher than the original zero: positive roll is right high.
    expect(computeLeveling(tilted(-0.5, 0), settings, trim).isLevel).toBe(true);
    expect(computeLeveling(tilted(0, 0), settings, trim).isLevel).toBe(false);
    const wheels = computeLeveling(tilted(0, 0), settings, trim).wheels;
    expect(wheels.frontLeft.liftMm).toBeGreaterThan(wheels.frontRight.liftMm);
    expect(wheels.rearLeft.liftMm).toBeGreaterThan(wheels.rearRight.liftMm);
  });

  it('"Front up" makes the app call it level only with the front higher', () => {
    const settings = { ...DEFAULT_SETTINGS, toleranceMm: 0.5 };
    const trim = tapped('front', 'front', 'front');
    expect(computeLeveling(tilted(0, 0.3), settings, trim).isLevel).toBe(true);
    const wheels = computeLeveling(tilted(0, 0), settings, trim).wheels;
    expect(wheels.frontLeft.liftMm).toBeGreaterThan(0);
    expect(wheels.rearLeft.liftMm).toBe(0);
  });

  it('sums up which side each axis raises, front/back first', () => {
    expect(trimSummary(tapped('left', 'left', 'front'))).toEqual([
      { side: 'front', deg: 0.1 },
      { side: 'left', deg: 0.2 },
    ]);
    expect(trimSummary(tapped('back', 'right'))).toEqual([
      { side: 'back', deg: 0.1 },
      { side: 'right', deg: 0.1 },
    ]);
    expect(trimSummary(NO_TRIM)).toEqual([]);
  });
});

describe('the trimmed zero (#596)', () => {
  it('adds the trim to the stored zero', () => {
    expect(trimmedZero({ rollDeg: 1, pitchDeg: -2 }, tapped('left', 'front'))).toEqual({
      rollDeg: 0.9,
      pitchDeg: -1.9,
    });
  });

  it('leaves an untrimmed zero exactly as captured, even none', () => {
    const zero = { rollDeg: 1, pitchDeg: -2 };
    expect(trimmedZero(zero, NO_TRIM)).toBe(zero);
    expect(trimmedZero(null, NO_TRIM)).toBeNull();
  });
});
