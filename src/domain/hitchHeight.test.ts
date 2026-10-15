import { describe, expect, it } from 'vitest';
import { computeCaravanLeveling, type CaravanDisplayResult } from './caravan';
import {
  hitchCalibration,
  hitchDisplay,
  hitchPitchFromReading,
  parseHitchPitch,
} from './hitchHeight';
import type { GravityVector } from './leveling';
import { DEFAULT_SETTINGS } from './settings';

// Axle → jockey 4000 mm, as in caravan.test.ts.
const SETTINGS = {
  ...DEFAULT_SETTINGS,
  vehicleType: 'caravan' as const,
  wheelbaseMm: 4000,
  trackWidthRearMm: 1800,
};

const G = 9.81;
const rad = (deg: number) => (deg * Math.PI) / 180;
const tan = (deg: number) => Math.tan(rad(deg));

function gravityFor(rollDeg: number, pitchDeg: number): GravityVector {
  return { x: G * tan(rollDeg), y: G * tan(pitchDeg), z: G };
}

describe('hitchPitchFromReading', () => {
  it('saves the pitch relative to the zero, ignoring roll', () => {
    expect(
      hitchPitchFromReading({ rollDeg: 3, pitchDeg: 2.5 }, { rollDeg: 1, pitchDeg: 0.5 }),
    ).toBe(2);
  });

  it('is the raw pitch when there is no zero', () => {
    expect(hitchPitchFromReading({ rollDeg: 0, pitchDeg: -1.2 }, null)).toBe(-1.2);
  });
});

describe('going back to the hitch height', () => {
  it('asks for no jockey correction at the saved pitch', () => {
    const calibration = hitchCalibration(null, 1.5);
    const result = computeCaravanLeveling(gravityFor(0, 1.5), SETTINGS, calibration);
    expect(result.jockeyMm).toBeCloseTo(0);
  });

  it('cranks up when the nose is lower than saved', () => {
    // Saved nose-up 1.5°, now level: the coupling must rise again.
    const result = computeCaravanLeveling(gravityFor(0, 0), SETTINGS, hitchCalibration(null, 1.5));
    expect(result.jockeyMm).toBeCloseTo(4000 * tan(1.5), 6);
    expect(result.jockeyMm).toBeGreaterThan(0);
  });

  it('cranks down when the nose is higher than saved', () => {
    const result = computeCaravanLeveling(gravityFor(0, 2), SETTINGS, hitchCalibration(null, -1));
    expect(result.jockeyMm).toBeCloseTo(-4000 * tan(3), 6);
  });

  it('measures from the zero, so the saved pitch moves with it', () => {
    const zero = { rollDeg: 0.4, pitchDeg: 0.6 };
    const calibration = hitchCalibration(zero, 1);
    expect(calibration).toEqual({ rollDeg: 0.4, pitchDeg: 1.6 });
    const result = computeCaravanLeveling(gravityFor(0.4, 1.6), SETTINGS, calibration);
    expect(result.jockeyMm).toBeCloseTo(0);
  });

  it('keeps the zero roll and adds none of its own', () => {
    expect(hitchCalibration(null, 2)).toEqual({ rollDeg: 0, pitchDeg: 2 });
  });
});

describe('hitchDisplay', () => {
  const tilted: CaravanDisplayResult = {
    rollDeg: -2,
    pitchDeg: 1,
    isLevel: false,
    axle: {
      left: { displayMm: 0, stepMm: 0, severity: 'none' },
      right: { displayMm: 63, stepMm: 60, severity: 'small' },
    },
    jockey: { displayMm: 34, direction: 'up' },
  };

  it('leaves the axle with nothing to do and keeps the jockey', () => {
    const shown = hitchDisplay(tilted);
    expect(shown.axle.right).toEqual({ displayMm: 0, stepMm: 0, severity: 'none' });
    expect(shown.axle.left.severity).toBe('none');
    expect(shown.jockey).toEqual({ displayMm: 34, direction: 'up' });
    expect(shown.isLevel).toBe(false);
  });

  it('is done when the jockey is, whatever the side tilt', () => {
    const shown = hitchDisplay({ ...tilted, jockey: { displayMm: 2, direction: 'ok' } });
    expect(shown.isLevel).toBe(true);
    expect(shown.rollDeg).toBe(-2);
  });
});

describe('parseHitchPitch', () => {
  it('accepts a plausible pitch', () => {
    expect(parseHitchPitch(-2.25)).toBe(-2.25);
  });

  it('rejects anything else', () => {
    for (const value of ['2', null, Number.NaN, 90, {}]) expect(parseHitchPitch(value)).toBeNull();
  });
});
