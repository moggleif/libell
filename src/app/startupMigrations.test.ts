// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { runStartupMigrations } from './startupMigrations';

describe('runStartupMigrations', () => {
  beforeEach(() => localStorage.clear());

  it('copies the legacy box keys to the per-source ones, and counts saved settings', () => {
    const zero = JSON.stringify({ rollDeg: 1, pitchDeg: 2, capturedAt: 5 });
    localStorage.setItem('libell.easyLevelDeviceId', 'old-box');
    localStorage.setItem('libell.easyLevelInstallCalibration', zero);
    localStorage.setItem('libell.settings', '{}');
    runStartupMigrations();
    expect(localStorage.getItem('libell.sensorDevice.easylevel')).toBe('old-box');
    expect(localStorage.getItem('libell.installCalibration.easylevel')).toBe(zero);
    expect(localStorage.getItem('libell.measurementsSaved')).toBe('1');
  });

  it('runs once: a later legacy value is not copied again', () => {
    runStartupMigrations();
    localStorage.setItem('libell.easyLevelDeviceId', 'late');
    runStartupMigrations();
    expect(localStorage.getItem('libell.sensorDevice.easylevel')).toBeNull();
  });
});
