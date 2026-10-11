import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { setupShareButton } from './ui/share';
import { shareVehicleSetup, takePendingVehicleSetupCode } from './ui/vehicleShare';
import { showIncomingVehicleSetup } from './ui/incomingVehicleSetup';
import { showToast } from './ui/toast';
import { attachUpdateCheck, installUpdateReload } from './ui/appUpdate';
import { keepScreenAwake } from './ui/wakeLock';
import { combineCalibrations } from './domain/calibration';
import type { LevelSettings } from './domain/settings';
import {
  applyVehicleGeometry,
  decodeVehicleGeometry,
  pickVehicleGeometry,
} from './domain/vehicleShare';
import {
  hasDoneOnboarding,
  hasSeenOnboarding,
  hasStoredMeasurements,
  isBoxPending,
  setBoxPending,
  markMeasurementsSaved,
  migrateMeasurementsSaved,
  migrateLegacyInstallCalibration,
  loadLanguage,
  loadSettings,
  markOnboardingDone,
  markOnboardingSeen,
  saveSettings,
} from './data/settingsStore';
import {
  loadRememberedDeviceId,
  migrateLegacyRememberedDeviceId,
  saveRememberedDeviceId,
} from './data/sensorDeviceStore';
import {
  createOrientationSensor,
  isSensorSupported,
  needsPermissionGesture,
  type OrientationSensor,
  type SensorState,
} from './sensor/orientation';
import { availableExternalSensors, hasAvailableExternalSensor } from './sensor/externalSensors';
import type { XparkleSensor } from './sensor/xparkleSensor';
import { createExternalSensorController } from './sensor/externalSensorController';
import { createMenu, type Menu } from './ui/menu';
import { createSettingsPage, type SettingsPage } from './ui/settingsPage';
import { takeReopenSettings } from './ui/reopenSettings';
import { createInfoPage } from './ui/infoMenu';
import { createSensorPage, type ExternalSensorPage } from './ui/sensorPage';
import { createIosSensorGuidePage } from './ui/iosSensorGuidePage';
import { isIos } from './ui/platform';
import { applyAppearance, applyTheme, followSystemTheme } from './ui/theme';
import { showOnboarding } from './ui/onboarding';
import { resolveLanguage, setLanguage, t } from './ui/i18n';
import {
  createExternalSensor,
  hasPersistentDeviceAccess,
  isRememberedDeviceUsable,
  type BoxWiring,
  type LibellExternalSensor,
  type SettingsAccess,
} from './app/externalSensorWiring';
import { createInstallOffsets } from './app/installOffsets';
import { createBoxZeroing } from './app/boxZero';
import { createPhoneCalibration } from './app/phoneCalibration';
import type { MenuOptionDeps } from './app/menuOptionParts';
import { boxPageOptions, buildMenuOptions, wizardBoxOptions } from './app/menuOptions';
import { createOnboardingLauncher } from './app/onboardingLauncher';
import { createSettingsAdoption } from './app/settingsAdoption';
import { buildLevelScreen, createLevelScreenHost } from './app/levelScreen';
import { createTargets } from './app/targets';
import { readTilt } from './app/tiltReading';
import { createNavigation } from './app/navigation';
import {
  createBoxPending,
  mountLamps,
  mountSensorStatus,
  mountTargetBadge,
} from './app/indicatorWiring';
import { createMuteToggle, createSound } from './app/sound';
import { attachMuteButton } from './ui/muteButton';

// Clickjacking guard (#67): GitHub Pages cannot send response headers and
// browsers ignore `frame-ancestors` in a <meta>-delivered CSP (ADR 0005),
// so the app refuses to run framed — blank the page, then walk the top
// window to the real address (allowed cross-origin for navigation).
if (window.top !== window.self) {
  document.body.replaceChildren();
  try {
    window.top!.location.href = location.href;
  } catch {
    // Sandboxed frame without top-navigation: stay blank.
  }
}

setLanguage(resolveLanguage(loadLanguage()));

const installButton = document.querySelector<HTMLButtonElement>('#install-button');
const installHint = document.querySelector<HTMLElement>('#install-hint');
if (installButton && installHint) {
  setupInstallButton(installButton, installHint);
}

