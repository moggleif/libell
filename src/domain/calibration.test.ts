import { describe, expect, it } from 'vitest';
import { combineCalibrations, flipCalibration, vehicleZeroFromReading } from './calibration';
import { createPoseDetector, totalTiltDeg } from './pose';

describe('flipCalibration', () => {
  it('recovers the phone bias exactly, cancelling the surface tilt', () => {
    // Surface leans 3°/−1.5°; the phone itself is biased 0.8°/−0.4°.
    const surface = { rollDeg: 3, pitchDeg: -1.5 };
    const bias = { rollDeg: 0.8, pitchDeg: -0.4 };
    const a = {
      rollDeg: surface.rollDeg + bias.rollDeg,
      pitchDeg: surface.pitchDeg + bias.pitchDeg,
    };
    const b = {
      rollDeg: -surface.rollDeg + bias.rollDeg,
      pitchDeg: -surface.pitchDeg + bias.pitchDeg,
    };
    const result = flipCalibration(a, b);
    expect(result.bias.rollDeg).toBeCloseTo(bias.rollDeg);
    expect(result.bias.pitchDeg).toBeCloseTo(bias.pitchDeg);
    expect(result.surface.rollDeg).toBeCloseTo(surface.rollDeg);
    expect(result.surface.pitchDeg).toBeCloseTo(surface.pitchDeg);
    expect(result.consistent).toBe(true);
  });

  it('flags implausible captures (phone moved between readings)', () => {
    // A "bias" of 20° cannot be case tilt — the phone was moved.
    const result = flipCalibration({ rollDeg: 22, pitchDeg: 0 }, { rollDeg: 18, pitchDeg: 0 });
    expect(result.consistent).toBe(false);
  });
});

describe('pose detection', () => {
  const G = 9.81;
  const tilted = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: G * Math.sin(rad), y: 0, z: G * Math.cos(rad) };
  };

  it('computes total tilt from the gravity vector', () => {
    expect(totalTiltDeg({ x: 0, y: 0, z: G })).toBeCloseTo(0);
    expect(totalTiltDeg(tilted(30))).toBeCloseTo(30);
  });

  it('does not trigger at realistic ramp angles', () => {
    const detect = createPoseDetector();
    // 100 mm step over an 1800 mm track ≈ 3.2° — far below the threshold.
    expect(detect(tilted(3.2))).toBe('flat');
    expect(detect(tilted(10))).toBe('flat');
  });

  it('enters not-flat past 25° and returns only below 20° (hysteresis)', () => {
    const detect = createPoseDetector();
    expect(detect(tilted(24))).toBe('flat');
    expect(detect(tilted(26))).toBe('not-flat');
    expect(detect(tilted(22))).toBe('not-flat'); // inside the band — stays
    expect(detect(tilted(18))).toBe('flat');
  });
});

describe('two-layer calibration (#83)', () => {
  it('combines sensor and vehicle offsets by summing them', () => {
    expect(
      combineCalibrations({ rollDeg: 1, pitchDeg: -2 }, { rollDeg: 0.4, pitchDeg: 0.1 }),
    ).toEqual({ rollDeg: 1.4, pitchDeg: -1.9 });
    expect(combineCalibrations(null, { rollDeg: 0.4, pitchDeg: 0 })).toEqual({
      rollDeg: 0.4,
      pitchDeg: 0,
    });
    expect(combineCalibrations({ rollDeg: 1, pitchDeg: 0 }, null)).toEqual({
      rollDeg: 1,
      pitchDeg: 0,
    });
    expect(combineCalibrations(null, null)).toBeNull();
  });

  it('captures the vehicle zero sensor-corrected: pure placement tilt', () => {
    // Phone bias 1.0°/-0.5°, table tilts 0.4°/0.2°, vehicle verified level:
    // the raw reading is bias + table; the stored zero must be table only.
    const raw = { rollDeg: 1.4, pitchDeg: -0.3 };
    const sensor = { rollDeg: 1.0, pitchDeg: -0.5 };
    const zero = vehicleZeroFromReading(raw, sensor);
    expect(zero.rollDeg).toBeCloseTo(0.4);
    expect(zero.pitchDeg).toBeCloseTo(0.2);
    expect(vehicleZeroFromReading(raw, null)).toEqual(raw);
  });

  it('vehicle zero survives a sensor recalibration', () => {
    // Captured with sensor cal present -> placement-only. Clearing or
    // redoing the sensor calibration must not corrupt the placement term.
    const table = { rollDeg: 0.4, pitchDeg: 0.2 };
    const oldBias = { rollDeg: 1.0, pitchDeg: -0.5 };
    const raw = {
      rollDeg: table.rollDeg + oldBias.rollDeg,
      pitchDeg: table.pitchDeg + oldBias.pitchDeg,
    };
    const vehicle = vehicleZeroFromReading(raw, oldBias);
    const newBias = { rollDeg: -0.2, pitchDeg: 0.3 };
    const combined = combineCalibrations(newBias, vehicle)!;
    expect(combined.rollDeg).toBeCloseTo(newBias.rollDeg + table.rollDeg);
    expect(combined.pitchDeg).toBeCloseTo(newBias.pitchDeg + table.pitchDeg);
  });
});
