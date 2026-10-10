import { describe, expect, it } from 'vitest';
import { createExternalPoseDetector, createPoseDetector, isUpsideDown } from './pose';

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
