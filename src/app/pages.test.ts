// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { createCore, type Screen } from './core';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { MenuOptionsDeps } from './menuOptions';
import type { InstallOffer } from '../ui/install';
import type { OnboardingLauncherDeps } from './onboardingLauncher';
import type { mountSensorPages } from './sensorPages';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import { calibratedTilt } from './tiltReading';

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

const noInstall: InstallOffer = { kind: () => null, install: () => null, onChange: () => {} };

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
    const pages = mountPages(createCore(screen), screen, noInstall);
    expect(screen.settingsSurface).toBe(pages.settingsSurface);
    expect(screen.navigation).toBe(pages.navigation);
  });

  it('mounts the "?" page behind the help button once it has loaded', async () => {
    const help = button('help-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    const infoPage = await pages.infoPage.load();
    expect(document.body.contains(infoPage!.element)).toBe(true);
    expect(pages.infoPage.isOpen()).toBe(false);
    help.click();
    expect(pages.infoPage.isOpen()).toBe(true);
  });

  it('opens the "?" page on a tap before it has loaded (#708)', async () => {
    const help = button('help-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    help.click();
    await vi.waitFor(() => expect(pages.infoPage.isOpen()).toBe(true));
  });

  it('mounts the "?" page even without a help button', async () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    const infoPage = await pages.infoPage.load();
    expect(document.body.contains(infoPage!.element)).toBe(true);
  });

  it('shows the wizard once its module has loaded, paused from the first moment (#708)', async () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    pages.onboarding.open();
    expect(pages.onboarding.isOpen()).toBe(true);
    await vi.waitFor(() => expect(document.querySelector('.onboarding')).not.toBeNull());
  });

  it('shows the first-visit intro once its module has loaded (#708)', async () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    pages.onboarding.openFirstRun();
    expect(pages.onboarding.isOpen()).toBe(true);
    await vi.waitFor(() => expect(document.querySelector('.intro')).not.toBeNull());
  });

  it('starts with every page closed', () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    expect(pages.onboarding.isOpen()).toBe(false);
    expect(pages.settingsSurface.isOpen()).toBe(false);
  });

  it('opens settings from the gear', async () => {
    const gear = button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    gear.click();
    await vi.waitFor(() => expect(pages.settingsSurface.isOpen()).toBe(true));
  });

  describe('a settings save (#513)', () => {
    const saved = { ...DEFAULT_SETTINGS, wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm + 500 };

    function mounted() {
      const screen = fakeScreen();
      const core = createCore(screen);
      mountPages(core, screen, noInstall);
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
    mountPages(createCore(screen), screen, noInstall);
    const open = vi.spyOn(screen.navigation, 'openActiveSensorPage').mockImplementation(() => {});
    captured.menu.openBoxPage();
    expect(open).toHaveBeenCalledOnce();
  });

  it('shares only the vehicle geometry of the current settings', () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen, noInstall);
    captured.menu.shareVehicleSetup({ ...DEFAULT_SETTINGS, wheelbaseMm: 4200 });
    expect(captured.share).toHaveBeenCalledOnce();
    const [geometry] = captured.share.mock.lastCall ?? [];
    expect(geometry).toMatchObject({ wheelbaseMm: 4200 });
    expect(geometry).not.toHaveProperty('sensorSource');
  });

  it('lets the wizard refresh the lamps and read the active source', () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen, noInstall);
    captured.wizard.refreshLamps();
    expect(screen.lamps.refresh).toHaveBeenCalledOnce();
    expect(captured.wizard.activeSource()).toBe('phone');
  });

  it("builds a box's options for its page and for the wizard's box step", () => {
    const screen = fakeScreen();
    mountPages(createCore(screen), screen, noInstall);
    const page = captured.boxPage(EASYLEVEL_DESCRIPTOR);
    const wizard = captured.wizard.sensorOptionsFor?.(EASYLEVEL_DESCRIPTOR);
    expect(page).toMatchObject({ sensor: EASYLEVEL_DESCRIPTOR });
    expect(page).toHaveProperty('connectSensor');
    expect(wizard).toMatchObject({ sensor: EASYLEVEL_DESCRIPTOR });
    expect(wizard).toHaveProperty('connectSensor');
  });

  it('opens the calibration settings while the phone is in use and no box is pending', async () => {
    button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen, noInstall);
    pages.navigation.openCalibration();
    await vi.waitFor(() => expect(pages.settingsSurface.isOpen()).toBe(true));
  });

  // #734: what a box's own page and the wizard's box step are handed,
  // pinned before the options stop being built from the menu's bag.
  describe("a box's options (#734)", () => {
    function boxOptions() {
      const screen = fakeScreen();
      const core = createCore(screen);
      mountPages(core, screen, noInstall);
      return {
        core,
        page: (descriptor = EASYLEVEL_DESCRIPTOR) => captured.boxPage(descriptor),
        wizard: (descriptor = EASYLEVEL_DESCRIPTOR) =>
          captured.wizard.sensorOptionsFor!(descriptor),
      };
    }

    for (const descriptor of [EASYLEVEL_DESCRIPTOR, XPARKLE_DESCRIPTOR]) {
      it(`give ${descriptor.id}'s page and wizard step that box and the active source`, () => {
        const { core, page, wizard } = boxOptions();
        for (const options of [page(descriptor), wizard(descriptor)]) {
          expect(options.sensor).toBe(descriptor);
          expect(options.getSensorSource()).toBe('phone');
          expect(options.getSensorState()).toBe(core.sensor().getState());
          expect(options.getInstallCalibration()).toBeNull();
          expect(options.getInstallCalibrationCapturedAt()).toBeNull();
          expect(options.installZeroTrim?.hasZero()).toBe(false);
          expect(typeof options.connectSensor).toBe('function');
          expect(typeof options.disconnectSensor).toBe('function');
          expect(typeof options.calibrateInstall).toBe('function');
          expect(typeof options.clearInstallCalibration).toBe('function');
        }
      });

      it(`give ${descriptor.id}'s page its own live status, none before it exists`, () => {
        const { page } = boxOptions();
        const options = page(descriptor);
        expect(options.getHealth()).toBeNull();
        expect(options.getDeviceId()).toBeNull();
        expect(options.getLastSampleAt()).toBeNull();
        expect(options.getRawAccel()).toBeNull();
        expect(options.getEasyLevelStatusBytes()).toBeNull();
        expect(options.getXparkleVersionBytes()).toBeNull();
      });
    }

    it('give only the Xparkle a password, and both boxes a mounting guide', () => {
      const { page, wizard } = boxOptions();
      for (const options of [page(XPARKLE_DESCRIPTOR), wizard(XPARKLE_DESCRIPTOR)]) {
        expect(options.password).toBeDefined();
        expect(options.learnMounting).toBeDefined();
      }
      for (const options of [page(), wizard()]) {
        expect(options.password).toBeUndefined();
        expect(options.learnMounting).toBeDefined();
      }
    });

    it("read the vehicle type, the EasyLevel mounting and the live tilt from the app's state", () => {
      const { core, page, wizard } = boxOptions();
      core.settings.adopt({ ...core.settings.get(), vehicleType: 'caravan' });
      const tilt = calibratedTilt(core.sensor(), core.effectiveCalibration());
      for (const options of [page(XPARKLE_DESCRIPTOR), wizard(XPARKLE_DESCRIPTOR)]) {
        expect(options.getVehicleType?.()).toBe('caravan');
        expect(options.getMounting()).toBe(easyLevelSettings(core.settings.get()).mounting);
        expect(options.getCalibratedTilt?.()).toEqual(tilt);
      }
    });

    it('store a mounting picked on either', () => {
      const { core, page, wizard } = boxOptions();
      const current = easyLevelSettings(core.settings.get()).mounting;
      const other = current === 'standard' ? 'rotated90' : 'standard';
      page().setMounting(other);
      expect(easyLevelSettings(core.settings.get()).mounting).toBe(other);
      wizard().setMounting(current);
      expect(easyLevelSettings(core.settings.get()).mounting).toBe(current);
    });

    it("read and store EasyLevel's connect delay from any box's page", () => {
      const { core, page } = boxOptions();
      page(XPARKLE_DESCRIPTOR).setEasyLevelConnectDelay(true, 1500);
      const stored = easyLevelSettings(core.settings.get());
      expect(stored.connectDelayEnabled).toBe(true);
      expect(page().getEasyLevelConnectDelay()).toEqual({
        enabled: true,
        ms: stored.connectDelayMs,
      });
    });

    it("leave the live status off the wizard's box step", () => {
      const { wizard } = boxOptions();
      expect(wizard()).not.toHaveProperty('getDeviceId');
      expect(wizard()).not.toHaveProperty('getLastSampleAt');
    });
  });
});
