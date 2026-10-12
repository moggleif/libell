import './ui/styles.css';
import { combineCalibrations } from './domain/calibration';
import type { LevelSettings } from './domain/settings';
import { pickVehicleGeometry } from './domain/vehicleShare';
import {
  hasDoneOnboarding,
  hasSeenOnboarding,
  hasStoredMeasurements,
  isBoxPending,
  loadLanguage,
  loadSettings,
  markMeasurementsSaved,
  markOnboardingDone,
  markOnboardingSeen,
  saveSettings,
  setBoxPending,
} from './data/settingsStore';
import { loadRememberedDeviceId, saveRememberedDeviceId } from './data/sensorDeviceStore';
import {
  createOrientationSensor,
  isSensorSupported,
  needsPermissionGesture,
  type OrientationSensor,
} from './sensor/orientation';
import {
  createExternalSensorController,
  type ExternalSensorController,
} from './sensor/externalSensorController';
import type { XparkleSensor } from './sensor/xparkleSensor';
import { resolveLanguage, setLanguage } from './ui/i18n';
import { showIncomingVehicleSetup } from './ui/incomingVehicleSetup';
import { createInfoPage, type InfoPage } from './ui/infoMenu';
import { attachMuteButton } from './ui/muteButton';
import { showOnboarding } from './ui/onboarding';
import { applyAppearance, applyTheme, followSystemTheme } from './ui/theme';
import { showToast } from './ui/toast';
import { shareVehicleSetup, takePendingVehicleSetupCode } from './ui/vehicleShare';
import { keepScreenAwake } from './ui/wakeLock';
import { createAppSettings, type AppSettings } from './app/appSettings';
import { createBoxZeroing } from './app/boxZero';
import { createDemoSensor } from './app/demoSensor';
import {
  createExternalSensor,
  hasPersistentDeviceAccess,
  isRememberedDeviceUsable,
  type BoxWiring,
  type LibellExternalSensor,
} from './app/externalSensorWiring';
import { guardAgainstFraming } from './app/frameGuard';
import { offerIncomingSetup } from './app/incomingSetup';
import {
  createBoxPending,
  mountLamps,
  mountSensorStatus,
  mountTargetBadge,
  type BoxPending,
  type Refreshable,
} from './app/indicatorWiring';
import { createInstallOffsets } from './app/installOffsets';
import { buildLevelScreen, createLevelScreenHost, type LevelScreenHost } from './app/levelScreen';
import type { MenuOptionDeps } from './app/menuOptionParts';
import { boxPageOptions, buildMenuOptions, wizardBoxOptions } from './app/menuOptions';
import { createNavigation, type Navigation } from './app/navigation';
import { createOnboardingLauncher, type OnboardingLauncher } from './app/onboardingLauncher';
import { createPhoneCalibration } from './app/phoneCalibration';
import { startSensors } from './app/sensorStartup';
import { mountSensorPages, type SensorPages } from './app/sensorPages';
import { createSettingsAdoption } from './app/settingsAdoption';
import { mountSettingsSurface, type SettingsSurface } from './app/settingsSurface';
import { createMuteToggle, createSound, type Sound } from './app/sound';
import { runStartupMigrations } from './app/startupMigrations';
import { createTargets } from './app/targets';
import { readTilt } from './app/tiltReading';
import { setupTopBar, type TopBar } from './app/topBar';

/**
 * Only creates the app's modules and connects them; behaviour lives in
 * `src/app/` and `src/ui/`.
 */

guardAgainstFraming();
setLanguage(resolveLanguage(loadLanguage()));
const topBar = setupTopBar();
const root = document.querySelector<HTMLElement>('#app');
if (root) bootstrap(root, topBar);

/** The app's state and the sensors, before any page exists. */
interface Core {
  settings: AppSettings;
  /** ?demo: a fixed synthetic tilt, for screenshots and sensorless machines. */
  demo: boolean;
  sound: Sound;
  boxPending: BoxPending;
  externalSensors: ExternalSensorController<LibellExternalSensor>;
  /** The source feeding readings right now (ADR 0014); call it each time, it changes. */
  sensor: () => OrientationSensor;
  /** Calibration, zero and target, combined, for the active source. */
  effectiveCalibration: () => ReturnType<typeof combineCalibrations>;
  activeInstallOffset: () => ReturnType<ReturnType<typeof createInstallOffsets>['valueOf']>;
  optionDeps: MenuOptionDeps;
}

/** The pages over the main screen. */
interface Pages {
  onboarding: OnboardingLauncher;
  settingsSurface: SettingsSurface;
  sensorPages: SensorPages;
  infoPage: InfoPage;
  navigation: Navigation;
}

/**
 * What the core calls back into, created after it. Filled in during
 * start-up and only called once start-up is over.
 */
interface Screen {
  lamps: Refreshable;
  targetBadge: Refreshable;
  sensorStatus: Refreshable;
  levelScreen: LevelScreenHost;
  settingsSurface: SettingsSurface;
  navigation: Navigation;
}

