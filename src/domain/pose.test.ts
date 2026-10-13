import { describe, expect, it } from 'vitest';
import { createExternalPoseDetector, createPoseDetector, isUpsideDown, totalTiltDeg } from './pose';

describe('totalTiltDeg (#519)', () => {
  it('is the angle between gravity and the screen normal, 0° to 180°', () => {
    expect(totalTiltDeg({ x: 0, y: 0, z: 9.81 })).toBe(0);
    expect(totalTiltDeg({ x: 9.81, y: 0, z: 0 })).toBeCloseTo(90);
    expect(totalTiltDeg({ x: 0, y: 0, z: -9.81 })).toBeCloseTo(180);
    expect(totalTiltDeg({ x: 0, y: 0, z: 0 })).toBe(90);
  });

  it('stays a number when rounding puts z just past the length', () => {
    const z = 0.1 + 0.2;
    expect(Number.isNaN(totalTiltDeg({ x: 1e-17, y: 0, z }))).toBe(false);
  });
});

describe('phone pose detector (#51)', () => {
  it('reads flat, tilted-past-25° and back with hysteresis', () => {
    const detect = createPoseDetector();
    expect(detect({ x: 0, y: 0, z: 9.81 })).toBe('flat');
    expect(detect({ x: 0, y: 6, z: 7.5 })).toBe('not-flat');
    expect(detect({ x: 0, y: 3.9, z: 9 })).toBe('not-flat');
    expect(detect({ x: 0, y: 1, z: 9.8 })).toBe('flat');
  });
});

describe('isUpsideDown (#285)', () => {
  it('is false for any right-side-up mount, however far it is tilted', () => {
    expect(isUpsideDown({ x: 0, y: 0, z: 9.81 })).toBe(false);
    expect(isUpsideDown({ x: 0, y: 8, z: 5 })).toBe(false);
  });

  it('is true when the sensor face points down', () => {
    expect(isUpsideDown({ x: 0, y: 0, z: -9.81 })).toBe(true);
    expect(isUpsideDown({ x: 1, y: 1, z: -2 })).toBe(true);
  });
});

describe('external sensor pose detector (#285)', () => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const tilted = (deg: number) => ({
    x: Math.sin(rad(deg)) * 9.81,
    y: 0,
    z: Math.cos(rad(deg)) * 9.81,
  });

  it('accepts a normal mount, including a vehicle on steep ramps', () => {
    const detect = createExternalPoseDetector();
    expect(detect(tilted(0))).toBe('ok');
    expect(detect(tilted(15))).toBe('ok');
  });

  it('flags an extreme position past 45° and clears with hysteresis below 40°', () => {
    const detect = createExternalPoseDetector();
    expect(detect(tilted(50))).toBe('extreme');
    expect(detect(tilted(43))).toBe('extreme');
    expect(detect(tilted(38))).toBe('ok');
  });

  it('flags a face-down mount as upside-down, not merely extreme', () => {
    const detect = createExternalPoseDetector();
    expect(detect(tilted(180))).toBe('upside-down');
  });
});
