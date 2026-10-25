import './ui/styles.css';
import { hasSeenOnboarding, loadLanguage, markMeasurementsSaved } from './data/settingsStore';
import { isSensorSupported, needsPermissionGesture } from './sensor/orientation';
import { resolveLanguage, setLanguage } from './ui/i18n';
import { createInstallOffer, type InstallOffer } from './ui/install';
import { showIncomingVehicleSetup } from './ui/incomingVehicleSetup';
import { showToast } from './ui/toast';
import { nextVehicleName } from './ui/vehiclePicker';
import { takePendingVehicleSetupCode } from './ui/vehicleShare';
import { keepScreenAwake } from './ui/wakeLock';
import { createCore, type Core, type Screen } from './app/core';
import { guardAgainstFraming } from './app/frameGuard';
import { offerIncomingSetup } from './app/incomingSetup';
import { mountMainScreen } from './app/mainScreen';
import { mountPages, type Pages } from './app/pages';
import { startSensors } from './app/sensorStartup';
import { runStartupMigrations } from './app/startupMigrations';
import { setupTopBar, type TopBar } from './app/topBar';

/**
 * Only creates the app's modules and connects them; behaviour lives in
 * `src/app/` and `src/ui/`.
 */

guardAgainstFraming();
setLanguage(resolveLanguage(loadLanguage()));
const install = createInstallOffer();
const topBar = setupTopBar(install);
const root = document.querySelector<HTMLElement>('#app');
if (root) bootstrap(root, topBar, install);

function bootstrap(root: HTMLElement, topBar: TopBar, install: InstallOffer): void {
  keepScreenAwake();
  runStartupMigrations();
  // Consumed off the URL at once, so a later refresh never re-prompts.
  const pendingSetupCode = takePendingVehicleSetupCode();
  const screen = {} as Screen;
  const core = createCore(screen);
  const pages = mountPages(core, screen, install);
  mountMainScreen(root, core, pages, screen, topBar);
  start(root, core, pages, screen, pendingSetupCode);
}

/** An incoming setup link or the first-run intro, then the readings. */
function start(
  root: HTMLElement,
  core: Core,
  pages: Pages,
  screen: Screen,
  pendingSetupCode: string | null,
): void {
  const offered = offerIncomingSetup(pendingSetupCode, {
    settings: core.settings,
    markMeasurementsSaved,
    onApplied() {
      screen.lamps.refresh();
      screen.levelScreen.rebuildIfChanged();
    },
    addVehicle: (geometry) =>
      core.optionDeps.vehicles.add(nextVehicleName(core.optionDeps.vehicles.list()), geometry),
    show: showIncomingVehicleSetup,
    toast: (text) => void showToast(text),
  });
  if (!offered && !core.demo && !hasSeenOnboarding()) pages.onboarding.openFirstRun();

  if (core.demo) {
    screen.levelScreen.show();
    return;
  }
  void startSensors({
    root,
    sensor: core.sensor,
    attemptAutoReconnect: () => core.boxes.attemptAutoReconnect(),
    showLevelScreen: () => screen.levelScreen.show(),
    isSensorSupported,
    needsPermissionGesture,
    isSecureContext: () => window.isSecureContext,
  });
}