function bootstrap(root: HTMLElement, topBar: TopBar): void {
  keepScreenAwake();
  runStartupMigrations();
  // Consumed off the URL at once, so a later refresh never re-prompts.
  const pendingSetupCode = takePendingVehicleSetupCode();
  const screen = {} as Screen;
  const core = createCore(screen);
  const pages = mountPages(core, screen);
  mountMainScreen(root, core, pages, screen, topBar);
  start(root, core, pages, screen, pendingSetupCode);
}

function applyLook(settings: LevelSettings): void {
  applyTheme(settings.theme);
  applyAppearance(settings.appearance);
}

function createCore(screen: Screen): Core {
  const settings = createAppSettings(loadSettings(), saveSettings);
  applyLook(settings.get());
  followSystemTheme(() => settings.get().theme);
  const demo = new URLSearchParams(location.search).has('demo');
  const boxPending = createBoxPending({ load: isBoxPending, save: setBoxPending });
  const externalSensors = createSensorController(settings, demo, screen);
  const sensor = () => externalSensors.getActiveSensor();
  const readTiltNow = () => readTilt(sensor());
  const boxWiring: BoxWiring = {
    settings,
    getSensor: (source) => externalSensors.getSensor(source),
    onMountingChanged: () => screen.lamps.refresh(),
  };

  // Each box's installation offset (ADR 0014): a box's whole idea of level,
  // never combined with the phone's.
  const installOffsets = createInstallOffsets();
  const activeInstallOffset = () => installOffsets.valueOf(sensor().getSource());
  // The phone's sensor bias and vehicle zero (ADR 0010). Taking either means
  // the phone is in use after all, so a box chosen in the wizard is no longer
  // awaited.
  const phoneCalibration = createPhoneCalibration({
    readTilt: readTiltNow,
    onCaptured() {
      boxPending.settle(false);
      screen.lamps.refresh();
    },
    onCleared: () => screen.lamps.refresh(),
  });
  const boxZero = createBoxZeroing({
    activeSensor: sensor,
    getXparkle: () => externalSensors.getSensor('xparkle') as XparkleSensor | null,
    offsets: installOffsets,
    readTilt: readTiltNow,
    onChanged: () => screen.lamps.refresh(),
  });
  // What "level" means for the active source (ADR 0013/0014), and the active
  // target as a third term on top of it.
  const zeroCalibration = () =>
    sensor().getSource() === 'phone' ? phoneCalibration.zero() : activeInstallOffset();
  const targets = createTargets({
    readTilt: readTiltNow,
    zeroCalibration,
    onActiveChanged: () => screen.targetBadge.refresh(),
  });

  return {
    settings,
    demo,
    sound: createSound(),
    boxPending,
    externalSensors,
    sensor,
    effectiveCalibration: () => combineCalibrations(zeroCalibration(), targets.activeOffset()),
    activeInstallOffset,
    optionDeps: {
      activeSensor: sensor,
      readTilt: readTiltNow,
      phoneCalibration,
      boxZero,
      installOffsets,
      targets,
      externalSensors,
      boxWiring,
    },
  };
}

/**
 * The phone sensor lives for the whole session, so switching back to it
 * needs no new permission.
 */
function createSensorController(
  settings: AppSettings,
  demo: boolean,
  screen: Screen,
): ExternalSensorController<LibellExternalSensor> {
  const controller = createExternalSensorController<LibellExternalSensor>({
    phoneSensor: demo ? createDemoSensor() : createOrientationSensor(),
    createSensor: (source) => createExternalSensor(source, settings.get),
    loadDeviceId: loadRememberedDeviceId,
    saveDeviceId: saveRememberedDeviceId,
    isRememberedDeviceUsable,
    getPreferredSource: () => settings.get().sensorSource,
    hasPersistentDeviceAccess,
    rememberSource: (source) => settings.set({ ...settings.get(), sensorSource: source }),
    // The level screen may never have been built (a desktop without
    // motion sensors): build it now a real source feeds readings.
    onLevelScreenNeeded: () => screen.levelScreen.show(),
    // The calibration lamp follows the active source.
    onIndicatorsChanged() {
      screen.lamps.refresh();
      screen.settingsSurface.followSource(controller.getActiveSensor().getSource());
    },
    onStatusChanged: () => screen.sensorStatus.refresh(),
  });
  return controller;
}

