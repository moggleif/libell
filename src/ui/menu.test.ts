// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createMenu, type MenuOptions } from './menu';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

function makeOptions(overrides: Partial<MenuOptions> = {}): MenuOptions {
  const initialSettings = overrides.initialSettings ?? DEFAULT_SETTINGS;
  return {
    initialSettings,
    appearance: initialSettings.appearance,
    openOnboarding: () => {},
    onSettingsSaved: () => {},
    hasSavedSettings: () => false,
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'checked',
    checkVehicleCalibration: () => 'checked',
    getTargetPresets: () => [],
    getActiveTargetId: () => null,
    selectTarget: () => {},
    addTargetPreset: () => null,
    deleteTargetPreset: () => {},
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectEasyLevel: () => Promise.resolve('unsupported'),
    disconnectEasyLevel: () => {},
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => 'checked',
    clearInstallCalibration: () => {},
    getCalibratedTilt: () => null,
    getActiveTargetName: () => null,
    getEasyLevelStatus: () => null,
    getEasyLevelDeviceId: () => null,
    getEasyLevelLastSampleAt: () => null,
    getEasyLevelRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getSoundPrefs: () => ({ soundOnLevel: false, soundGuidance: false }),
    ...overrides,
  };
}

function classicSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'classic' };
}

// menu.ts is Classic-only now (screen-cleanup follow-up): Modern's gear
// icon uses settingsPage.ts directly and never constructs this component
// at all. See settingsPage.test.ts for the Modern tab-shortcut behavior
// this file used to cover, and infoMenu.test.ts / sensorPage.test.ts for
// Diagnostics/introduction/External sensor, all moved off this menu.
describe('menu — Classic ☰ drawer (screen-cleanup follow-up)', () => {
  it('renders a flat item list with General, Calibration, Vehicle, Ramps, Targets — Modern tab order', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('general');
    const items = [...menu.element.querySelectorAll('.menu__item')].map((i) => i.textContent);
    expect(items).toEqual([
      t('settings.general'),
      t('menu.calibration'),
      t('settings.tab.vehicle'),
      t('settings.tab.ramps'),
      t('menu.targets'),
    ]);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(0);
    expect(menu.element.querySelectorAll('.menu__row')).toHaveLength(0);
    // Diagnostics, the introduction relaunch, External sensor, Feedback
    // and About are no longer here at all — moved to infoMenu.ts /
    // sensorPage.ts, both reached directly from the bottom bar / top bar.
    for (const key of ['menu.intro', 'menu.sensorSource', 'menu.feedback', 'menu.about'] as const) {
      expect(menu.element.textContent).not.toContain(t(key));
    }
  });

  it('opens General straight from closed (depth 0 → 2)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    expect(menu.isOpen()).toBe(false);
    menu.open('general');
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
  });

  it('General/Vehicle/Ramps share one settingsForm instance, swapped per page — no tabs', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('general');
    const settingsForm = menu.element.querySelector('.menu-page__body form.settings__form');
    expect(settingsForm).toBeTruthy();
    expect(menu.element.querySelector('.settings__tabs')).toBeNull(); // Classic has no tabs
    expect(menu.element.querySelector('.menu-page__body')?.textContent).toContain(
      t('settings.language'),
    );

    menu.open('vehicle');
    expect(menu.element.querySelector('.menu-page__body form.settings__form')).toBeTruthy();
    expect(menu.element.querySelector('.menu-page__body')?.textContent).toContain(
      t('settings.vehicle'),
    );
    expect(menu.element.querySelector('.menu-page__body')?.textContent).not.toContain(
      t('settings.language'),
    );

    menu.open('ramps');
    expect(menu.element.querySelector('.menu-page__body form.settings__form')).toBeTruthy();
    expect(menu.element.querySelector('.menu-page__body')?.textContent).toContain(
      t('settings.ramp'),
    );
  });

  it('opens Calibration and Targets as their own standalone pages, not tabs', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('calibration');
    const calibrationBody = menu.element.querySelector('.menu-page__body');
    expect(calibrationBody?.querySelector('form.settings__form')).toBeNull();

    menu.open('targets');
    expect(menu.element.querySelector('.menu-page__body')?.textContent).toContain(
      t('targets.normal'),
    );
  });

  // Design review, follow-up: Save used to close the whole drawer back to
  // the main screen (#159) — reversed, since the user may still want to
  // change more right after saving. Only ✕/back actually close it now.
  it('Save persists from the Vehicle page but does not close the drawer', () => {
    const onSettingsSaved = vi.fn();
    const menu = createMenu(makeOptions({ initialSettings: classicSettings(), onSettingsSaved }));
    menu.open('vehicle');
    expect(menu.isOpen()).toBe(true);
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSettingsSaved).toHaveBeenCalledTimes(1);
    expect(menu.isOpen()).toBe(true);
  });

  it('Save from the Ramps page persists Vehicle fields edited earlier, not the stale snapshot (#108 follow-up)', () => {
    const onSettingsSaved = vi.fn();
    const menu = createMenu(makeOptions({ initialSettings: classicSettings(), onSettingsSaved }));
    menu.open('vehicle');
    const wheelbase = menu.element.querySelector<HTMLInputElement>('input[name="wheelbaseMm"]')!;
    wheelbase.value = '4200';
    wheelbase.dispatchEvent(new Event('input', { bubbles: true }));
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSettingsSaved.mock.calls[0]![0].wheelbaseMm).toBe(4200);

    // Reopening Ramps re-mounts the same shared form — saving from there
    // (without touching wheelbase again) must not clobber the value just
    // saved from Vehicle back to its pre-edit snapshot.
    menu.open('ramps');
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSettingsSaved.mock.calls[1]![0].wheelbaseMm).toBe(4200);
  });

  it('attach(): first click opens the drawer, second click closes it', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    const button = document.createElement('button');
    menu.attach(button);

    button.click();
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelectorAll('.menu__item').length).toBe(5);

    button.click();
    expect(menu.isOpen()).toBe(false);
  });
});

describe('Settings form resyncs sound fields on every reopen (#161)', () => {
  function soundCheckboxes(menu: ReturnType<typeof createMenu>): HTMLInputElement[] {
    return [...menu.element.querySelectorAll<HTMLInputElement>('.settings__checkbox')];
  }

  it('reflects a mute toggled outside the menu (bottom bar) the next time General opens', () => {
    let soundOnLevel = true;
    let soundGuidance = true;
    const menu = createMenu(
      makeOptions({
        initialSettings: classicSettings(),
        getSoundPrefs: () => ({ soundOnLevel, soundGuidance }),
      }),
    );
    menu.open('general');
    const [chime, guidance] = soundCheckboxes(menu);
    expect(chime!.checked).toBe(true);
    expect(guidance!.checked).toBe(true);

    // Simulate the bottom bar's mute toggle running while the menu is
    // closed — the host's getSoundPrefs() now answers differently.
    soundOnLevel = false;
    soundGuidance = false;
    menu.open('general');
    const [chimeAfter, guidanceAfter] = soundCheckboxes(menu);
    expect(chimeAfter!.checked).toBe(false);
    expect(guidanceAfter!.checked).toBe(false);
  });
});
