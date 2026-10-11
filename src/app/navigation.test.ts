import { describe, expect, it, vi } from 'vitest';
import type { SensorSource } from '../domain/settings';
import { createNavigation, type NavigationDeps } from './navigation';

function setup(
  options: {
    appearance?: 'modern' | 'classic';
    source?: SensorSource;
    pending?: boolean;
    boxPages?: boolean;
    sensorPage?: boolean;
  } = {},
) {
  const { appearance = 'modern', source = 'phone', pending = false } = options;
  const calls: string[] = [];
  const settingsPage = {
    open: vi.fn(() => void calls.push('settings')),
    openTab: vi.fn((tab: string) => void calls.push(`settings:${tab}`)),
    openTargets: vi.fn(() => void calls.push('settings:targets-badge')),
  };
  const menu = { open: vi.fn((section: string) => void calls.push(`menu:${section}`)) };
  const deps: NavigationDeps = {
    settings: appearance === 'modern' ? { settingsPage } : { menu },
    externalSensorPage:
      options.boxPages === false
        ? null
        : { openSource: (s: SensorSource) => void calls.push(`box:${s}`) },
    sensorPage: options.sensorPage === false ? null : { open: () => void calls.push('list') },
    activeSource: () => source,
    isBoxPending: () => pending,
  };
  return { navigation: createNavigation(deps), calls };
}

describe('createNavigation', () => {
  describe('openSettingsSection', () => {
    it('opens the tab in Modern and the section in Classic', () => {
      const modern = setup();
      modern.navigation.openSettingsSection('ramps');
      const classic = setup({ appearance: 'classic' });
      classic.navigation.openSettingsSection('ramps');
      expect(modern.calls).toEqual(['settings:ramps']);
      expect(classic.calls).toEqual(['menu:ramps']);
    });
  });

  describe('openCalibration', () => {
    it("opens the phone's calibration settings while the phone is in use", () => {
      const { navigation, calls } = setup();
      navigation.openCalibration();
      expect(calls).toEqual(['settings:calibration']);
    });

    it("opens the box's own page while a box is in use", () => {
      const { navigation, calls } = setup({ source: 'xparkle', pending: true });
      navigation.openCalibration();
      expect(calls).toEqual(['box:xparkle']);
    });

    it('opens the box list while a box chosen in the wizard is not connected', () => {
      const { navigation, calls } = setup({ pending: true });
      navigation.openCalibration();
      expect(calls).toEqual(['list']);
    });

    it('falls back to the settings without box pages or a list', () => {
      const box = setup({ source: 'easylevel', boxPages: false });
      box.navigation.openCalibration();
      const pending = setup({ pending: true, sensorPage: false, appearance: 'classic' });
      pending.navigation.openCalibration();
      expect(box.calls).toEqual(['settings:calibration']);
      expect(pending.calls).toEqual(['menu:calibration']);
    });
  });

  describe('openSensor', () => {
    it("opens the active box's page, else the list", () => {
      const box = setup({ source: 'easylevel' });
      box.navigation.openSensor();
      const phone = setup({ pending: true });
      phone.navigation.openSensor();
      expect(box.calls).toEqual(['box:easylevel']);
      expect(phone.calls).toEqual(['list']);
    });

    it('does nothing without any sensor page', () => {
      const { navigation, calls } = setup({ boxPages: false, sensorPage: false });
      navigation.openSensor();
      expect(calls).toEqual([]);
    });

    it('opens the list when a box is active but there are no box pages', () => {
      const { navigation, calls } = setup({ source: 'xparkle', boxPages: false });
      navigation.openSensor();
      expect(calls).toEqual(['list']);
    });
  });

  describe('openActiveSensorPage', () => {
    it("opens the active box's page and nothing for the phone", () => {
      const box = setup({ source: 'xparkle' });
      box.navigation.openActiveSensorPage();
      const phone = setup();
      phone.navigation.openActiveSensorPage();
      expect(box.calls).toEqual(['box:xparkle']);
      expect(phone.calls).toEqual([]);
    });
  });

  describe('openLamp', () => {
    it('routes the calibration lamp as calibration', () => {
      const { navigation, calls } = setup({ pending: true });
      navigation.openLamp('calibration');
      expect(calls).toEqual(['list']);
    });

    it('opens Settings on its last tab in Modern, the section in Classic', () => {
      const modern = setup();
      modern.navigation.openLamp('vehicle');
      const classic = setup({ appearance: 'classic' });
      classic.navigation.openLamp('vehicle');
      expect(modern.calls).toEqual(['settings']);
      expect(classic.calls).toEqual(['menu:vehicle']);
    });
  });

  describe('openTargets', () => {
    it("opens Modern's targets shortcut and Classic's targets section", () => {
      const modern = setup();
      modern.navigation.openTargets();
      const classic = setup({ appearance: 'classic' });
      classic.navigation.openTargets();
      expect(modern.calls).toEqual(['settings:targets-badge']);
      expect(classic.calls).toEqual(['menu:targets']);
    });
  });

  describe('openHelpTarget', () => {
    it('routes the sensor and calibration as their own, and the rest as sections', () => {
      const { navigation, calls } = setup({ source: 'xparkle' });
      navigation.openHelpTarget('sensor');
      navigation.openHelpTarget('calibration');
      navigation.openHelpTarget('vehicle');
      navigation.openHelpTarget('targets');
      expect(calls).toEqual(['box:xparkle', 'box:xparkle', 'settings:vehicle', 'settings:targets']);
    });
  });
});
