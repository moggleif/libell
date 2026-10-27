import { describe, expect, it, vi } from 'vitest';
import type { Calibration } from '../domain/calibration';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { OrientationSensor } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import type { LibellBox } from './boxWiring';
import { calibrationOptions, targetOptions, type MenuOptionDeps } from './menuOptionParts';
import {
  boxPageOptions,
  buildMenuOptions,
  wizardBoxOptions,
  type MenuOptionsDeps,
} from './menuOptions';

function setup(
  overrides: Partial<MenuOptionsDeps> = {},
  easyLevel: unknown = null,
  calibration: Calibration | null = null,
) {
  let settings: LevelSettings = { ...DEFAULT_SETTINGS, vehicleType: 'motorhome' };
  const gravity = { x: 0, y: 0, z: 9.81 };
  const parts = {
    activeSensor: () =>
      ({ getSource: () => 'phone', getGravity: () => gravity }) as unknown as OrientationSensor,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    effectiveCalibration: () => calibration,
    phoneCalibration: {},
    boxZero: {},
    installOffsets: {},
    targets: { activeName: () => 'Ferry', presets: () => [] },
    boxes: {
      // The one fake box answers for either source; each option checks
      // getSource() itself.
      getSensor: (source: string) =>
        source === 'easylevel' || source === 'xparkle' ? (easyLevel as LibellBox | null) : null,
    },
    boxWiring: {
      settings: { get: () => settings, set: (next: LevelSettings) => (settings = next) },
      getSensor: () => null,
      onMountingChanged: () => {},
    },
  } as unknown as MenuOptionDeps;
  const deps: MenuOptionsDeps = {
    parts,
    settings: () => settings,
    onSettingsSaved: vi.fn(),
    openBoxPage: vi.fn(),
    shareVehicleSetup: vi.fn(),
    ...overrides,
  };
  return {
    options: buildMenuOptions(deps),
    deps,
    parts,
    change: (next: Partial<LevelSettings>) => (settings = { ...settings, ...next }),
    settings: () => settings,
  };
}

describe('buildMenuOptions', () => {
  it('starts from the settings as they are when built', () => {
    const { options, change } = setup();
    const initial = options.initialSettings;
    change({ appearance: 'classic' });
    expect(options.initialSettings).toBe(initial);
    expect(options.calibration.appearance).toBe(DEFAULT_SETTINGS.appearance);
  });

  it('reads the sound live', () => {
    const { options, change } = setup();
    change({ soundOnLevel: false, soundGuidance: true, soundSpeech: true });
    expect(options.getSoundPrefs()).toEqual({
      soundOnLevel: false,
      soundGuidance: true,
      soundSpeech: true,
    });
  });

  it('passes saves, the box page and sharing through', () => {
    const { options, deps, settings } = setup();
    options.onSettingsSaved(settings());
    options.calibration.openBoxPage();
    options.onShareVehicleSetup(settings());
    expect(deps.onSettingsSaved).toHaveBeenCalledWith(settings());
    expect(deps.openBoxPage).toHaveBeenCalledTimes(1);
    expect(deps.shareVehicleSetup).toHaveBeenCalledWith(settings());
  });

  it('groups the calibration and the targets for the sections that read them', () => {
    const { options, parts } = setup();
    for (const key of Object.keys(calibrationOptions(parts))) {
      expect(options.calibration).toHaveProperty(key);
    }
    for (const key of Object.keys(targetOptions(parts.targets))) {
      expect(options.targets).toHaveProperty(key);
    }
    expect(options.targets).toHaveProperty('hitch');
  });
});

describe('box options', () => {
  it("give a box page that box's connection, status and setup", () => {
    const { parts } = setup();
    const page = boxPageOptions(XPARKLE_DESCRIPTOR, parts);
    expect(page.sensor).toBe(XPARKLE_DESCRIPTOR);
    expect(page).toHaveProperty('getDeviceId');
    expect(page).toHaveProperty('password');
    expect(page.getVehicleType()).toBe('motorhome');
  });

  it("give the wizard's box step the box without its live status", () => {
    const { parts } = setup();
    const step = wizardBoxOptions(XPARKLE_DESCRIPTOR, parts);
    expect(step.sensor).toBe(XPARKLE_DESCRIPTOR);
    expect(step).toHaveProperty('learnMounting');
    expect(step).not.toHaveProperty('getDeviceId');
  });

  it('read the vehicle type live', () => {
    const { parts, change } = setup();
    change({ vehicleType: 'caravan' });
    expect(boxPageOptions(XPARKLE_DESCRIPTOR, parts).getVehicleType()).toBe('caravan');
  });

  it('read the calibrated tilt of the active sensor', () => {
    const { parts } = setup({}, null, { rollDeg: 1, pitchDeg: 0 });
    expect(boxPageOptions(XPARKLE_DESCRIPTOR, parts).getCalibratedTilt()?.rollDeg).toBeCloseTo(-1);
  });

  it("read and store EasyLevel's connect delay", () => {
    const { parts, settings } = setup();
    const page = boxPageOptions(EASYLEVEL_DESCRIPTOR, parts);
    page.setEasyLevelConnectDelay(true, 1500);
    expect(easyLevelSettings(settings()).connectDelayEnabled).toBe(true);
    expect(page.getEasyLevelConnectDelay()).toEqual({
      enabled: true,
      ms: easyLevelSettings(settings()).connectDelayMs,
    });
  });

  it("show EasyLevel's raw bytes only while it is an EasyLevel", () => {
    const bytes = (easyLevel: unknown) =>
      boxPageOptions(EASYLEVEL_DESCRIPTOR, setup({}, easyLevel).parts).getEasyLevelStatusBytes();
    expect(bytes(null)).toBeNull();
    expect(bytes({ getSource: () => 'easylevel', getStatusBytes: () => [0x66, 0x08] })).toEqual([
      0x66, 0x08,
    ]);
    expect(bytes({ getSource: () => 'phone', getStatusBytes: () => [1] })).toBeNull();
  });

  it("show the Xparkle's serial number and firmware bytes only while it is an Xparkle (#597)", () => {
    const bytes = (xparkle: unknown) =>
      boxPageOptions(XPARKLE_DESCRIPTOR, setup({}, xparkle).parts).getXparkleVersionBytes();
    expect(bytes(null)).toBeNull();
    expect(bytes({ getSource: () => 'xparkle', getVersionBytes: () => [0x53, 0x01] })).toEqual([
      0x53, 0x01,
    ]);
    expect(bytes({ getSource: () => 'phone', getVersionBytes: () => [1] })).toBeNull();
  });
});