const shareButton = document.querySelector<HTMLButtonElement>('#share-button');
if (shareButton) setupShareButton(shareButton);

if (installButton) installButton.textContent = t('topbar.install');

// The pinned top-right corner (Install, then the sensor-status icon) sits
// out of the flex flow, so the bar has to reserve its width or an in-flow
// item can slide underneath it. Measured rather than assumed (#244): the
// Install label's width differs per language, and the corner holds one
// control, two, or none depending on what this browser offers.
const topbarCorner = document.querySelector<HTMLElement>('#topbar-corner');

function syncTopbarCorner(): void {
  const bar = document.querySelector<HTMLElement>('.topbar');
  if (!bar || !topbarCorner) return;
  const width = topbarCorner.getBoundingClientRect().width;
  bar.style.setProperty('--topbar-corner', `${Math.ceil(width)}px`);
  bar.classList.toggle('topbar--has-corner', width > 0);
}

// Install appears and disappears on its own schedule — the browser fires
// its prompt event well after load, and the button hides itself once the
// app is installed — so the reservation follows the attribute rather than
// being computed once at startup.
if (installButton) {
  new MutationObserver(syncTopbarCorner).observe(installButton, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
}
syncTopbarCorner();
const settingsButtonEl = document.querySelector<HTMLButtonElement>('#settings-button');
if (settingsButtonEl) settingsButtonEl.setAttribute('aria-label', t('bottombar.settings'));
const helpButtonEl = document.querySelector<HTMLButtonElement>('#help-button');
if (helpButtonEl) helpButtonEl.setAttribute('aria-label', t('bottombar.help'));
if (installHint) installHint.textContent = t('install.hint');

const versionFooter = document.querySelector<HTMLElement>('#app-version');
if (versionFooter && __APP_VERSION__) {
  versionFooter.textContent = `v${__APP_VERSION__}`;
}

// Tapping the name / version checks for a new deployment (#301), and a new
// worker taking over reloads the page into it once.
installUpdateReload();
const identityEl = document.querySelector<HTMLElement>('.topbar__identity');
if (identityEl) attachUpdateCheck(identityEl);

/** Fixed synthetic tilt for ?demo mode and screenshots. */
function createDemoSensor(): ReturnType<typeof createOrientationSensor> {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const gravity = { x: 9.81 * Math.tan(rad(-1.2)), y: 9.81 * Math.tan(rad(-0.35)), z: 9.81 };
  return {
    start: () => Promise.resolve('granted' as const),
    getState: () => 'granted' as const,
    getGravity: () => gravity,
    // The demo stand-in speaks for the phone sensor it replaces (#128) —
    // and the type checker enforces this object stays a full
    // `OrientationSensor` if the interface ever grows again.
    getSource: () => 'phone' as const,
    // Fixed synthetic tilt is always "just sampled" (#132) — demo mode and
    // the screenshot generator must never show the stale-data overlay.
    getLastSampleAt: () => performance.now(),
  };
}

// Started only once every top-level const/function above it is actually
// initialized — `bootstrap` (a hoisted function declaration) may read them
// the moment it runs, so this call must stay textually after their
// declarations, not just after their own hoisted binding exists.
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  bootstrap(app);
}

