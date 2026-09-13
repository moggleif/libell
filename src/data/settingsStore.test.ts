import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import {
  clearCalibration,
  hasDoneOnboarding,
  hasStoredSettings,
  loadCalibration,
  loadSettings,
  markOnboardingDone,
  saveCalibration,
  saveSettings,
  type KeyValueStorage,
  clearVehicleCalibration,
  loadVehicleCalibration,
  saveVehicleCalibration,
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
  clearInstallCalibration,
  loadInstallCalibration,
  loadInstallCalibrationInfo,
  migrateLegacyInstallCalibration,
  saveInstallCalibration,
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
      dwellRestMs: 700,
      dwellMotionMs: 200,
      displayUnit: 'mm' as const,
      soundOnLevel: false,
      soundGuidance: false,
      theme: 'dark' as const,
      appearance: 'modern' as const,
      sensorSource: 'phone' as const,
      sensorDevices: {
        easylevel: { mounting: 'rotated90', connectDelayEnabled: false, connectDelayMs: 300 },
      },
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

// Design review, follow-up: distinct from `hasSeenOnboarding`/
// `markOnboardingSeen` (untested here, unchanged) — that pair means "the
// wizard was dismissed at least once, either way" and gates the
// auto-launch on first load. This pair means "actually stepped through
// to the end" and drives whether "Show introduction" reads as an
// unfinished first-run task or a plain re-launch.
describe('onboarding completion tracking', () => {
  it('is false until explicitly marked, then true', () => {
    const storage = memoryStorage();
    expect(hasDoneOnboarding(storage)).toBe(false);
    markOnboardingDone(storage);
    expect(hasDoneOnboarding(storage)).toBe(true);
  });

  it('defaults to true (not a nag) when storage access throws', () => {
    const throwingStorage: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    };
    expect(hasDoneOnboarding(throwingStorage)).toBe(true);
    expect(() => markOnboardingDone(throwingStorage)).not.toThrow();
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

describe('per-source installation calibration store (#131, ADR 0014; keyed per source by #263)', () => {
  it('round-trips the installation offset and clears it', () => {
    const storage = memoryStorage();
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
    saveInstallCalibration('easylevel', { rollDeg: 1.1, pitchDeg: -0.6 }, storage);
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 1.1, pitchDeg: -0.6 });
    clearInstallCalibration('easylevel', storage);
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
  });

  it('rejects corrupt or implausible stored installation offsets', () => {
    const storage = memoryStorage();
    storage.setItem('libell.installCalibration.easylevel', 'not json');
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
    storage.setItem(
      'libell.installCalibration.easylevel',
      JSON.stringify({ rollDeg: 40, pitchDeg: 0 }),
    );
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
  });

  it('stores its capture timestamp independently of the other calibration layers', () => {
    const storage = memoryStorage();
    saveInstallCalibration('easylevel', { rollDeg: 0.3, pitchDeg: 0.1 }, storage, 1700000000002);
    expect(loadInstallCalibrationInfo('easylevel', storage)).toEqual({
      value: { rollDeg: 0.3, pitchDeg: 0.1 },
      capturedAt: 1700000000002,
    });
  });

  it('never shares a key, or gets touched by clearing, the phone vehicle zero', () => {
    const storage = memoryStorage();
    saveVehicleCalibration({ rollDeg: 2, pitchDeg: -1 }, storage);
    saveInstallCalibration('easylevel', { rollDeg: 5, pitchDeg: 3 }, storage);
    expect(loadVehicleCalibration(storage)).toEqual({ rollDeg: 2, pitchDeg: -1 });
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 5, pitchDeg: 3 });
    // Clearing one must leave the other completely intact.
    clearInstallCalibration('easylevel', storage);
    expect(loadVehicleCalibration(storage)).toEqual({ rollDeg: 2, pitchDeg: -1 });
    clearVehicleCalibration(storage);
    saveInstallCalibration('easylevel', { rollDeg: 5, pitchDeg: 3 }, storage);
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 5, pitchDeg: 3 });
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

describe('one installation offset per source (#263)', () => {
  it('never lets two sources share a value, however they are cleared', () => {
    // ADR 0014's "never conflate" rule, made concrete: an installation
    // offset describes where one box sits in one vehicle, so a shared
    // value would produce confidently wrong guidance, not a visible fault.
    const storage = memoryStorage();
    saveInstallCalibration('easylevel', { rollDeg: 1, pitchDeg: 2 }, storage);
    saveInstallCalibration('phone' as never, { rollDeg: -3, pitchDeg: -4 }, storage);
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 1, pitchDeg: 2 });
    clearInstallCalibration('phone' as never, storage);
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 1, pitchDeg: 2 });
  });
});

describe('migrating #131’s installation offset to its per-source key (#263)', () => {
  const LEGACY_KEY = 'libell.easyLevelInstallCalibration';
  const NEW_KEY = 'libell.installCalibration.easylevel';

  it('carries the offset and its capture timestamp over, so nobody re-levels', () => {
    const storage = memoryStorage();
    storage.setItem(
      LEGACY_KEY,
      JSON.stringify({ rollDeg: 1.5, pitchDeg: -0.5, capturedAt: 1700000000003 }),
    );
    migrateLegacyInstallCalibration(storage);
    expect(loadInstallCalibrationInfo('easylevel', storage)).toEqual({
      value: { rollDeg: 1.5, pitchDeg: -0.5 },
      capturedAt: 1700000000003,
    });
  });

  it('leaves the legacy key in place, so a rolled-back build still finds it', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_KEY, JSON.stringify({ rollDeg: 1.5, pitchDeg: -0.5 }));
    migrateLegacyInstallCalibration(storage);
    expect(storage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it('never runs twice, and never resurrects an offset the user has cleared', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_KEY, JSON.stringify({ rollDeg: 1.5, pitchDeg: -0.5 }));
    migrateLegacyInstallCalibration(storage);
    clearInstallCalibration('easylevel', storage);
    migrateLegacyInstallCalibration(storage);
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
  });

  it('never overwrites a newer offset already stored under the new key', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_KEY, JSON.stringify({ rollDeg: 9, pitchDeg: 9 }));
    storage.setItem(NEW_KEY, JSON.stringify({ rollDeg: 1, pitchDeg: 1 }));
    migrateLegacyInstallCalibration(storage);
    expect(loadInstallCalibration('easylevel', storage)).toEqual({ rollDeg: 1, pitchDeg: 1 });
  });

  it('is a no-op on a fresh install with nothing stored', () => {
    const storage = memoryStorage();
    migrateLegacyInstallCalibration(storage);
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
  });

  it('still validates what it copied — a corrupt legacy value reads as none', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_KEY, JSON.stringify({ rollDeg: 40, pitchDeg: 0 }));
    migrateLegacyInstallCalibration(storage);
    expect(loadInstallCalibration('easylevel', storage)).toBeNull();
  });
});
