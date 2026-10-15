// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { createCore, type Screen } from './core';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { MenuOptionsDeps } from './menuOptions';
import type { OnboardingLauncherDeps } from './onboardingLauncher';
import type { mountSensorPages } from './sensorPages';

type BoxPageOptionsFor = Parameters<typeof mountSensorPages>[0];

// Pass-through spies: the real modules run, the test only keeps the deps
// mountPages hands them, to drive a save the way the pages do.
const captured = vi.hoisted(() => ({
  menu: null as unknown as MenuOptionsDeps,
  wizard: null as unknown as OnboardingLauncherDeps,
  share: vi.fn(),
  boxPage: null as unknown as BoxPageOptionsFor,
}));
vi.mock('./sensorPages', async (original) => {
  const real = await original<typeof import('./sensorPages')>();
  return {
    ...real,
    mountSensorPages(optionsFor: typeof captured.boxPage) {
      captured.boxPage = optionsFor;
      return real.mountSensorPages(optionsFor);
    },
  };
});
vi.mock('./menuOptions', async (original) => {
  const real = await original<typeof import('./menuOptions')>();
  return {
    ...real,
    buildMenuOptions(deps: MenuOptionsDeps) {
      captured.menu = deps;
      return real.buildMenuOptions(deps);
    },
  };
});
vi.mock('./onboardingLauncher', async (original) => {
  const real = await original<typeof import('./onboardingLauncher')>();
  return {
    ...real,
    createOnboardingLauncher(deps: OnboardingLauncherDeps) {
      captured.wizard = deps;
      return real.createOnboardingLauncher(deps);
    },
  };
});
vi.mock('../ui/vehicleShare', () => ({ shareVehicleSetup: captured.share }));

const { mountPages } = await import('./pages');

function fakeScreen(): Screen {
  const refreshable = () => ({ refresh: vi.fn() });
  return {
    lamps: refreshable(),
    choiceBadges: refreshable(),
    sensorStatus: refreshable(),
    levelScreen: { show: vi.fn(), rebuildIfChanged: vi.fn() },
  } as unknown as Screen;
}

function button(id: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.id = id;
  document.body.append(element);
  return element;
}

describe('mountPages', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/?demo');
    document.body.replaceChildren();
  });

  it('hands the settings surface and the navigation to the screen', () => {
    button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(screen.settingsSurface).toBe(pages.settingsSurface);
    expect(screen.navigation).toBe(pages.navigation);
  });

  it('mounts the "?" page behind the help button', () => {
    const help = button('help-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(document.body.contains(pages.infoPage.element)).toBe(true);
    expect(pages.infoPage.isOpen()).toBe(false);
    help.click();
    expect(pages.infoPage.isOpen()).toBe(true);
  });

  it('mounts the "?" page even without a help button', () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(document.body.contains(pages.infoPage.element)).toBe(true);
  });

  it('starts with every page closed', () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(pages.onboarding.isOpen()).toBe(false);
    expect(pages.settingsSurface.isOpen()).toBe(false);
  });

  it('opens settings from the gear', () => {
    const gear = button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    gear.click();
    expect(pages.settingsSurface.isOpen()).toBe(true);
  });

  describe('a settings save (#513)', () => {
    const saved = { ...DEFAULT_SETTINGS, wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm + 500 };

    function mounted() {
      const screen = fakeScreen();
      const core = createCore(screen);
      mountPages(core, screen);
      return { screen, core };
    }

    it('from the wizard adopts it and refreshes the lamps and the level screen', () => {
      const { screen, core } = mounted();
      captured.wizard.onSettingsSaved(saved);
      expect(core.settings.get().wheelbaseMm).toBe(saved.wheelbaseMm);
      expect(screen.lamps.refresh).toHaveBeenCalledOnce();
      expect(screen.levelScreen.rebuildIfChanged).toHaveBeenCalledOnce();
    });

    it('from the settings page adopts it and refreshes the lamps and the level screen', () => {
      const { screen, core } = mounted();
      captured.menu.onSettingsSaved(saved);
      expect(core.settings.get().wheelbaseMm).toBe(saved.wheelbaseMm);
      expect(screen.lamps.refresh).toHaveBeenCalledOnce();
      expect(screen.levelScreen.rebuildIfChanged).toHaveBeenCalledOnce();
    });
  });

  it('opens the active sensor page from the settings', () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen);
    const open = vi.spyOn(screen.navigation, 'openActiveSensorPage').mockImplementation(() => {});
    captured.menu.openBoxPage();
    expect(open).toHaveBeenCalledOnce();
  });

  it('shares only the vehicle geometry of the current settings', () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen);
    captured.menu.shareVehicleSetup({ ...DEFAULT_SETTINGS, wheelbaseMm: 4200 });
    expect(captured.share).toHaveBeenCalledOnce();
    const [geometry] = captured.share.mock.lastCall ?? [];
    expect(geometry).toMatchObject({ wheelbaseMm: 4200 });
    expect(geometry).not.toHaveProperty('sensorSource');
  });

  it('lets the wizard refresh the lamps and read the active source', () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen);
    captured.wizard.refreshLamps();
    expect(screen.lamps.refresh).toHaveBeenCalledOnce();
    expect(captured.wizard.activeSource()).toBe('phone');
  });

  it("builds a box's options for its page and for the wizard's box step", () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen);
    const page = captured.boxPage(EASYLEVEL_DESCRIPTOR);
    const wizard = captured.wizard.sensorOptionsFor?.(EASYLEVEL_DESCRIPTOR);
    expect(page).toMatchObject({ sensor: EASYLEVEL_DESCRIPTOR });
    expect(page).toHaveProperty('connectSensor');
    expect(wizard).toMatchObject({ sensor: EASYLEVEL_DESCRIPTOR });
    expect(wizard).toHaveProperty('connectSensor');
  });

  it('opens the calibration settings while the phone is in use and no box is pending', () => {
    button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    pages.navigation.openCalibration();
    expect(pages.settingsSurface.isOpen()).toBe(true);
  });
});
