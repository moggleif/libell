import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage } from '../data/keyValueStorage';
import {
  loadCalibration,
  loadVehicleCalibration,
  saveCalibration,
  saveVehicleCalibration,
} from '../data/calibrationStore';
import { loadRememberedDeviceId, saveRememberedDeviceId } from '../data/sensorDeviceStore';
import {
  loadSettings,
  hasStoredMeasurements,
  markMeasurementsSaved,
  loadTargetPresets,
  saveSettings,
  saveTargetPresets,
} from '../data/settingsStore';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { createVehicles } from './vehicles';

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const ZERO = { rollDeg: 0.5, pitchDeg: -0.5 };
const BIAS = { rollDeg: 0.2, pitchDeg: 0.1 };

/** An install from before #599: a motorhome with its Xparkle box, zero and target. */
function setup() {
  const storage = memoryStorage();
  saveSettings(
    { ...DEFAULT_SETTINGS, wheelbaseMm: 4000, sensorSource: 'xparkle', theme: 'dark' },
    storage,
  );
  saveCalibration(BIAS, storage);
  saveVehicleCalibration(ZERO, storage);
  saveRememberedDeviceId('xparkle', 'box-1', storage);
  saveTargetPresets([{ id: 't', name: 'Ferry', offset: ZERO }], storage);
  const reload = vi.fn();
  let n = 0;
  const vehicles = createVehicles({ storage, reload, newId: () => `v${++n}` });
  return { storage, reload, vehicles };
}

describe('createVehicles', () => {
  it('starts with the existing install as one unnamed vehicle, nothing lost', () => {
    const { vehicles, storage } = setup();
    expect(vehicles.list()).toEqual([{ id: 'vehicle-1', name: '' }]);
    expect(vehicles.activeId()).toBe('vehicle-1');
    expect(loadSettings(storage).wheelbaseMm).toBe(4000);
    expect(loadVehicleCalibration(storage)).toEqual(ZERO);
  });

  it('adds a new vehicle with default measurements, no box, no zero, and makes it active', () => {
    const { vehicles, storage, reload } = setup();
    vehicles.add('Caravan');
    expect(vehicles.list()).toEqual([
      { id: 'vehicle-1', name: '' },
      { id: 'v1', name: 'Caravan' },
    ]);
    expect(vehicles.activeId()).toBe('v1');
    expect(reload).toHaveBeenCalledOnce();
    const settings = loadSettings(storage);
    expect(settings.wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
    expect(settings.sensorSource).toBe('phone');
    expect(settings.theme).toBe('dark');
    expect(loadVehicleCalibration(storage)).toBeNull();
    expect(loadRememberedDeviceId('xparkle', storage)).toBeNull();
    expect(loadTargetPresets(storage)).toEqual([]);
    expect(loadCalibration(storage)).toEqual(BIAS);
  });

  it('adds a shared setup as a new vehicle', () => {
    const { vehicles, storage } = setup();
    vehicles.add('Shared', {
      vehicleType: 'caravan',
      rearAxle: 'single',
      wheelbaseMm: 3600,
      trackWidthFrontMm: 1900,
      trackWidthRearMm: 1900,
      rampStepHeightsMm: [30, 60],
      rampStepless: false,
      rampCount: 2,
      drainPosition: 'none',
    });
    expect(loadSettings(storage).vehicleType).toBe('caravan');
    expect(loadSettings(storage).wheelbaseMm).toBe(3600);
    expect(hasStoredMeasurements(storage)).toBe(true);
  });

  it('lights the measurements lamp for a new vehicle on defaults, not for the first one', () => {
    const { vehicles, storage } = setup();
    markMeasurementsSaved(storage);
    vehicles.add('Caravan');
    expect(hasStoredMeasurements(storage)).toBe(false);
    vehicles.switchTo('vehicle-1');
    expect(hasStoredMeasurements(storage)).toBe(true);
  });

  it('switches back with its box, zero and targets, and keeps the other vehicle’s', () => {
    const { vehicles, storage, reload } = setup();
    vehicles.add('Caravan');
    saveSettings({ ...loadSettings(storage), vehicleType: 'caravan' }, storage);
    vehicles.switchTo('vehicle-1');
    expect(reload).toHaveBeenCalledTimes(2);
    expect(loadSettings(storage).sensorSource).toBe('xparkle');
    expect(loadSettings(storage).wheelbaseMm).toBe(4000);
    expect(loadSettings(storage).vehicleType).toBe('motorhome');
    expect(loadVehicleCalibration(storage)).toEqual(ZERO);
    expect(loadRememberedDeviceId('xparkle', storage)).toBe('box-1');
    expect(loadTargetPresets(storage)).toHaveLength(1);
    vehicles.switchTo('v1');
    expect(loadSettings(storage).vehicleType).toBe('caravan');
    expect(loadSettings(storage).sensorSource).toBe('phone');
  });

  it('does nothing when switching to the active vehicle or an unknown one', () => {
    const { vehicles, reload } = setup();
    vehicles.switchTo('vehicle-1');
    vehicles.switchTo('nope');
    expect(reload).not.toHaveBeenCalled();
  });

  it('renames a vehicle without reloading', () => {
    const { vehicles, reload } = setup();
    vehicles.rename('vehicle-1', 'Motorhome');
    expect(vehicles.list()).toEqual([{ id: 'vehicle-1', name: 'Motorhome' }]);
    expect(reload).not.toHaveBeenCalled();
  });

  it('tells the main screen about a rename (#616)', () => {
    const onRenamed = vi.fn();
    const vehicles = createVehicles({ reload: vi.fn(), onRenamed, storage: memoryStorage() });
    vehicles.rename(vehicles.activeId(), 'Motorhome');
    expect(onRenamed).toHaveBeenCalledOnce();
  });

  it('never removes the only vehicle', () => {
    const { vehicles } = setup();
    expect(vehicles.remove('vehicle-1')).toBe(false);
    expect(vehicles.list()).toHaveLength(1);
  });

  it('removes a waiting vehicle quietly, and the active one by switching to another', () => {
    const { vehicles, storage, reload } = setup();
    vehicles.add('Caravan');
    vehicles.add('Van');
    expect(vehicles.remove('v1')).toBe(true);
    expect(vehicles.list().map((v) => v.id)).toEqual(['vehicle-1', 'v2']);
    expect(reload).toHaveBeenCalledTimes(2);
    expect(vehicles.remove('v2')).toBe(true);
    expect(reload).toHaveBeenCalledTimes(3);
    expect(vehicles.activeId()).toBe('vehicle-1');
    expect(loadSettings(storage).sensorSource).toBe('xparkle');
    expect(loadVehicleCalibration(storage)).toEqual(ZERO);
  });
});
