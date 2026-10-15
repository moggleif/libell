import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import type { KeyValueStorage } from './keyValueStorage';
import {
  loadCalibration,
  loadInstallCalibration,
  loadVehicleCalibration,
  loadZeroTrim,
  saveCalibration,
  saveInstallCalibration,
  saveVehicleCalibration,
  saveZeroTrim,
} from './calibrationStore';
import { loadRememberedDeviceId, saveRememberedDeviceId } from './sensorDeviceStore';
import { loadHitchPitch, loadSettings, saveHitchPitch, saveSettings } from './settingsStore';
import {
  captureActiveVehicle,
  loadVehicleList,
  restoreVehicle,
  saveVehicleList,
} from './vehicleStore';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const TILT = { rollDeg: 1, pitchDeg: 2 };

function motorhomeWithXparkle(storage: KeyValueStorage): void {
  saveSettings(
    { ...DEFAULT_SETTINGS, wheelbaseMm: 4000, sensorSource: 'xparkle', theme: 'dark' },
    storage,
  );
  saveCalibration(TILT, storage);
  saveVehicleCalibration(TILT, storage);
  saveInstallCalibration('xparkle', TILT, storage);
  saveZeroTrim('xparkle', { rollDeg: 0.1, pitchDeg: 0 }, storage);
  saveRememberedDeviceId('xparkle', 'device-1', storage);
  saveHitchPitch(1, storage);
}

describe('vehicle list', () => {
  it('is one unnamed vehicle on an install from before #599, and on a corrupt list', () => {
    const storage = memoryStorage();
    expect(loadVehicleList(storage).vehicles).toHaveLength(1);
    storage.setItem('libell.vehicles', '{"vehicles":7}');
    expect(loadVehicleList(storage).vehicles).toHaveLength(1);
  });

  it('survives a reload', () => {
    const storage = memoryStorage();
    const list = {
      activeId: 'b',
      vehicles: [
        { id: 'a', name: 'Bus', fields: {}, stored: {} },
        { id: 'b', name: 'Van', fields: {}, stored: {} },
      ],
    };
    saveVehicleList(list, storage);
    expect(loadVehicleList(storage)).toEqual(list);
  });
});

describe('moving a vehicle in and out', () => {
  it('captures the vehicle, then a fresh one leaves only the phone and the app-wide settings', () => {
    const storage = memoryStorage();
    motorhomeWithXparkle(storage);
    const first = captureActiveVehicle(storage);
    expect(first.fields.wheelbaseMm).toBe(4000);
    expect(first.fields.sensorSource).toBe('xparkle');

    restoreVehicle({ fields: { sensorSource: 'phone', wheelbaseMm: 2500 }, stored: {} }, storage);
    expect(loadSettings(storage).wheelbaseMm).toBe(2500);
    expect(loadSettings(storage).sensorSource).toBe('phone');
    expect(loadSettings(storage).theme).toBe('dark');
    expect(loadVehicleCalibration(storage)).toBeNull();
    expect(loadInstallCalibration('xparkle', storage)).toBeNull();
    expect(loadZeroTrim('xparkle', storage)).toBeNull();
    expect(loadRememberedDeviceId('xparkle', storage)).toBeNull();
    expect(loadHitchPitch(storage)).toBeNull();
    // The phone's own calibration describes the phone: shared.
    expect(loadCalibration(storage)).toEqual(TILT);

    restoreVehicle(first, storage);
    expect(loadSettings(storage).wheelbaseMm).toBe(4000);
    expect(loadSettings(storage).sensorSource).toBe('xparkle');
    expect(loadVehicleCalibration(storage)).toEqual(TILT);
    expect(loadInstallCalibration('xparkle', storage)).toEqual(TILT);
    expect(loadZeroTrim('xparkle', storage)).toEqual({ rollDeg: 0.1, pitchDeg: 0 });
    expect(loadRememberedDeviceId('xparkle', storage)).toBe('device-1');
    expect(loadHitchPitch(storage)).toBe(1);
  });

  it('never writes a key that is not a vehicle key', () => {
    const storage = memoryStorage();
    restoreVehicle({ fields: {}, stored: { 'libell.calibration': '"evil"' } }, storage);
    expect(storage.data.has('libell.calibration')).toBe(false);
  });

  it('reads a corrupt snapshot field as its default', () => {
    const storage = memoryStorage();
    restoreVehicle({ fields: { wheelbaseMm: 'long' }, stored: {} }, storage);
    expect(loadSettings(storage).wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
  });
});
