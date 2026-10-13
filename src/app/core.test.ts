// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSettings } from '../data/settingsStore';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { t } from '../ui/i18n';
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

describe('createCore wiring a box in and out (#513)', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/?demo&easylevel-sim');
  });

  it('follows a switch to the simulated box and back to the phone', async () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    expect(await core.externalSensors.connect('easylevel')).toBe('granted');
    expect(core.sensor().getSource()).toBe('easylevel');
    expect(core.settings.get().sensorSource).toBe('easylevel');
    expect(screen.levelScreen.show).toHaveBeenCalled();
    expect(screen.settingsSurface.followSource).toHaveBeenLastCalledWith('easylevel');
    expect(screen.lamps.refresh).toHaveBeenCalled();
    // The status chip follows a retry; the first connect leaves it to the frame loop.
    expect(screen.sensorStatus.refresh).not.toHaveBeenCalled();
    await core.externalSensors.retry();
    expect(screen.sensorStatus.refresh).toHaveBeenCalledOnce();

    core.externalSensors.usePhoneSensor();
    expect(core.sensor().getSource()).toBe('phone');
    expect(core.settings.get().sensorSource).toBe('phone');
    expect(screen.settingsSurface.followSource).toHaveBeenLastCalledWith('phone');
    core.externalSensors.disconnect();
  });

  it('refreshes the lamps when a box zero is forgotten or a mounting is learned', () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    const refresh = screen.lamps.refresh as ReturnType<typeof vi.fn>;
    refresh.mockClear();
    core.optionDeps.boxZero.clear('easylevel');
    expect(refresh).toHaveBeenCalledOnce();
    core.optionDeps.boxWiring.onMountingChanged();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('refreshes the target badge when the active target changes', () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    expect(core.optionDeps.targets.add('Ferry')).toBeNull();
    const [ferry] = core.optionDeps.targets.presets();
    const refresh = screen.targetBadge.refresh as ReturnType<typeof vi.fn>;
    refresh.mockClear();
    core.optionDeps.targets.select(ferry?.id ?? null);
    expect(refresh).toHaveBeenCalledOnce();
    expect(core.optionDeps.targets.activeName()).toBe('Ferry');
  });

  it('refreshes the lamps when the phone zero is cleared', () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    core.optionDeps.phoneCalibration.zeroVehicle();
    const refresh = screen.lamps.refresh as ReturnType<typeof vi.fn>;
    refresh.mockClear();
    core.optionDeps.phoneCalibration.clearVehicleZero();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('tells the user no Xparkle box is connected before one was ever built', async () => {
    const screen = fakeScreen();
    const core = createCore(screen);
    const answer = await core.optionDeps.boxZero.zero('xparkle');
    expect(answer).toBe(
      t('calibration.external.err.notConnected', { name: XPARKLE_DESCRIPTOR.displayName }),
    );
  });
});
