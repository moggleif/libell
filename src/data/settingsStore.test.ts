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
  loadActiveTargetId,
  loadTargetPresets,
  saveActiveTargetId,
  saveTargetPresets,
} from './settingsStore';
import type { TargetPreset } from '../domain/targetPresets';

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
      rampCount: 3,
      drainPosition: 'right' as const,
      toleranceMm: 25,
      stabilityMm: 2,
      displayUnit: 'mm' as const,
      soundOnLevel: false,
      soundGuidance: false,
      theme: 'dark' as const,
      appearance: 'modern' as const,
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

describe('target preset store (#122, ADR 0013)', () => {
  const preset: TargetPreset = {
    id: 'a',
    name: 'Shower drain',
    offset: { rollDeg: 1.5, pitchDeg: -0.5 },
  };

  it('round-trips the preset list, stored separately from calibration keys', () => {
    const storage = memoryStorage();
    expect(loadTargetPresets(storage)).toEqual([]);
    saveTargetPresets([preset], storage);
    expect(loadTargetPresets(storage)).toEqual([preset]);
    // Never conflated with either calibration layer's key.
    expect(loadCalibration(storage)).toBeNull();
    expect(loadVehicleCalibration(storage)).toBeNull();
  });

  it('drops a corrupt preset on read without losing the rest', () => {
    const storage = memoryStorage();
    storage.setItem(
      'libell.targetPresets',
      JSON.stringify([preset, { id: 'bad', name: 'x', offset: { rollDeg: 99, pitchDeg: 0 } }]),
    );
    expect(loadTargetPresets(storage)).toEqual([preset]);
  });

  it('falls back to an empty list for corrupt or missing storage', () => {
    expect(loadTargetPresets(memoryStorage({ 'libell.targetPresets': '{not json' }))).toEqual([]);
    expect(loadTargetPresets(null)).toEqual([]);
  });

  it('round-trips the active target id, validated against the preset list', () => {
    const storage = memoryStorage();
    expect(loadActiveTargetId([preset], storage)).toBeNull();
    saveActiveTargetId('a', storage);
    expect(loadActiveTargetId([preset], storage)).toBe('a');
  });

  it('resolves a dangling active id (preset deleted) to Normal', () => {
    const storage = memoryStorage();
    saveActiveTargetId('a', storage);
    // The preset behind "a" is gone from the list passed on this read.
    expect(loadActiveTargetId([], storage)).toBeNull();
  });

  it('Normal (null) removes the stored key entirely — never a stored value', () => {
    const storage = memoryStorage();
    saveActiveTargetId('a', storage);
    expect(storage.getItem('libell.activeTarget')).not.toBeNull();
    saveActiveTargetId(null, storage);
    expect(storage.getItem('libell.activeTarget')).toBeNull();
    expect(loadActiveTargetId([preset], storage)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    expect(() => saveTargetPresets([preset], null)).not.toThrow();
    expect(() => saveActiveTargetId('a', null)).not.toThrow();
    expect(loadActiveTargetId([], null)).toBeNull();
  });
});
