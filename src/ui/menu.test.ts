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
    expect(menu.element.querySelectorAll('.menu__item').length).toBeGreaterThanOrEqual(6);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(0);
    expect(menu.element.querySelectorAll('.menu__row')).toHaveLength(0);
  });

  it('still opens Settings straight from closed (depth 0 → 2)', () => {
    const menu = createMenu(makeOptions({ initialSettings: classicSettings() }));
    expect(menu.isOpen()).toBe(false);
    menu.open('settings');
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.querySelector('.menu-page')?.hasAttribute('hidden')).toBe(false);
  });
});

describe('menu — Modern (#107)', () => {
  function cards(menu: ReturnType<typeof createMenu>) {
    return [...menu.element.querySelectorAll('.menu__card')];
  }

  it('renders exactly three primary cards, in the same order as Classic', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const titles = cards(menu).map((c) => c.querySelector('.menu__card-title')?.textContent);
    expect(titles).toEqual([t('menu.settings'), t('menu.calibration'), t('menu.help')]);
  });

  it('groups the introduction/feedback/about links under an "OTHER" heading as plain rows', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    expect(menu.element.querySelector('.menu__others-heading')?.textContent).toBe(t('menu.others'));
    const rows = [...menu.element.querySelectorAll('.menu__row')];
    expect(rows.map((r) => r.querySelector('.menu__row-title')?.textContent)).toEqual([
      t('menu.intro'),
      t('menu.targets'),
      t('menu.feedback'),
      t('menu.about'),
    ]);
    expect(menu.element.querySelectorAll('.menu__card')).toHaveLength(3); // rows aren't cards
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

  it('never shows a status label on the Help card', () => {
    const menu = createMenu(makeOptions({ initialSettings: modernSettings() }));
    menu.open('settings');
    const helpCard = cards(menu)[2]!;
    expect(helpCard.querySelector('.menu__card-status')?.textContent).toBe('');
    expect(
      helpCard.querySelector('.menu__card-dot')?.classList.contains('menu__card-dot--pending'),
    ).toBe(false);
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
});
