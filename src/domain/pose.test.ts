import { describe, expect, it } from 'vitest';
import { createPoseDetector, isUpsideDown } from './pose';

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
