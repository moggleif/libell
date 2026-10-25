/**
 * The pages over the main screen: the first-run wizard, settings, the
 * sensor pages, the "?" page, and the navigation between them.
 */
import { deleteAllStoredData, readStoredData } from '../data/storedData';
import { pickVehicleGeometry } from '../domain/vehicleShare';
import {
  hasDoneOnboarding,
  hasStoredMeasurements,
  markOnboardingDone,
  markOnboardingSeen,
} from '../data/settingsStore';
import { createInfoPage, type InfoPage } from '../ui/infoMenu';
import type { InstallOffer } from '../ui/install';
import { showIntro } from '../ui/intro';
import { showOnboarding } from '../ui/onboarding';
import { shareVehicleSetup } from '../ui/vehicleShare';
import { applyLook, type Core, type Screen } from './core';
import { boxPageOptions, buildMenuOptions, wizardBoxOptions } from './menuOptions';
import { createNavigation, type Navigation } from './navigation';
import { createOnboardingLauncher, type OnboardingLauncher } from './onboardingLauncher';
import { mountSensorPages, type SensorPages } from './sensorPages';
import { createSettingsAdoption } from './settingsAdoption';
import { mountSettingsSurface, type SettingsSurface } from './settingsSurface';

export interface Pages {
  onboarding: OnboardingLauncher;
  settingsSurface: SettingsSurface;
  sensorPages: SensorPages;
  infoPage: InfoPage;
  navigation: Navigation;
}

export function mountPages(core: Core, screen: Screen, install: InstallOffer): Pages {
  const { settings, optionDeps } = core;
  const adoption = createAdoption(core, screen);
  const onboarding = createOnboardingLauncher({
    show: showOnboarding,
    showIntro,
    install,
    settings: settings.get,
    onSettingsSaved: adoption.fromWizard,
    parts: optionDeps,
    sensorOptionsFor: (descriptor) => wizardBoxOptions(menuOptions, descriptor, optionDeps),
    progress: { markSeen: markOnboardingSeen, markDone: markOnboardingDone },
    boxPending: core.boxPending,
    activeSource: () => core.sensor().getSource(),
    refreshLamps: () => screen.lamps.refresh(),
  });
  const menuOptions = buildMenuOptions({
    parts: optionDeps,
    settings: settings.get,
    demo: core.demo,
    hasStoredMeasurements,
    onSettingsSaved: adoption.fromSettings,
    openOnboarding: onboarding.open,
    openBoxPage: () => screen.navigation.openActiveSensorPage(),
    effectiveCalibration: core.effectiveCalibration,
    shareVehicleSetup: (current) => void shareVehicleSetup(pickVehicleGeometry(current)),
  });

  const settingsSurface = mountSettingsSurface(menuOptions);
  const sensorPages = mountSensorPages((descriptor) =>
    boxPageOptions(menuOptions, descriptor, optionDeps),
  );
  const navigation = createNavigation({
    settings: settingsSurface.route,
    boxListPage: sensorPages.boxListPage,
    sensorPage: sensorPages.sensorPage,
    activeSource: () => core.sensor().getSource(),
    isBoxPending: () => core.boxPending.isPending(),
  });
  const infoPage = mountInfoPage(onboarding, navigation);

  screen.settingsSurface = settingsSurface;
  screen.navigation = navigation;
  return { onboarding, settingsSurface, sensorPages, infoPage, navigation };
}

function createAdoption(core: Core, screen: Screen) {
  return createSettingsAdoption({
    adopt: core.settings.adopt,
    applyLook,
    unlockAudio: core.sound.unlock,
    refresh() {
      screen.lamps.refresh();
      screen.levelScreen.rebuildIfChanged();
    },
  });
}

/** "Delete all Libell data" (#678): a reload then starts as on first run. */
function deleteAllAndRestart(): void {
  deleteAllStoredData();
  window.location.reload();
}

/** The "?" page, opened from the help button. */
function mountInfoPage(onboarding: OnboardingLauncher, navigation: Navigation): InfoPage {
  const infoPage = createInfoPage({
    openOnboarding: onboarding.open,
    hasDoneOnboarding,
    openTarget: navigation.openHelpTarget,
    storedData: { read: () => readStoredData(), deleteAll: deleteAllAndRestart },
  });
  document.body.append(infoPage.element);
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  if (helpButton) infoPage.attach(helpButton);
  return infoPage;
}
