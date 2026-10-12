// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSettings } from '../data/settingsStore';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { createCore, type Screen } from './core';

function fakeScreen(): Screen {
  const refreshable = () => ({ refresh: vi.fn() });
  return {
    lamps: refreshable(),
    targetBadge: refreshable(),
    sensorStatus: refreshable(),
    levelScreen: { show: vi.fn(), rebuildIfChanged: vi.fn() },
    settingsSurface: { followSource: vi.fn() },
    navigation: {},
  } as unknown as Screen;
}

describe('createCore', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/?demo');
  });

  it('reads ?demo and starts on the demo phone sensor', () => {
    const core = createCore(fakeScreen());
    expect(core.demo).toBe(true);
    expect(core.sensor().getSource()).toBe('phone');
    expect(core.sensor().getGravity()).not.toBeNull();
  });

  it('is not in demo without the flag', () => {
    history.replaceState(null, '', '/');
    expect(createCore(fakeScreen()).demo).toBe(false);
  });

  it('applies the stored look to the document', () => {
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' });
    createCore(fakeScreen());
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('has no calibration before anything is captured', () => {
    const core = createCore(fakeScreen());
    expect(core.effectiveCalibration()).toBeNull();
    expect(core.activeInstallOffset()).toBeNull();
  });

  it('takes the phone vehicle zero into the effective calibration and refreshes the lamps', () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    expect(core.optionDeps.phoneCalibration.zeroVehicle()).toBeNull();
    expect(core.effectiveCalibration()).not.toBeNull();
    expect(screen.lamps.refresh).toHaveBeenCalled();
  });

  it('settles a pending box once the phone is calibrated', () => {
    const core = createCore(fakeScreen());
    core.boxPending.settle(true);
    expect(core.boxPending.isPending()).toBe(true);
    core.optionDeps.phoneCalibration.zeroVehicle();
    expect(core.boxPending.isPending()).toBe(false);
  });

  it('adds the active target on top of the zero and refreshes the badge', () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    const { targets } = core.optionDeps;
    expect(targets.add('Sluttning')).toBeNull();
    targets.select(targets.presets()[0]!.id);
    expect(screen.targetBadge.refresh).toHaveBeenCalled();
    expect(targets.activeName()).toBe('Sluttning');
    expect(core.effectiveCalibration()).not.toBeNull();
  });
});
