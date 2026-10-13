import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import * as calibration from './calibrationStore';
import type { KeyValueStorage } from './keyValueStorage';
import * as devices from './sensorDeviceStore';
import * as settings from './settingsStore';

// Pinned before #511 moved every try/catch into keyValueStorage.ts: what each
// store function gives back, or that it stays quiet, when storage is blocked.
const blocked: KeyValueStorage = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {
    throw new Error('blocked');
  },
};

/** Reads work, every write throws (storage full). */
function fullStorage(initial: Record<string, string>): KeyValueStorage {
  return {
    getItem: (key) => initial[key] ?? null,
    setItem() {
      throw new Error('full');
    },
    removeItem() {
      throw new Error('full');
    },
  };
}

const tilt = { rollDeg: 1, pitchDeg: 2 };
const preset = { id: 'a', name: 'Ferry', offset: tilt };

describe('stores under blocked storage (#511)', () => {
  it('reads every value as its safe default', () => {
    expect(settings.loadSettings(blocked)).toEqual(DEFAULT_SETTINGS);
    expect(settings.hasStoredMeasurements(blocked)).toBe(false);
    expect(settings.loadLanguage(blocked)).toBeNull();
    expect(settings.hasSeenOnboarding(blocked)).toBe(true);
    expect(settings.hasDoneOnboarding(blocked)).toBe(true);
    expect(settings.isBoxPending(blocked)).toBe(false);
    expect(settings.loadTargetPresets(blocked)).toEqual([]);
    expect(settings.loadActiveTargetId([preset], blocked)).toBeNull();
    expect(calibration.loadCalibration(blocked)).toBeNull();
    expect(calibration.loadCalibrationInfo(blocked)).toBeNull();
    expect(calibration.loadVehicleCalibration(blocked)).toBeNull();
    expect(calibration.loadInstallCalibrationInfo('easylevel', blocked)).toBeNull();
    expect(devices.loadRememberedDeviceId('easylevel', blocked)).toBeNull();
  });

  it('never throws on a write, a clear or a migration', () => {
    const writes = [
      () => settings.saveSettings(DEFAULT_SETTINGS, blocked),
      () => settings.markMeasurementsSaved(blocked),
      () => settings.migrateMeasurementsSaved(blocked),
      () => settings.saveLanguage('sv', blocked),
      () => settings.clearLanguage(blocked),
      () => settings.markOnboardingSeen(blocked),
      () => settings.markOnboardingDone(blocked),
      () => settings.setBoxPending(true, blocked),
      () => settings.setBoxPending(false, blocked),
      () => settings.saveTargetPresets([preset], blocked),
      () => settings.saveActiveTargetId('a', blocked),
      () => settings.saveActiveTargetId(null, blocked),
      () => calibration.saveCalibration(tilt, blocked),
      () => calibration.clearCalibration(blocked),
      () => calibration.saveVehicleCalibration(tilt, blocked),
      () => calibration.clearVehicleCalibration(blocked),
      () => calibration.saveInstallCalibration('easylevel', tilt, blocked),
      () => calibration.clearInstallCalibration('easylevel', blocked),
      () => calibration.migrateLegacyInstallCalibration(blocked),
      () => devices.saveRememberedDeviceId('easylevel', 'id', blocked),
      () => devices.clearRememberedDeviceId('easylevel', blocked),
      () => devices.migrateLegacyRememberedDeviceId(blocked),
    ];
    for (const write of writes) expect(write).not.toThrow();
  });
});

describe('stores without storage (#511)', () => {
  it('reads defaults and writes nothing', () => {
    expect(settings.loadLanguage(null)).toBeUndefined();
    expect(settings.hasSeenOnboarding(null)).toBe(false);
    expect(settings.hasDoneOnboarding(null)).toBe(false);
    expect(settings.isBoxPending(null)).toBe(false);
    expect(calibration.loadVehicleCalibrationInfo(null)).toBeNull();
    expect(devices.loadRememberedDeviceId('xparkle', null)).toBeNull();
    expect(() => calibration.migrateLegacyInstallCalibration(null)).not.toThrow();
    expect(() => devices.migrateLegacyRememberedDeviceId(null)).not.toThrow();
    expect(() => settings.setBoxPending(true, null)).not.toThrow();
  });
});

describe('migrations under full storage (#511)', () => {
  it('copy nothing and leave no marker, so the next start retries', () => {
    const legacy = {
      'libell.settings': JSON.stringify(DEFAULT_SETTINGS),
      'libell.easyLevelInstallCalibration': JSON.stringify(tilt),
      'libell.easyLevelDeviceId': 'old-id',
    };
    const storage = fullStorage(legacy);
    expect(() => settings.migrateMeasurementsSaved(storage)).not.toThrow();
    expect(() => calibration.migrateLegacyInstallCalibration(storage)).not.toThrow();
    expect(() => devices.migrateLegacyRememberedDeviceId(storage)).not.toThrow();
    expect(settings.hasStoredMeasurements(storage)).toBe(false);
  });
});

describe('a flag that holds something other than "1" (#511)', () => {
  it('counts measurements as saved by presence, the other flags only by "1"', () => {
    const storage = fullStorage({
      'libell.measurementsSaved': 'yes',
      'libell.onboarded': 'yes',
      'libell.onboardingDone': 'yes',
      'libell.boxPending': 'yes',
    });
    expect(settings.hasStoredMeasurements(storage)).toBe(true);
    expect(settings.hasSeenOnboarding(storage)).toBe(false);
    expect(settings.hasDoneOnboarding(storage)).toBe(false);
    expect(settings.isBoxPending(storage)).toBe(false);
  });

  it('ignores an empty legacy device id but copies an empty legacy offset', () => {
    const data: Record<string, string> = {
      'libell.easyLevelDeviceId': '',
      'libell.easyLevelInstallCalibration': '',
    };
    const storage: KeyValueStorage = {
      getItem: (key) => data[key] ?? null,
      setItem: (key, value) => void (data[key] = value),
      removeItem: (key) => void delete data[key],
    };
    devices.migrateLegacyRememberedDeviceId(storage);
    calibration.migrateLegacyInstallCalibration(storage);
    expect('libell.sensorDevice.easylevel' in data).toBe(false);
    expect(data['libell.installCalibration.easylevel']).toBe('');
  });
});
