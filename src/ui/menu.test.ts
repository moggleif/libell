// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
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
    getLastSampleAt: () => null,
    getRawTilt: () => null,
    getCalibratedTilt: () => null,
    getActiveTargetName: () => null,
    getEasyLevelStatus: () => null,
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
  it('renders a flat item list with exactly Settings, Calibration, Targets', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('settings');
    const items = [...menu.element.querySelectorAll('.menu__item')].map((i) => i.textContent);
    expect(items).toEqual([t('menu.settings'), t('menu.calibration'), t('menu.targets')]);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(0);
    expect(menu.element.querySelectorAll('.menu__row')).toHaveLength(0);
    // Diagnostics, the introduction relaunch, External sensor, Feedback
    // and About are no longer here at all — moved to infoMenu.ts /
    // sensorPage.ts, both reached directly from the bottom bar / top bar.
    for (const key of [
      'menu.diagnostics',
      'menu.intro',
      'menu.sensorSource',
      'menu.feedback',
      'menu.about',
    ] as const) {
      expect(menu.element.textContent).not.toContain(t(key));
    }
  });

  it('opens Settings straight from closed (depth 0 → 2)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    expect(menu.isOpen()).toBe(false);
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
  });

  it('opens Calibration and Targets as their own standalone pages, not tabs', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('settings');
    const settingsForm = menu.element.querySelector('.menu-page__body form.settings__form');
    expect(settingsForm).toBeTruthy();
    expect(menu.element.querySelector('.settings__tabs')).toBeNull(); // Classic has no tabs

    menu.open('calibration');
    const calibrationBody = menu.element.querySelector('.menu-page__body');
    expect(calibrationBody?.querySelector('form.settings__form')).toBeNull();

    menu.open('targets');
    expect(menu.element.querySelector('.menu-page__body')?.textContent).toContain(
      t('targets.normal'),
    );
  });

  it('closes back to the main screen after a successful Save (#159)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(menu.isOpen()).toBe(false);
  });

  it('attach(): first click opens the drawer, second click closes it', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    const button = document.createElement('button');
    menu.attach(button);

    button.click();
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelectorAll('.menu__item').length).toBe(3);

    button.click();
    expect(menu.isOpen()).toBe(false);
  });
});

describe('Settings form resyncs sound fields on every reopen (#161)', () => {
  function soundCheckboxes(menu: ReturnType<typeof createMenu>): HTMLInputElement[] {
    return [...menu.element.querySelectorAll<HTMLInputElement>('.settings__checkbox')];
  }

  it('reflects a mute toggled outside the menu (bottom bar) the next time Settings opens', () => {
    let soundOnLevel = true;
    let soundGuidance = true;
    const menu = createMenu(
      makeOptions({
        initialSettings: classicSettings(),
        getSoundPrefs: () => ({ soundOnLevel, soundGuidance }),
      }),
    );
    menu.open('settings');
    const [chime, guidance] = soundCheckboxes(menu);
    expect(chime!.checked).toBe(true);
    expect(guidance!.checked).toBe(true);

    // Simulate the bottom bar's mute toggle running while the menu is
    // closed — the host's getSoundPrefs() now answers differently.
    soundOnLevel = false;
    soundGuidance = false;
    menu.open('settings');
    const [chimeAfter, guidanceAfter] = soundCheckboxes(menu);
    expect(chimeAfter!.checked).toBe(false);
    expect(guidanceAfter!.checked).toBe(false);
  });
});
