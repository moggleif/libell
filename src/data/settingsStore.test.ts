import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import {
  clearCalibration,
  hasStoredSettings,
  loadCalibration,
  loadSettings,
  saveCalibration,
  saveSettings,
  type KeyValueStorage,
  clearVehicleCalibration,
  loadVehicleCalibration,
  saveVehicleCalibration,
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
} from './settingsStore';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('settingsStore', () => {
  it('round-trips settings through storage', () => {
    const storage = memoryStorage();
    const settings = {
      vehicleType: 'caravan' as const,
      rearAxle: 'boggie' as const,
      wheelbaseMm: 3200,
      trackWidthFrontMm: 1900,
      trackWidthRearMm: 1650,
      rampStepHeightsMm: [30, 60],
      toleranceMm: 25,
      stabilityMm: 2,
      displayUnit: 'mm' as const,
      soundOnLevel: false,
      theme: 'dark' as const,
    };
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the stored JSON is corrupt', () => {
    const storage = memoryStorage({ 'libell.settings': '{not json' });
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when storage is unavailable', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, null)).not.toThrow();
  });

  it('reports whether settings were ever saved', () => {
    const storage = memoryStorage();
    expect(hasStoredSettings(storage)).toBe(false);
    saveSettings(DEFAULT_SETTINGS, storage);
    expect(hasStoredSettings(storage)).toBe(true);
  });
});

describe('calibration store', () => {
  it('round-trips a calibration and clears it', () => {
    const storage = memoryStorage();
    expect(loadCalibration(storage)).toBeNull();
    saveCalibration({ rollDeg: 0.8, pitchDeg: -0.4 }, storage);
    expect(loadCalibration(storage)).toEqual({ rollDeg: 0.8, pitchDeg: -0.4 });
    clearCalibration(storage);
    expect(loadCalibration(storage)).toBeNull();
  });

  it('rejects corrupt or implausible stored calibrations', () => {
    const storage = memoryStorage({ 'libell.calibration': '{not json' });
    expect(loadCalibration(storage)).toBeNull();
    saveCalibration({ rollDeg: 60, pitchDeg: 0 }, storage);
    expect(loadCalibration(storage)).toBeNull();
  });
});

describe('vehicle calibration store (#83)', () => {
  it('round-trips the vehicle zero and clears it', () => {
    const storage = memoryStorage();
    saveVehicleCalibration({ rollDeg: 0.4, pitchDeg: -0.2 }, storage);
    expect(loadVehicleCalibration(storage)).toEqual({ rollDeg: 0.4, pitchDeg: -0.2 });
    clearVehicleCalibration(storage);
    expect(loadVehicleCalibration(storage)).toBeNull();
  });

  it('rejects corrupt or implausible stored vehicle zeros', () => {
    const storage = memoryStorage();
    storage.setItem('libell.vehicleCalibration', 'not json');
    expect(loadVehicleCalibration(storage)).toBeNull();
    storage.setItem('libell.vehicleCalibration', JSON.stringify({ rollDeg: 40, pitchDeg: 0 }));
    expect(loadVehicleCalibration(storage)).toBeNull();
  });
});

describe('calibration timestamps (#87)', () => {
  it('stores when a calibration was captured and reads it back', () => {
    const storage = memoryStorage();
    saveCalibration({ rollDeg: 1, pitchDeg: 0 }, storage, 1700000000000);
    expect(loadCalibrationInfo(storage)).toEqual({
      value: { rollDeg: 1, pitchDeg: 0 },
      capturedAt: 1700000000000,
    });
    saveVehicleCalibration({ rollDeg: 0.4, pitchDeg: 0 }, storage, 1700000000001);
    expect(loadVehicleCalibrationInfo(storage)?.capturedAt).toBe(1700000000001);
  });

  it('keeps legacy calibrations without a timestamp valid, age unknown', () => {
    const storage = memoryStorage();
    storage.setItem('libell.calibration', JSON.stringify({ rollDeg: 1, pitchDeg: -0.5 }));
    expect(loadCalibrationInfo(storage)).toEqual({
      value: { rollDeg: 1, pitchDeg: -0.5 },
      capturedAt: null,
    });
    expect(loadCalibration(storage)).toEqual({ rollDeg: 1, pitchDeg: -0.5 });
  });
});
