// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createInfoPage, type InfoPageOptions } from './infoMenu';
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

function makeOptions(openOnboarding = vi.fn()): InfoPageOptions {
  // MenuOptions is a superset of DiagnosticsOptions — reused as-is, same
  // pattern main.ts uses for its one shared options bag.
  return { diagnostics: makeMenuOptions(), openOnboarding };
}

describe('createInfoPage — "?" (screen-cleanup follow-up)', () => {
  it('starts closed, with the Help tab active', () => {
    const info = createInfoPage(makeOptions());
    expect(info.isOpen()).toBe(false);
    expect(info.element.hasAttribute('hidden')).toBe(true);
    const helpTab = info.element.querySelector<HTMLElement>('[data-tab="help"]');
    expect(helpTab?.getAttribute('aria-selected')).toBe('true');
  });

  it('opens on the first click of an attached button, closes on the second', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);

    button.click();
    expect(info.isOpen()).toBe(true);
    expect(info.element.hasAttribute('hidden')).toBe(false);

    button.click();
    expect(info.isOpen()).toBe(false);
  });

  it('the ✕ button closes the page', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);
    button.click();
    expect(info.isOpen()).toBe(true);

    info.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(info.isOpen()).toBe(false);
  });

  it('shows four tabs — Help, About, Feedback, Diagnostics, in that order (screen-cleanup follow-up)', () => {
    const info = createInfoPage(makeOptions());
    const tabs = [...info.element.querySelectorAll<HTMLElement>('.settings__tab')];
    expect(tabs.map((tab) => tab.dataset.tab)).toEqual([
      'help',
      'about',
      'feedback',
      'diagnostics',
    ]);
  });

  it('switching tabs shows the matching content and updates the header title', () => {
    const info = createInfoPage(makeOptions());
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

    const diagnosticsTab = info.element.querySelector<HTMLButtonElement>(
      '[data-tab="diagnostics"]',
    )!;
    diagnosticsTab.click();
    expect(info.element.querySelector('.menu-page__title')?.textContent).toBe(
      t('menu.diagnostics'),
    );
  });

  it('reopening always lands back on the Help tab, even after leaving on a different one', () => {
    const info = createInfoPage(makeOptions());
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

  // The introduction relaunch (screen-cleanup follow-up): used to be its
  // own row in the ☰ menu's "OTHER" list; now a button at the top of the
  // Help tab, closing this page first so the wizard isn't shown behind it.
  it('shows a "Show introduction" button at the top of the Help tab that closes this page and relaunches onboarding', () => {
    const openOnboarding = vi.fn();
    const info = createInfoPage(makeOptions(openOnboarding));
    const button = document.createElement('button');
    info.attach(button);
    button.click();

    // Help is always the first tab panel added.
    const helpPanel = info.element.querySelectorAll<HTMLElement>('.settings__tabpanel')[0]!;
    const introButton = [...info.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('menu.intro'),
    )!;
    expect(introButton).toBeDefined();
    // It's the first thing inside the Help panel, above the fact list.
    expect(helpPanel.firstElementChild).toBe(introButton);

    introButton.click();
    expect(info.isOpen()).toBe(false);
    expect(openOnboarding).toHaveBeenCalledOnce();
  });

  // The bug this component fixes (screen-cleanup follow-up): a prior
  // version reached Help/About/Feedback through the ☰ Settings menu's own
  // shared history depth, so its back button could pop through and reveal
  // the Settings drawer underneath. This component owns no history state
  // and holds no reference to `createMenu` at all — opening and closing it
  // must never affect an unrelated menu instance's own open/close state.
  it('never opens or affects an unrelated ☰ Settings menu instance', () => {
    const menu = createMenu(makeMenuOptions());
    const info = createInfoPage(makeOptions());
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