function bootstrap(root: HTMLElement): void {
  keepScreenAwake();

  // External-sensor storage moved from device-named keys to per-source
  // ones (#263, ADR 0016). Both copies run before anything reads either
  // value, exactly once each (they carry their own markers), and never
  // overwrite or resurrect anything — see the two functions for why the
  // legacy keys are copied rather than moved.
  migrateLegacyInstallCalibration();
  migrateMeasurementsSaved();
  migrateLegacyRememberedDeviceId();

  // Incoming "share vehicle setup" link (R41, #207): consumed off the URL
  // immediately (clears the fragment) so a later refresh never re-prompts;
  // decoded and actually shown further down, once `updateIndicators` and
  // `maybeRebuildScreen` exist to react to an applied setup.
  const pendingVehicleSetupCode = takePendingVehicleSetupCode();

  let settings: LevelSettings = loadSettings();
  const boxPending = createBoxPending({ load: isBoxPending, save: setBoxPending });
  // Each box's installation offset (#131, ADR 0014): the same "vehicle
  // zero" concept as `vehicleCalibration` above, generalized to external
  // sources — independent values, never combined with, or overwriting,
  // the phone's. There is no box hardware-bias layer (unlike the phone's
  // own `calibration`), so a box's offset alone is everything "level"
  // means while it is the source.
  const installOffsets = createInstallOffsets();
  const activeInstallOffset = () => installOffsets.valueOf(sensor().getSource());
  const readTiltNow = () => readTilt(sensor());
  // The phone's sensor bias and vehicle zero (#83, ADR 0010). Taking
  // either means the user is using the phone after all, so a box chosen
  // in the wizard is no longer awaited (#365).
  const phoneCalibration = createPhoneCalibration({
    readTilt: readTiltNow,
    onCaptured() {
      boxPending.settle(false);
      lamps.refresh();
    },
    onCleared: () => lamps.refresh(),
  });
  const boxZero = createBoxZeroing({
    activeSensor: () => sensor(),
    getXparkle: () => externalSensors.getSensor('xparkle') as XparkleSensor | null,
    offsets: installOffsets,
    readTilt: readTiltNow,
    onChanged: () => lamps.refresh(),
  });
  // What "level" means, untouched by target presets (#122, ADR 0013).
  // Selected per the ACTIVE sensor source (#131, ADR 0014): each source
  // supplies its own calibration, so switching sources never mixes one
  // source's calibration into the other's readings.
  const zeroCalibration = () =>
    sensor().getSource() === 'phone' ? phoneCalibration.zero() : activeInstallOffset();
  const targets = createTargets({
    readTilt: readTiltNow,
    zeroCalibration,
    onActiveChanged: () => targetBadge.refresh(),
  });
  // The active target is a THIRD additive term on top of the zero; Normal
  // leaves the two identical (regression guard).
  const effectiveCalibration = () => combineCalibrations(zeroCalibration(), targets.activeOffset());
  applyTheme(settings.theme);
  applyAppearance(settings.appearance);
  followSystemTheme(() => settings.theme);
  // ?demo replaces the sensor with a fixed synthetic tilt — used by the
  // build-time screenshot generator and handy for trying the app on a
  // desktop without sensors.
  const demo = new URLSearchParams(location.search).has('demo');
  // The phone sensor stays alive for the whole session (never recreated)
  // so switching back from an external source needs no re-permissioning.
  const phoneSensor = demo ? createDemoSensor() : createOrientationSensor();
  /**
   * The source feeding readings right now — the ONE injection point (#128,
   * ADR 0014). Read fresh on every use rather than cached in a binding
   * (#265): the controller below owns the switch, so a connect or a
   * fallback takes effect on the very next animation frame with nothing
   * here to keep in sync.
   */
  const sensor = (): OrientationSensor => externalSensors.getActiveSensor();
  // Settings written straight from a box's page or the controller, not
  // through the Settings form's own save flow.
  const settingsAccess: SettingsAccess = {
    get: () => settings,
    set(next) {
      settings = next;
      saveSettings(settings);
    },
  };
  const boxWiring: BoxWiring = {
    settings: settingsAccess,
    getSensor: (source) => externalSensors.getSensor(source),
    onMountingChanged: () => lamps.refresh(),
  };
  const sound = createSound();

  /**
   * The external-sensor lifecycle (#265) — connect, disconnect, the silent
   * auto-reconnect at open (#130), the background auto-retry (#211) and
   * the "use phone sensor" escape hatch (#134) all live in one place now,
   * for every source rather than one device. `main.ts` keeps only the
   * wiring: which screen to build, and which indicators to refresh.
   */
  // The source Settings last drew its Calibration tab for (#353).
  let lastSettingsSource: ReturnType<OrientationSensor['getSource']> = 'phone';
  const externalSensors = createExternalSensorController<LibellExternalSensor>({
    phoneSensor,
    createSensor: (source) => createExternalSensor(source, () => settings),
    loadDeviceId: loadRememberedDeviceId,
    saveDeviceId: saveRememberedDeviceId,
    isRememberedDeviceUsable,
    getPreferredSource: () => settings.sensorSource,
    hasPersistentDeviceAccess,
    rememberSource: (source) => settingsAccess.set({ ...settings, sensorSource: source }),
    // The level screen may never have been built yet (e.g. a desktop
    // without phone motion sensors) — build it now that a real source is
    // feeding readings; harmless to rebuild if it already exists.
    onLevelScreenNeeded: () => levelScreen.show(),
    // The amber calibration lamp checks whichever source is active (#131),
    // so switching source alone still has to refresh it.
    onIndicatorsChanged: () => {
      lamps.refresh();
      // Settings may be open under the box's own page: when the source
      // flips (box connected or disconnected there), redraw its open tab
      // so closing the box page shows the right calibration (#353). Only
      // on a real change, so a silent reconnect never redraws mid-read.
      const source = sensor().getSource();
      if (source !== lastSettingsSource) {
        lastSettingsSource = source;
        if (isModern) settingsPage?.refreshOpenTab();
        else menu?.refresh();
      }
    },
    onStatusChanged: () => sensorStatus.refresh(),
  });

  // The option groups the wizard, the menu and the box pages share,
  // built once so no field is wired two ways (#374).
  const optionDeps: MenuOptionDeps = {
    activeSensor: () => sensor(),
    readTilt: readTiltNow,
    phoneCalibration,
    boxZero,
    installOffsets,
    targets,
    externalSensors,
    boxWiring,
  };
  const adoption = createSettingsAdoption({
    adopt: (next) => (settings = next),
    applyLook(next) {
      applyTheme(next.theme);
      applyAppearance(next.appearance);
    },
    unlockAudio: sound.unlock,
    refresh() {
      lamps.refresh();
      levelScreen.rebuildIfChanged();
    },
  });

  // First-run wizard: placement, measurements, calibration (#43).
  const onboarding = createOnboardingLauncher({
    show: showOnboarding,
    settings: () => settings,
    onSettingsSaved: adoption.fromWizard,
    parts: optionDeps,
    sensorOptionsFor: (descriptor) => wizardBoxOptions(menuOptions, descriptor, optionDeps),
    progress: { markSeen: markOnboardingSeen, markDone: markOnboardingDone },
    boxPending,
    activeSource: () => sensor().getSource(),
    refreshLamps: () => lamps.refresh(),
  });

  // Every field the Settings page, the ☰ menu and the box pages need.
  const menuOptions = buildMenuOptions({
    parts: optionDeps,
    settings: () => settings,
    demo,
    hasStoredMeasurements,
    onSettingsSaved: adoption.fromSettings,
    openOnboarding: onboarding.open,
    // Declared further down; only ever called after start-up (#316).
    openExternalSensor: () => navigation.openActiveSensorPage(),
    effectiveCalibration,
    shareVehicleSetup: (current) => void shareVehicleSetup(pickVehicleGeometry(current)),
  });

  // Modern (screen-cleanup follow-up): the gear icon opens the Settings
  // page directly (Vehicle/Ramps/Calibration/Level/General as tabs), never a
  // drawer — and the old ☰ menu is gone entirely for this appearance.
  // Classic has no tabs to land on, so it keeps the ☰ drawer, now holding
  // just Settings/Calibration/Targets (Diagnostics, the introduction
  // relaunch and External sensor moved to the universal pages below,
  // reachable from Classic too — see their own file comments for why).
  // Decided once at bootstrap, like every other appearance-branching
  // component (rvDiagram, settingsPanel, onboarding) — never rebuilt on a
  // later live appearance change.
  const isModern = settings.appearance === 'modern';
  let menu: Menu | null = null;
  let settingsPage: SettingsPage | null = null;
  const settingsButton = document.querySelector<HTMLButtonElement>('#settings-button');
  if (isModern) {
    settingsPage = createSettingsPage(menuOptions);
    document.body.append(settingsPage.element);
    if (settingsButton) settingsPage.attach(settingsButton);
  } else {
    menu = createMenu(menuOptions);
    document.body.append(menu.element);
    if (settingsButton) menu.attach(settingsButton);
  }
  const isMenuOpen = () =>
    isModern ? (settingsPage?.isOpen() ?? false) : (menu?.isOpen() ?? false);
  // Just reloaded for a new appearance or language from Settings (#345):
  // back on General, where the choice was made, not on the main screen.
  if (takeReopenSettings()) {
    if (isModern) settingsPage?.openTab('general');
    else menu?.open('general');
  }

  // External sensor (screen-cleanup follow-up): its own page, reached
  // only from the top-right sensor-status icon now that the ☰ menu no
  // longer carries an "External sensor" entry — universal, both
  // appearances. Omitted entirely without Web Bluetooth — never a
  // silently broken option (#116) — except on iOS (R39): Apple has no
  // plans to add Web Bluetooth there, so instead of hiding the entry point
  // outright, iOS gets a guide to the Bluefy workaround
  // (`iosSensorGuidePage.ts`, docs/ios-easylevel-bluefy-guide.md).
  // Asked of the registry (#262, ADR 0016) rather than of one device, so
  // the question stays "is any external source usable here" as sources are
  // added — the answer is unchanged while EasyLevel is the only one.
  const externalSensorSupported = hasAvailableExternalSensor();
  const showIosGuide = !externalSensorSupported && isIos();
  // Held separately, typed as the fuller `ExternalSensorPage` (screen-
  // cleanup follow-up to #133/#129): `sensorPage` below stays the narrower
  // shared `SensorPage` type both this and `iosSensorGuidePage.ts` satisfy,
  // but only this branch actually has device pages to attach/refresh.
  const externalSensorPage: ExternalSensorPage | null = externalSensorSupported
    ? // One section and one device page per available source (#268); the
      // options bag is per source, so each renders its own name, rows and
      // controls.
      createSensorPage(availableExternalSensors(), (descriptor) =>
        boxPageOptions(menuOptions, descriptor, optionDeps),
      )
    : null;
  const sensorPage = externalSensorPage ?? (showIosGuide ? createIosSensorGuidePage() : null);
  if (sensorPage) document.body.append(sensorPage.element);
  // Attached after `sensorPage.element` (see `sensorPage.ts`'s doc
  // comment): a device page must paint on top of the External sensor list
  // page when both happen to be open at once.
  if (externalSensorPage) document.body.append(...externalSensorPage.statusElements);

  // Every shortcut to a place in the app goes through one router.
  const navigation = createNavigation({
    settings: settingsPage ? { settingsPage } : { menu: menu! },
    externalSensorPage,
    sensorPage,
    activeSource: () => sensor().getSource(),
    isBoxPending: () => boxPending.isPending(),
  });

  // "?" opens its own Help/About/Feedback tabbed page, independent of
  // Settings; each Help topic ends in a button to the place it talks
  // about (#326).
  const infoPage = createInfoPage({
    openOnboarding: onboarding.open,
    hasDoneOnboarding,
    hasSensorPage: sensorPage !== null,
    openTarget: navigation.openHelpTarget,
  });
  document.body.append(infoPage.element);
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  if (helpButton) infoPage.attach(helpButton);

  // Mute (#161): a single toggle for both sounds, in the bottom bar.
  attachMuteButton(
    {
      button: document.querySelector<HTMLButtonElement>('#sound-button'),
      waves: document.querySelector<SVGPathElement>('#sound-icon-waves'),
      mute: document.querySelector<SVGPathElement>('#sound-icon-mute'),
    },
    createMuteToggle(settingsAccess, sound.unlock).toggle,
  );

  // Dashboard-style warning lamps, the target badge, and the sensor icon.
  const lamps = mountLamps(document.querySelector('#indicators'), {
    demo,
    activeSource: () => sensor().getSource(),
    boxPending,
    phoneCalibration,
    activeInstallOffset,
    measurementsSaved: hasStoredMeasurements,
    open: navigation.openLamp,
  });
  const targetBadge = mountTargetBadge(document.querySelector('#indicators'), {
    activeName: () => targets.activeName(),
    open: navigation.openTargets,
  });
  // Into the pinned top-bar corner, so the icon and the Install button
  // always own the top-right corner (#244).
  const sensorStatus = mountSensorStatus(document.querySelector('#sensor-slot'), {
    supported: externalSensorSupported,
    showIosGuide,
    sensor,
    open: navigation.openSensor,
  });
  syncTopbarCorner();

  const showMessage = (text: string) => {
    root.replaceChildren();
    const message = document.createElement('p');
    message.className = 'app__hint';
    message.textContent = text;
    root.append(message);
  };

  // A settings save can switch the vehicle type or change what the ramp
  // plan is computed from; the level screen is then rebuilt.
  const levelScreen = createLevelScreenHost({
    settings: () => settings,
    build() {
      const landscape = window.matchMedia('(orientation: landscape)');
      return buildLevelScreen(root, {
        sensor,
        settings: () => settings,
        calibration: effectiveCalibration,
        isPaused: () =>
          isMenuOpen() ||
          infoPage.isOpen() ||
          (sensorPage?.isOpen() ?? false) ||
          onboarding.isOpen(),
        refreshStatus() {
          sensorStatus.refresh();
          // The box page's live rows: a no-op unless that page is open.
          externalSensorPage?.refreshLive();
        },
        externalSensors,
        hasSensorPage: externalSensorPage !== null,
        isLandscape: () => landscape.matches,
        isVisible: () => document.visibilityState === 'visible',
        openActiveSensorPage: navigation.openActiveSensorPage,
        retry: () => externalSensors.retry(),
        usePhoneSensor: () => externalSensors.usePhoneSensor(),
        playChime: sound.playChime,
        playGuidancePulse: sound.playGuidancePulse,
        vibrate(pattern) {
          if ('vibrate' in navigator) navigator.vibrate(pattern);
        },
      });
    },
  });

  const handleState = (state: SensorState) => {
    switch (state) {
      case 'granted':
        levelScreen.show();
        break;
      case 'denied':
        showMessage(t('main.denied'));
        break;
      default:
        showMessage(window.isSecureContext ? t('main.noSensors') : t('main.https'));
    }
  };

  // Incoming "share vehicle setup" link (R41, #207): shown instead of the
  // first-run wizard on this launch when present — malformed/truncated/
  // future-version links fail closed (a toast, nothing applied) rather
  // than a partial or guessed-at result (`decodeVehicleGeometry`).
  const pendingVehicleGeometry =
    pendingVehicleSetupCode !== null ? decodeVehicleGeometry(pendingVehicleSetupCode) : null;
  if (pendingVehicleSetupCode !== null && pendingVehicleGeometry === null) {
    showToast(t('setup.incoming.invalid'));
  }
  if (pendingVehicleGeometry !== null) {
    showIncomingVehicleSetup({
      geometry: pendingVehicleGeometry,
      displayUnit: settings.displayUnit,
      onApply: () => {
        settings = applyVehicleGeometry(settings, pendingVehicleGeometry);
        saveSettings(settings);
        markMeasurementsSaved();
        lamps.refresh();
        levelScreen.rebuildIfChanged();
      },
      onDismiss: () => {
        // Nothing to do — the link is already consumed off the URL.
      },
    });
  } else if (!demo && !hasSeenOnboarding()) {
    onboarding.open();
  }

  if (demo) {
    levelScreen.show();
    return;
  }

  /** The phone-sensor startup this app has always had — unchanged, and
   * still exactly what runs when EasyLevel was never selected, or its
   * silent reconnect attempt below never had anything to try. */
  function startDefaultSensorFlow(): void {
    if (!isSensorSupported()) {
      handleState('unsupported');
      return;
    }

    if (needsPermissionGesture()) {
      // iOS releases motion data only after a user gesture.
      root.replaceChildren();
      const hint = document.createElement('p');
      hint.className = 'app__hint';
      hint.textContent = t('main.hint');
      const start = document.createElement('button');
      start.type = 'button';
      start.className = 'app__start';
      start.textContent = t('main.start');
      start.addEventListener('click', () => {
        void sensor().start().then(handleState);
      });
      root.append(hint, start);
    } else {
      void sensor().start().then(handleState);
    }
  }

  // EasyLevel silent auto-reconnect (#130): tried only when the last
  // session left it as the active source. `attemptEasyLevelAutoReconnect`
  // resolves true the moment EasyLevel has taken over the startup flow —
  // either really connected, or honestly surfaced as "disconnected" via
  // the existing sensor-status UI (#129) — and in both cases the ordinary
  // phone-sensor flow below must NOT also run: it would call
  // `easyLevelSensor.start()`, whose `requestDevice()` picker needs a live
  // user gesture this automatic, page-load-time path does not have.
  void externalSensors.attemptAutoReconnect().then((tookOver) => {
    if (!tookOver) startDefaultSensorFlow();
  });
}
