// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSettingsPage } from './settingsPage';
import type { MenuOptions } from './menu';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

function modernSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'modern' };
}

function makeOptions(overrides: Partial<MenuOptions> = {}): MenuOptions {
  return {
    initialSettings: modernSettings(),
    appearance: 'modern',
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

// Modern only (screen-cleanup follow-up): the gear icon opens this page
// directly, no drawer/card-list step. Classic keeps using menu.ts's own
// drawer — see menu.test.ts.
describe('createSettingsPage — Modern gear icon (screen-cleanup follow-up)', () => {
  it('starts closed; attach() opens straight to the tabbed form, no drawer', () => {
    const page = createSettingsPage(makeOptions());
    const button = document.createElement('button');
    page.attach(button);
    expect(page.isOpen()).toBe(false);

    button.click();
    expect(page.isOpen()).toBe(true);
    expect(page.element.hasAttribute('hidden')).toBe(false);
    expect(page.element.querySelector('form.settings__form')).not.toBeNull();
    expect(page.element.querySelectorAll('.settings__tab')).toHaveLength(5);

    // Toggles fully closed on a second click.
    button.click();
    expect(page.isOpen()).toBe(false);
  });

  it('openCalibration() jumps to the Kalibrering tab of the same live form instance', () => {
    const page = createSettingsPage(makeOptions());
    page.openCalibration();
    expect(page.isOpen()).toBe(true);
    expect(
      page.element.querySelector('[data-tab="calibration"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(page.element.querySelector('[data-tab="vehicle"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('openTargets() jumps to the Targets tab of the same live form instance', () => {
    const page = createSettingsPage(makeOptions());
    page.openTargets();
    expect(page.isOpen()).toBe(true);
    expect(page.element.querySelector('[data-tab="targets"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(page.element.textContent).toContain(t('targets.normal'));
  });

  it('open() opens on whichever tab was last active, without forcing a change', () => {
    const page = createSettingsPage(makeOptions());
    page.openCalibration();
    page.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    page.open();
    expect(
      page.element.querySelector('[data-tab="calibration"]')?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  // Design review, follow-up: Save used to close the page back to the main
  // screen (#159) — reversed, since the user may want to change more
  // right after saving. Only the ✕ actually closes it now.
  it('Save persists but does not close the page — only the ✕ does', () => {
    const onSettingsSaved = vi.fn();
    const page = createSettingsPage(makeOptions({ onSettingsSaved }));
    page.open();
    page.element.querySelector<HTMLButtonElement>('[data-tab="ramps"]')!.click();
    page.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSettingsSaved).toHaveBeenCalledTimes(1);
    expect(page.isOpen()).toBe(true);

    page.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(page.isOpen()).toBe(false);
  });

  it('resyncs the sound checkboxes every time it (re)opens (#161)', () => {
    let soundOnLevel = true;
    let soundGuidance = true;
    const page = createSettingsPage(
      makeOptions({ getSoundPrefs: () => ({ soundOnLevel, soundGuidance }) }),
    );
    page.open();
    const checkboxes = () => [
      ...page.element.querySelectorAll<HTMLInputElement>('.settings__checkbox'),
    ];
    expect(checkboxes()[0]!.checked).toBe(true);

    soundOnLevel = false;
    soundGuidance = false;
    page.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    page.open();
    expect(checkboxes()[0]!.checked).toBe(false);
  });
});
