import { describe, expect, it } from 'vitest';
import { createDemoSensor, DEMO_TILT_DEG } from './demoSensor';
import { readTilt } from './tiltReading';

describe('createDemoSensor', () => {
  it('reads as the fixed demo tilt', () => {
    const tilt = readTilt(createDemoSensor()) as { rollDeg: number; pitchDeg: number };
    expect(tilt.rollDeg).toBeCloseTo(DEMO_TILT_DEG.roll);
    expect(tilt.pitchDeg).toBeCloseTo(DEMO_TILT_DEG.pitch);
    expect(DEMO_TILT_DEG).toEqual({ roll: -1.2, pitch: -0.35 });
  });

  it('is a granted phone sensor, always freshly sampled', async () => {
    const sensor = createDemoSensor();
    expect(await sensor.start()).toBe('granted');
    expect(sensor.getState()).toBe('granted');
    expect(sensor.getSource()).toBe('phone');
    const before = performance.now();
    expect(sensor.getLastSampleAt()).toBeGreaterThanOrEqual(before);
  });
});
