import { describe, expect, it, vi } from 'vitest';
import type { OrientationSensor } from '../sensor/orientation';
import { t } from '../ui/i18n';
import { calibratedTilt, exceedsCalibrationLimit, readTilt } from './tiltReading';

function sensorWith(gravity: { x: number; y: number; z: number } | null) {
  const start = vi.fn(() => Promise.resolve('granted' as const));
  const sensor = { getGravity: () => gravity, start } as unknown as OrientationSensor;
  return { sensor, start };
}

describe('readTilt', () => {
  it('reads roll from x and pitch from y, in degrees', () => {
    const { sensor } = sensorWith({ x: 1, y: -1, z: 1 });
    const reading = readTilt(sensor) as { rollDeg: number; pitchDeg: number };
    expect(reading.rollDeg).toBeCloseTo(45);
    expect(reading.pitchDeg).toBeCloseTo(-45);
  });

  it('starts the sensor and says so when there is no reading yet', () => {
    const { sensor, start } = sensorWith(null);
    expect(readTilt(sensor)).toBe(t('calibration.err.notRunning'));
    expect(start).toHaveBeenCalledTimes(1);
  });
});

describe('calibratedTilt', () => {
  it('subtracts the calibration from the reading', () => {
    const { sensor } = sensorWith({ x: 1, y: 0, z: 1 });
    const tilt = calibratedTilt(sensor, { rollDeg: 40, pitchDeg: 1 })!;
    expect(tilt.rollDeg).toBeCloseTo(5);
    expect(tilt.pitchDeg).toBeCloseTo(-1);
  });

  it('is null with no reading, and never starts the sensor', () => {
    const { sensor, start } = sensorWith(null);
    expect(calibratedTilt(sensor, null)).toBeNull();
    expect(start).not.toHaveBeenCalled();
  });
});

describe('exceedsCalibrationLimit', () => {
  it('allows up to 15° on either axis', () => {
    expect(exceedsCalibrationLimit({ rollDeg: 15, pitchDeg: -15 })).toBe(false);
    expect(exceedsCalibrationLimit({ rollDeg: 15.1, pitchDeg: 0 })).toBe(true);
    expect(exceedsCalibrationLimit({ rollDeg: 0, pitchDeg: -15.1 })).toBe(true);
  });
});
