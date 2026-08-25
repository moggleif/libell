// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
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

function modernSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'modern' };
}

function classicSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'classic' };
}

describe('menu — Classic (unchanged by #107)', () => {
  it('renders a flat item list, no cards or "other" rows', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('settings');
    // Settings, Calibration, Targets, Diagnostics, Show introduction — Help/
    // About/Feedback are no longer drawer items at all (screen-cleanup
    // follow-up: they moved to the bottom bar's "?" button, attachHelp()).
    expect(menu.element.querySelectorAll('.menu__item').length).toBeGreaterThanOrEqual(5);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(0);
    expect(menu.element.querySelectorAll('.menu__row')).toHaveLength(0);
    expect(menu.element.textContent).not.toContain(t('menu.feedback'));
    expect(menu.element.textContent).not.toContain(t('menu.about'));
  });

  it('still opens Settings straight from closed (depth 0 → 2)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    expect(menu.isOpen()).toBe(false);
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
  });

  it('closes back to the main screen after a successful Save (#159)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(menu.isOpen()).toBe(false);
  });
});

describe('menu — Modern (#107)', () => {
  function cards(menu: ReturnType<typeof createMenu>) {
    return [...menu.element.querySelectorAll('.menu__card')];
  }

  it('renders exactly two primary cards — Help/About/Feedback moved to the bottom bar\'s "?" (screen-cleanup follow-up)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const titles = cards(menu).map((c) => c.querySelector('.menu__card-title')?.textContent);
    expect(titles).toEqual([t('menu.settings'), t('menu.calibration')]);
  });

  it('groups Targets under "ADVANCED" and just the introduction/diagnostics links under "OTHER" (#152, screen-cleanup follow-up)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const headings = [...menu.element.querySelectorAll('.menu__others-heading')];
    expect(headings.map((h) => h.textContent)).toEqual([t('menu.advanced'), t('menu.others')]);

    const [advancedHeading, othersHeading] = headings;
    const advancedList = advancedHeading!.nextElementSibling!;
    const othersList = othersHeading!.nextElementSibling!;
    const rowTitles = (list: Element) =>
      [...list.querySelectorAll('.menu__row-title')].map((r) => r.textContent);

    // No Web Bluetooth in this test environment, so External sensor is
    // never offered — Advanced holds only Targets, exactly as today.
    expect(rowTitles(advancedList)).toEqual([t('menu.targets')]);
    // Feedback and About no longer live in the drawer at all — they moved
    // into the combined Help page reached from "?" (attachHelp()).
    expect(rowTitles(othersList)).toEqual([t('menu.intro'), t('menu.diagnostics')]);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(2); // rows aren't cards
  });

  it('lights the Settings card dot and label while nothing has ever been saved', () => {
    const menu = createMenu(
      makeOptions({ initialSettings: modernSettings(), hasSavedSettings: () => false }),
    );
    menu.open('settings');
    const settingsCard = cards(menu)[0]!;
    expect(
      settingsCard.querySelector('.menu__card-dot')?.classList.contains('menu__card-dot--pending'),
    ).toBe(true);
    expect(settingsCard.querySelector('.menu__card-status')?.textContent).toBe(
      t('menu.card.notSaved'),
    );
  });

  it('clears the Settings card status once settings are saved', () => {
    const menu = createMenu(
      makeOptions({ initialSettings: modernSettings(), hasSavedSettings: () => true }),
    );
    menu.open('settings');
    const settingsCard = cards(menu)[0]!;
    expect(
      settingsCard.querySelector('.menu__card-dot')?.classList.contains('menu__card-dot--pending'),
    ).toBe(false);
    expect(settingsCard.querySelector('.menu__card-status')?.textContent).toBe('');
  });

  it('lights the Calibration card only while both the phone and vehicle zero are unset', () => {
    const notCalibrated = createMenu(makeOptions({ initialSettings: modernSettings() }));
    notCalibrated.open('settings');
    const calCard = cards(notCalibrated)[1]!;
    expect(calCard.querySelector('.menu__card-status')?.textContent).toBe(t('menu.card.notDone'));

    const calibrated = createMenu(
      makeOptions({
        initialSettings: modernSettings(),
        getCalibration: () => ({ rollDeg: 0, pitchDeg: 0 }),
      }),
    );
    calibrated.open('settings');
    const doneCard = cards(calibrated)[1]!;
    expect(doneCard.querySelector('.menu__card-status')?.textContent).toBe('');
  });

  it('re-evaluates card status each time the list is (re)shown', () => {
    let saved = false;
    const menu = createMenu(
      makeOptions({ initialSettings: modernSettings(), hasSavedSettings: () => saved }),
    );
    menu.open('settings');
    expect(cards(menu)[0]!.querySelector('.menu__card-status')?.textContent).toBe(
      t('menu.card.notSaved'),
    );
    saved = true;
    // Back to the list, then re-open a page — each is a fresh showDrawer/showPage.
    menu.open('calibration');
    expect(cards(menu)[0]!.querySelector('.menu__card-status')?.textContent).toBe('');
  });

  it('opening a page directly from closed still reaches depth 2 (menu list → page)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    expect(menu.isOpen()).toBe(false);
    menu.open('help');
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
  });

  it('the Calibration card is a shortcut into the same Settings instance, not a second render (#155)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const settingsForm = menu.element.querySelector('.menu-page__body form.settings__form');
    expect(settingsForm).toBeTruthy();

    menu.open('calibration');
    const calibrationForm = menu.element.querySelector('.menu-page__body form.settings__form');
    // Same live DOM node — not a second createCalibrationSection instance.
    expect(calibrationForm).toBe(settingsForm);
    expect(
      calibrationForm?.querySelector('[data-tab="calibration"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      calibrationForm?.querySelector('[data-tab="vehicle"]')?.getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('closes back to the main screen after a successful Save reached via ☰ → Settings (#159)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    // isOpen() reflects the app's own depth state synchronously; the
    // .menu-page element's `hidden` attribute itself only lands after the
    // hide transition (#105), so it isn't asserted here.
    expect(menu.isOpen()).toBe(false);
  });

  it('closes back to the main screen after Save reached via the Calibration shortcut too (#159)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('calibration');
    expect(menu.isOpen()).toBe(true);
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(menu.isOpen()).toBe(false);
  });

  it('closes back to the main screen when Save is tapped from the Ramps tab too (#159)', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    menu.element.querySelector<HTMLButtonElement>('[data-tab="ramps"]')!.click();
    menu.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(menu.isOpen()).toBe(false);
  });
});

