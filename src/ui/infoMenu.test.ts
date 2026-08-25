// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createInfoPage } from './infoMenu';
import { createMenu, type MenuOptions } from './menu';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS } from '../domain/settings';

setLanguage('en');

function makeMenuOptions(): MenuOptions {
  return {
    initialSettings: DEFAULT_SETTINGS,
    appearance: DEFAULT_SETTINGS.appearance,
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
  };
}

describe('createInfoPage — "?" (screen-cleanup follow-up)', () => {
  it('starts closed, with the Help tab active', () => {
    const info = createInfoPage();
    expect(info.isOpen()).toBe(false);
    expect(info.element.hasAttribute('hidden')).toBe(true);
    const helpTab = info.element.querySelector<HTMLElement>('[data-tab="help"]');
    expect(helpTab?.getAttribute('aria-selected')).toBe('true');
  });

  it('opens on the first click of an attached button, closes on the second', () => {
    const info = createInfoPage();
    const button = document.createElement('button');
    info.attach(button);

    button.click();
    expect(info.isOpen()).toBe(true);
    expect(info.element.hasAttribute('hidden')).toBe(false);

    button.click();
    expect(info.isOpen()).toBe(false);
  });

  it('the ✕ button closes the page', () => {
    const info = createInfoPage();
    const button = document.createElement('button');
    info.attach(button);
    button.click();
    expect(info.isOpen()).toBe(true);

    info.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(info.isOpen()).toBe(false);
  });

  it('switching tabs shows the matching content and updates the header title', () => {
    const info = createInfoPage();
    const button = document.createElement('button');
    info.attach(button);
    button.click();

    const aboutTab = info.element.querySelector<HTMLButtonElement>('[data-tab="about"]')!;
    aboutTab.click();
    expect(aboutTab.getAttribute('aria-selected')).toBe('true');
    expect(info.element.querySelector('[data-tab="help"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(info.element.querySelector('.menu-page__title')?.textContent).toBe(t('menu.about'));
    expect(info.element.textContent).toContain(t('about.text'));

    const feedbackTab = info.element.querySelector<HTMLButtonElement>('[data-tab="feedback"]')!;
    feedbackTab.click();
    expect(info.element.querySelector('.menu-page__title')?.textContent).toBe(t('menu.feedback'));
    expect(info.element.querySelector('form')).not.toBeNull();
  });

  it('reopening always lands back on the Help tab, even after leaving on a different one', () => {
    const info = createInfoPage();
    const button = document.createElement('button');
    info.attach(button);
    button.click();
    info.element.querySelector<HTMLButtonElement>('[data-tab="about"]')!.click();
    button.click(); // close
    button.click(); // reopen
    expect(info.element.querySelector('[data-tab="help"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  // The bug this component fixes (screen-cleanup follow-up): a prior
  // version reached Help/About/Feedback through the ☰ Settings menu's own
  // shared history depth, so its back button could pop through and reveal
  // the Settings drawer underneath. This component owns no history state
  // and holds no reference to `createMenu` at all — opening and closing it
  // must never affect an unrelated menu instance's own open/close state.
  it('never opens or affects an unrelated ☰ Settings menu instance', () => {
    const menu = createMenu(makeMenuOptions());
    const info = createInfoPage();
    const helpButton = document.createElement('button');
    info.attach(helpButton);

    expect(menu.isOpen()).toBe(false);
    helpButton.click();
    expect(info.isOpen()).toBe(true);
    expect(menu.isOpen()).toBe(false);

    info.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(info.isOpen()).toBe(false);
    expect(menu.isOpen()).toBe(false);
  });
});
