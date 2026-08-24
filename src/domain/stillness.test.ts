import { describe, expect, it } from 'vitest';
import { createStillnessDetector, STILLNESS_CALM_MS, STILLNESS_THRESHOLD_DEG } from './stillness';

describe('stillness detector (#86)', () => {
  it('starts stable and stays stable on a calm signal', () => {
    const isStable = createStillnessDetector();
    for (let t = 0; t <= 3000; t += 100) {
      expect(isStable(0.5, -0.3, t)).toBe(true);
    }
  });

  it('flips to measuring while the vehicle rocks', () => {
    const isStable = createStillnessDetector();
    isStable(0, 0, 0);
    // Rocking: roll oscillates well past the threshold.
    let state = true;
    for (let t = 100; t <= 2000; t += 100) {
      state = isStable(t % 200 === 0 ? STILLNESS_THRESHOLD_DEG : -STILLNESS_THRESHOLD_DEG, 0, t);
    }
    expect(state).toBe(false);
  });

  it('returns to stable only once the disturbance has aged out of the window', () => {
    const isStable = createStillnessDetector();
    isStable(0, 0, 0);
    isStable(2, 0, 100); // a clear disturbance
    expect(isStable(0, 0, 200)).toBe(false);
    // Calm, but the window still contains the disturbance.
    expect(isStable(0, 0, 100 + STILLNESS_CALM_MS - 50)).toBe(false);
    // Once the disturbance is older than the window: stable again.
    expect(isStable(0, 0, 100 + STILLNESS_CALM_MS + 100)).toBe(true);
  });

  it('a single spike resets the calm clock', () => {
    const isStable = createStillnessDetector();
    for (let t = 0; t <= 1000; t += 100) isStable(0, 0, t);
    isStable(0, 1.5, 1100); // someone steps into the vehicle
    expect(isStable(0, 0, 1200)).toBe(false);
    expect(isStable(0, 0, 1100 + STILLNESS_CALM_MS + 100)).toBe(true);
  });

  it('pitch movement counts too', () => {
    const isStable = createStillnessDetector();
    isStable(0, 0, 0);
    expect(isStable(0, STILLNESS_THRESHOLD_DEG * 2, 100)).toBe(false);
  });
});
