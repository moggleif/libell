import { describe, expect, it } from 'vitest';
import { BOX_SMOOTHING_TIME_CONSTANT_MS, createGravityLowPass } from './boxSmoothing';
import type { GravityVector } from './leveling';

const FLAT: GravityVector = { x: 0, y: 0, z: 9.81 };
const TILTED: GravityVector = { x: 1, y: -1, z: 9.7 };

describe('createGravityLowPass', () => {
  it('passes the first reading through unchanged', () => {
    const smooth = createGravityLowPass(500);
    expect(smooth(TILTED, 0)).toEqual(TILTED);
  });

  it('holds still while the reading does not change', () => {
    const smooth = createGravityLowPass(500);
    smooth(FLAT, 0);
    expect(smooth(FLAT, 16)).toEqual(FLAT);
    expect(smooth(FLAT, 1000)).toEqual(FLAT);
  });

  // #457: a box polled twice a second jumps once per poll. Rendered every
  // frame, the shown value must glide between two polls instead.
  it('glides frame by frame towards a new reading instead of jumping', () => {
    const smooth = createGravityLowPass(500);
    smooth(FLAT, 0);
    const shown: number[] = [];
    for (let t = 16; t <= 480; t += 16) shown.push(smooth(TILTED, t).x);
    shown.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(shown[i] ?? Infinity));
    expect(shown[0]).toBeLessThan(0.05);
    expect(shown[shown.length - 1]).toBeLessThan(TILTED.x);
  });

  it('settles on the reading within a few time constants, whatever the frame rate', () => {
    const at60 = createGravityLowPass(500);
    const at30 = createGravityLowPass(500);
    at60(FLAT, 0);
    at30(FLAT, 0);
    let a = FLAT;
    let b = FLAT;
    for (let t = 1; t <= 120; t++) a = at60(TILTED, (t * 1000) / 60);
    for (let t = 1; t <= 60; t++) b = at30(TILTED, (t * 1000) / 30);
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(a.x).toBeGreaterThan(0.98);
  });

  it('calms a reading that flips between two values on every poll', () => {
    const smooth = createGravityLowPass(BOX_SMOOTHING_TIME_CONSTANT_MS);
    const low: GravityVector = { x: -0.1, y: 0, z: 9.81 };
    const high: GravityVector = { x: 0.1, y: 0, z: 9.81 };
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t <= 10000; t += 16) {
      const raw = Math.floor(t / 500) % 2 === 0 ? low : high;
      const x = smooth(raw, t).x;
      if (t > 3000) {
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
    }
    expect(max - min).toBeLessThan(0.1);
  });

  it('starts afresh after a reset', () => {
    const smooth = createGravityLowPass(500);
    smooth(FLAT, 0);
    smooth.reset();
    expect(smooth(TILTED, 16)).toEqual(TILTED);
  });

  it('ignores a clock that runs backwards', () => {
    const smooth = createGravityLowPass(500);
    smooth(FLAT, 1000);
    expect(smooth(TILTED, 900)).toEqual(FLAT);
  });
});