function mountPages(core: Core, screen: Screen): Pages {
  const { settings, optionDeps } = core;
  const adoption = createSettingsAdoption({
    adopt: settings.adopt,
    applyLook,
    unlockAudio: core.sound.unlock,
    refresh() {
      screen.lamps.refresh();
      screen.levelScreen.rebuildIfChanged();
    },
  });
  const onboarding = createOnboardingLauncher({
    show: showOnboarding,
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
    openExternalSensor: () => screen.navigation.openActiveSensorPage(),
    effectiveCalibration: core.effectiveCalibration,
    shareVehicleSetup: (current) => void shareVehicleSetup(pickVehicleGeometry(current)),
  });

  const settingsSurface = mountSettingsSurface(menuOptions);
  const sensorPages = mountSensorPages((descriptor) =>
    boxPageOptions(menuOptions, descriptor, optionDeps),
  );
  const navigation = createNavigation({
    settings: settingsSurface.route,
    externalSensorPage: sensorPages.externalSensorPage,
    sensorPage: sensorPages.sensorPage,
    activeSource: () => core.sensor().getSource(),
    isBoxPending: () => core.boxPending.isPending(),
  });
  const infoPage = createInfoPage({
    openOnboarding: onboarding.open,
    hasDoneOnboarding,
    hasSensorPage: sensorPages.sensorPage !== null,
    openTarget: navigation.openHelpTarget,
  });
  document.body.append(infoPage.element);
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  if (helpButton) infoPage.attach(helpButton);

  screen.settingsSurface = settingsSurface;
  screen.navigation = navigation;
  return { onboarding, settingsSurface, sensorPages, infoPage, navigation };
}

/** The bottom bar's mute, the indicators, and the level screen. */
function mountMainScreen(
  root: HTMLElement,
  core: Core,
  pages: Pages,
  screen: Screen,
  topBar: TopBar,
): void {
  const { navigation } = pages;
  attachMuteButton(
    {
      button: document.querySelector<HTMLButtonElement>('#sound-button'),
      waves: document.querySelector<SVGPathElement>('#sound-icon-waves'),
      mute: document.querySelector<SVGPathElement>('#sound-icon-mute'),
    },
    createMuteToggle(core.settings, core.sound.unlock).toggle,
  );
  screen.lamps = mountLamps(document.querySelector('#indicators'), {
    demo: core.demo,
    activeSource: () => core.sensor().getSource(),
    boxPending: core.boxPending,
    phoneCalibration: core.optionDeps.phoneCalibration,
    activeInstallOffset: core.activeInstallOffset,
    measurementsSaved: hasStoredMeasurements,
    open: navigation.openLamp,
  });
  screen.targetBadge = mountTargetBadge(document.querySelector('#indicators'), {
    activeName: () => core.optionDeps.targets.activeName(),
    open: navigation.openTargets,
  });
  // Into the pinned top-bar corner, beside Install.
  screen.sensorStatus = mountSensorStatus(document.querySelector('#sensor-slot'), {
    supported: pages.sensorPages.supported,
    showIosGuide: pages.sensorPages.showIosGuide,
    sensor: core.sensor,
    open: navigation.openSensor,
  });
  topBar.syncCorner();
  screen.levelScreen = createLevelScreenHost({
    settings: core.settings.get,
    build: () => buildAppLevelScreen(root, core, pages, screen),
  });
}

function buildAppLevelScreen(root: HTMLElement, core: Core, pages: Pages, screen: Screen) {
  const { externalSensors, sound } = core;
  const { externalSensorPage, sensorPage } = pages.sensorPages;
  const landscape = window.matchMedia('(orientation: landscape)');
  return buildLevelScreen(root, {
    sensor: core.sensor,
    settings: core.settings.get,
    calibration: core.effectiveCalibration,
    // A page is open: the user is reading, phone in hand.
    isPaused: () =>
      pages.settingsSurface.isOpen() ||
      pages.infoPage.isOpen() ||
      (sensorPage?.isOpen() ?? false) ||
      pages.onboarding.isOpen(),
    refreshStatus() {
      screen.sensorStatus.refresh();
      // The box page's live rows: a no-op unless that page is open.
      externalSensorPage?.refreshLive();
    },
    externalSensors,
    hasSensorPage: externalSensorPage !== null,
    isLandscape: () => landscape.matches,
    isVisible: () => document.visibilityState === 'visible',
    openActiveSensorPage: pages.navigation.openActiveSensorPage,
    retry: () => externalSensors.retry(),
    usePhoneSensor: () => externalSensors.usePhoneSensor(),
    playChime: sound.playChime,
    playGuidancePulse: sound.playGuidancePulse,
    vibrate(pattern) {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
    },
  });
}

/** An incoming setup link or the first-run wizard, then the readings. */
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
    show: showIncomingVehicleSetup,
    toast: (text) => void showToast(text),
  });
  if (!offered && !core.demo && !hasSeenOnboarding()) pages.onboarding.open();

  if (core.demo) {
    screen.levelScreen.show();
    return;
  }
  void startSensors({
    root,
    sensor: core.sensor,
    attemptAutoReconnect: () => core.externalSensors.attemptAutoReconnect(),
    showLevelScreen: () => screen.levelScreen.show(),
    isSensorSupported,
    needsPermissionGesture,
    isSecureContext: () => window.isSecureContext,
  });
}