describe('EasyLevel BLE sensor source (#116)', () => {
  const originalNavigator = globalThis.navigator;
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('never shows the "External sensor" page without Web Bluetooth (never a silent dead option)', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const menu = createMenu(makeOptions());
    menu.open('sensorSource');
    // No matching section was registered, so the page opens empty rather
    // than throwing — nothing here identifies the EasyLevel feature at all.
    expect(menu.element.textContent).not.toContain('EasyLevel');
  });

  it('shows a working "Connect EasyLevel sensor" entry when Web Bluetooth exists', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const connectEasyLevel = vi.fn(() => Promise.resolve<'granted'>('granted'));
    const menu = createMenu(makeOptions({ connectEasyLevel }));
    menu.open('sensorSource');
    expect(menu.element.textContent).toContain('EasyLevel');
    const button = [...menu.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('sensorSource.connect'),
    );
    expect(button).toBeDefined();
    button!.click();
    expect(connectEasyLevel).toHaveBeenCalledOnce();
  });

  it('External sensor appears first under ADVANCED, above Targets (#152)', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const advancedHeading = [...menu.element.querySelectorAll('.menu__others-heading')].find(
      (h) => h.textContent === t('menu.advanced'),
    )!;
    const advancedList = advancedHeading.nextElementSibling!;
    const rowTitles = [...advancedList.querySelectorAll('.menu__row-title')].map(
      (r) => r.textContent,
    );
    expect(rowTitles).toEqual([t('menu.sensorSource'), t('menu.targets')]);
  });
});

describe('attachHelp — "?" opens Help/About/Feedback directly (screen-cleanup follow-up)', () => {
  it('opens straight to a page combining Help, About and Feedback, not through the Settings drawer', () => {
    const menu = createMenu(makeOptions());
    const helpButton = document.createElement('button');
    menu.attachHelp(helpButton);
    expect(menu.isOpen()).toBe(false);

    helpButton.click();
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
    // Never landed on the Settings drawer first — .menu__card/.menu__item
    // never appear inside the visible page body.
    const pageBody = menu.element.querySelector('.menu-page__body')!;
    expect(pageBody.textContent).toContain(t('help.what.h'));
    expect(pageBody.textContent).toContain(t('menu.about'));
    expect(pageBody.textContent).toContain(t('menu.feedback'));
    expect(pageBody.querySelector('form')).not.toBeNull(); // the feedback form
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
        initialSettings: modernSettings(),
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
