import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { OrientationSensor } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import type { LibellBox } from './boxWiring';
import type { MenuOptionDeps } from './menuOptionParts';
import {
  boxPageOptions,
  buildMenuOptions,
  sharedOptions,
  wizardBoxOptions,
  type MenuOptionsDeps,
} from './menuOptions';

function setup(overrides: Partial<MenuOptionsDeps> = {}, easyLevel: unknown = null) {
  let settings: LevelSettings = { ...DEFAULT_SETTINGS, vehicleType: 'motorhome' };
  const gravity = { x: 0, y: 0, z: 9.81 };
  const parts = {
    activeSensor: () =>
      ({ getSource: () => 'phone', getGravity: () => gravity }) as unknown as OrientationSensor,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    phoneCalibration: {},
    boxZero: {},
    installOffsets: {},
    targets: { activeName: () => 'Ferry', presets: () => [] },
    boxes: {
      getSensor: (source: string) =>
        source === 'easylevel' ? (easyLevel as LibellBox | null) : null,
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
    demo: false,
    hasStoredMeasurements: () => false,
    onSettingsSaved: vi.fn(),
    openOnboarding: vi.fn(),
    openBoxPage: vi.fn(),
    effectiveCalibration: () => null,
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
    expect(options.appearance).toBe(DEFAULT_SETTINGS.appearance);
  });

  it('reads the vehicle type and sound live', () => {
    const { options, change } = setup();
    change({ vehicleType: 'caravan', soundOnLevel: false, soundGuidance: true });
    expect(options.getVehicleType()).toBe('caravan');
    expect(options.getSoundPrefs()).toEqual({ soundOnLevel: false, soundGuidance: true });
  });

  it('counts demo mode as saved settings', () => {
    expect(setup().options.hasSavedSettings()).toBe(false);
    expect(setup({ demo: true }).options.hasSavedSettings()).toBe(true);
    expect(setup({ hasStoredMeasurements: () => true }).options.hasSavedSettings()).toBe(true);
  });

  it('passes saves, the wizard, the box page and sharing through', () => {
    const { options, deps, settings } = setup();
    options.onSettingsSaved(settings());
    options.openOnboarding();
    options.openBoxPage();
    options.onShareVehicleSetup(settings());
    expect(deps.onSettingsSaved).toHaveBeenCalledWith(settings());
    expect(deps.openOnboarding).toHaveBeenCalledTimes(1);
    expect(deps.openBoxPage).toHaveBeenCalledTimes(1);
    expect(deps.shareVehicleSetup).toHaveBeenCalledWith(settings());
  });

  it('names the active target', () => {
    expect(setup().options.getActiveTargetName()).toBe('Ferry');
  });

  it('reads the calibrated tilt of the active sensor', () => {
    const { options } = setup({ effectiveCalibration: () => ({ rollDeg: 1, pitchDeg: 0 }) });
    expect(options.getCalibratedTilt()?.rollDeg).toBeCloseTo(-1);
  });

  it("reads and stores EasyLevel's connect delay", () => {
    const { options, settings } = setup();
    options.setEasyLevelConnectDelay(true, 1500);
    expect(easyLevelSettings(settings()).connectDelayEnabled).toBe(true);
    expect(options.getEasyLevelConnectDelay()).toEqual({
      enabled: true,
      ms: easyLevelSettings(settings()).connectDelayMs,
    });
  });

  it("shows EasyLevel's raw bytes only while it is an EasyLevel", () => {
    expect(setup().options.getEasyLevelStatusBytes()).toBeNull();
    const box = { getSource: () => 'easylevel', getStatusBytes: () => [0x66, 0x08] };
    expect(setup({}, box).options.getEasyLevelStatusBytes()).toEqual([0x66, 0x08]);
    const other = { getSource: () => 'phone', getStatusBytes: () => [1] };
    expect(setup({}, other).options.getEasyLevelStatusBytes()).toBeNull();
  });

  it('has no EasyLevel health before the box exists', () => {
    expect(setup().options.getHealth()).toBeNull();
  });

  it('carries the shared groups with EasyLevel as the top-level box', () => {
    const { options, parts } = setup();
    for (const key of Object.keys(sharedOptions(parts))) expect(options).toHaveProperty(key);
    expect(options.sensor).toBe(EASYLEVEL_DESCRIPTOR);
  });
});

describe('box options', () => {
  it("give a box page that box's connection, status and setup", () => {
    const { options, parts } = setup();
    const page = boxPageOptions(options, XPARKLE_DESCRIPTOR, parts);
    expect(page.sensor).toBe(XPARKLE_DESCRIPTOR);
    expect(page).toHaveProperty('getDeviceId');
    expect(page).toHaveProperty('password');
    expect(page.getVehicleType()).toBe('motorhome');
  });

  it("give the wizard's box step the box without its live status", () => {
    const { options, parts } = setup();
    const step = wizardBoxOptions(options, XPARKLE_DESCRIPTOR, parts);
    expect(step.sensor).toBe(XPARKLE_DESCRIPTOR);
    expect(step).toHaveProperty('learnMounting');
    expect(step).not.toHaveProperty('getDeviceId');
  });
});
