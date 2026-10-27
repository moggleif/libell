// @vitest-environment happy-dom
//
// Pins (#735) of the Settings page, the ☰ menu's pages and the "?" page,
// written before their hand-built buttons and text elements are built with
// button(), textElement() and paragraph() from dom.ts, so the move cannot
// change any of it: every element, attribute, text and child order is
// compared with the stored snapshot.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import type { CalibrationOptions } from './calibrationSection';
import { describeDom } from './domPin.testing';
import { setLanguage } from './i18n';
import { createInfoPage } from './infoMenu';
import { createMenu, type MenuSection } from './menu';
import { createSettingsPage } from './settingsPage';
import type { SettingsOptions } from './settingsOptions';
import type { TargetsOptions } from './targetsSection';

setLanguage('en');

afterEach(() => {
  document.body.replaceChildren();
});

const calibration: CalibrationOptions = {
  appearance: 'modern',
  getCalibration: () => ({ rollDeg: 0.5, pitchDeg: -0.25 }),
  calibrate: () => null,
  readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
  applyCalibration: () => () => {},
  clearCalibration: () => {},
  getVehicleCalibration: () => null,
  calibrateVehicle: () => null,
  clearVehicleCalibration: () => {},
  getCalibrationCapturedAt: () => null,
  getVehicleCalibrationCapturedAt: () => null,
  checkCalibration: () => 'checked',
  checkVehicleCalibration: () => 'checked',
};

const targets: TargetsOptions = {
  getTargetPresets: () => [
    { id: 'drain', name: 'Shower drain', offset: { rollDeg: 1, pitchDeg: 0 } },
  ],
  getActiveTargetId: () => 'drain',
  selectTarget: () => {},
  addTargetPreset: () => null,
  deleteTargetPreset: () => {},
  renameTargetPreset: () => {},
  hitch: {
    isCaravan: () => true,
    savedPitch: () => 1.5,
    save: () => null,
    isActive: () => false,
    start: () => {},
    stop: () => {},
  },
};

function options(settings: LevelSettings): SettingsOptions {
  return {
    initialSettings: settings,
    onSettingsSaved: () => {},
    getSoundPrefs: () => ({ soundOnLevel: true, soundGuidance: false, soundSpeech: false }),
    onShareVehicleSetup: () => {},
    calibration: { ...calibration, appearance: settings.appearance },
    targets,
    vehicles: {
      list: () => [
        { id: 'a', name: '' },
        { id: 'b', name: 'Caravan' },
      ],
      activeId: () => 'b',
      switchTo: () => {},
      add: () => {},
      rename: () => {},
      remove: () => true,
    },
  };
}

const CARAVAN: LevelSettings = { ...DEFAULT_SETTINGS, vehicleType: 'caravan' };

describe('the Settings page (#735)', () => {
  it('draws the same DOM', () => {
    const page = createSettingsPage(options({ ...CARAVAN, appearance: 'modern' }));
    page.open();
    expect(describeDom(page.element)).toMatchSnapshot();
  });
});

describe('the ☰ menu (#735)', () => {
  const sections: MenuSection[] = ['vehicle', 'ramps', 'calibration', 'targets', 'general'];
  it.each(sections)('draws the same DOM on its %s page', (section) => {
    const menu = createMenu(options({ ...CARAVAN, appearance: 'classic' }));
    menu.open(section);
    expect(describeDom(menu.element)).toMatchSnapshot();
  });
});

describe('the "?" page (#735)', () => {
  it('draws the same DOM', () => {
    const info = createInfoPage({
      openOnboarding: () => {},
      hasDoneOnboarding: () => true,
      openTarget: () => {},
      storedData: {
        read: () => [],
        deleteAll: () => {},
        counting: { isOn: () => true, setOn: () => {} },
      },
    });
    info.open();
    // About's version line depends on the build (a CI build has none);
    // about.test.ts pins it.
    const dom = describeDom(info.element).replace(/\n *p class="menu__text about__version".*/, '');
    expect(dom).toMatchSnapshot();
  });
});
