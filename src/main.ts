import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { setupShareButton } from './ui/share';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling, tiltFromGravity, WHEEL_IDS, type GravityVector } from './domain/leveling';
import { computeCaravanLeveling, createCaravanStabilizer } from './domain/caravan';
import { combineCalibrations, vehicleZeroFromReading } from './domain/calibration';
import { createStillnessDetector } from './domain/stillness';
import { createDisplayStabilizer } from './domain/stability';
import {
  isSensorStale,
  STALE_TIMEOUT_EASYLEVEL_MS,
  STALE_TIMEOUT_PHONE_MS,
} from './domain/staleness';
import { deficitMagnitude } from './domain/rampPlan';
import { createAudioGuidance, type GuidanceDirection } from './domain/audioGuidance';
import {
  offsetTooSteep,
  presetOffsetFromReading,
  targetOffsetFor,
  type TargetPreset,
} from './domain/targetPresets';
import { createCaravanDiagram } from './ui/caravanDiagram';
import { createPoseDetector } from './domain/pose';
import {
  formatLength,
  toggleMute,
  type Calibration,
  type LevelSettings,
  type SoundPrefs,
} from './domain/settings';
import {
  clearCalibration,
  clearEasyLevelCalibration,
  clearVehicleCalibration,
  hasCompletedOnboarding,
  hasSeenOnboarding,
  hasStoredSettings,
  loadActiveTargetId,
  loadCalibrationInfo,
  loadEasyLevelCalibrationInfo,
  loadLanguage,
  loadSettings,
  loadTargetPresets,
  loadVehicleCalibrationInfo,
  markOnboardingCompleted,
  markOnboardingSeen,
  saveActiveTargetId,
  saveCalibration,
  saveEasyLevelCalibration,
  saveSettings,
  saveTargetPresets,
  saveVehicleCalibration,
} from './data/settingsStore';
import {
  loadRememberedEasyLevelDeviceId,
  saveRememberedEasyLevelDeviceId,
} from './data/easyLevelDeviceStore';
import {
  createOrientationSensor,
  isSensorSupported,
  needsPermissionGesture,
  type OrientationSensor,
  type SensorState,
} from './sensor/orientation';
import {
  createEasyLevelSensor,
  isWebBluetoothSupported,
  type EasyLevelSensor,
} from './sensor/easyLevelSensor';
import { isSensorUnavailable } from './sensor/sensorFallback';
import { createRvDiagram } from './ui/rvDiagram';
import { createTiltReadout } from './ui/tiltReadout';
import { createMenu, type Menu } from './ui/menu';
import { createSettingsPage, type SettingsPage } from './ui/settingsPage';
import { createInfoPage } from './ui/infoMenu';
import { createSensorPage } from './ui/sensorPage';
import { createTargetBadge } from './ui/targetBadge';
import { applyAppearance, applyTheme, followSystemTheme } from './ui/theme';
import { createIndicators } from './ui/indicators';
import { createSensorStatusIndicator } from './ui/sensorStatusIndicator';
import { createSensorFallbackPrompt } from './ui/sensorFallbackPrompt';
import { createLevelOverlay } from './ui/levelOverlay';
import { showOnboarding } from './ui/onboarding';
import { resolveLanguage, setLanguage, t } from './ui/i18n';

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
const settingsButtonEl = document.querySelector<HTMLButtonElement>('#settings-button');
if (settingsButtonEl) settingsButtonEl.setAttribute('aria-label', t('bottombar.settings'));
const helpButtonEl = document.querySelector<HTMLButtonElement>('#help-button');
if (helpButtonEl) helpButtonEl.setAttribute('aria-label', t('bottombar.help'));
if (installHint) installHint.textContent = t('install.hint');

const versionFooter = document.querySelector<HTMLElement>('#app-version');
if (versionFooter && __APP_VERSION__) {
  versionFooter.textContent = `v${__APP_VERSION__}`;
}

const RAD_TO_DEG = 180 / Math.PI;
const MAX_CALIBRATION_DEG = 15;
/** A check reading within this of zero counts as "still good" (#87). */
const CALIBRATION_CHECK_GOOD_DEG = 0.3;

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

// Short two-tone chime via WebAudio — no asset needed. The context is
// created lazily on the save gesture that enables the sound, which also
// satisfies autoplay policies.
let audioCtx: AudioContext | null = null;
export function unlockAudio(): void {
  if (!audioCtx && typeof AudioContext !== 'undefined') audioCtx = new AudioContext();
  void audioCtx?.resume();
}
function playChime(): void {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  for (const [freq, at] of [
    [880, 0],
    [1174.7, 0.18],
  ] as const) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.2, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + at + 0.35);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.4);
  }
}

// Continuous audio guidance pulse (#121) — a short, soft tone at the pitch
// the domain layer computed from the stabilized distance, with a brief
// glide up (improving) or down (worsening) that reads as directional
// without being alarming. Deliberately quieter and shorter than the
// two-tone completion chime above so the two never get confused.
function playGuidancePulse(pitchHz: number, direction: GuidanceDirection): void {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const durationS = 0.09;
  const glide = direction === 'improving' ? 1.15 : direction === 'worsening' ? 1 / 1.15 : 1;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(pitchHz, now);
  osc.frequency.linearRampToValueAtTime(pitchHz * glide, now + durationS);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationS);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + durationS + 0.02);
}

// Started only once every top-level const/function above it is actually
// initialized — `bootstrap` (a hoisted function declaration) transitively
// reads RAD_TO_DEG and friends the moment it runs (createDiagnosticsSection
// calls refresh() synchronously at construction), so this call must stay
// textually after their declarations, not just after their own hoisted
// binding exists.
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  bootstrap(app);
}

function bootstrap(root: HTMLElement): void {
  keepScreenAwake();

  let settings: LevelSettings = loadSettings();
  const storedSensor = loadCalibrationInfo();
  let calibration: Calibration | null = storedSensor?.value ?? null;
  let calibrationCapturedAt: number | null = storedSensor?.capturedAt ?? null;
  // The vehicle zero (#83): the phone spot's own tilt, applied on top of
  // the sensor calibration — the leveling math subtracts their sum.
  const storedVehicle = loadVehicleCalibrationInfo();
  let vehicleCalibration: Calibration | null = storedVehicle?.value ?? null;
  let vehicleCalibrationCapturedAt: number | null = storedVehicle?.capturedAt ?? null;
  // The EasyLevel box's installation offset (#131, ADR 0014): the same
  // "vehicle zero" concept as `vehicleCalibration` above, generalized to
  // this external source — its own independent value, never combined
  // with, or overwriting, the phone's. There is no separate EasyLevel
  // hardware-bias layer yet (unlike the phone's own `calibration`), so
  // this offset alone is everything "level" means while it is the source.
  const storedEasyLevel = loadEasyLevelCalibrationInfo();
  let easyLevelCalibration: Calibration | null = storedEasyLevel?.value ?? null;
  let easyLevelCalibrationCapturedAt: number | null = storedEasyLevel?.capturedAt ?? null;
  // The two-layer calibration sum — what "level" means, untouched by
  // target presets below (#122, ADR 0013). Selected per the ACTIVE sensor
  // source (#131, ADR 0014): each source supplies its own sensor-bias/
  // installation-offset pair, so switching sources never mixes one
  // source's calibration into the other's readings.
  const zeroCalibration = () =>
    sensor.getSource() === 'easylevel'
      ? easyLevelCalibration
      : combineCalibrations(calibration, vehicleCalibration);
  // Target presets (#122, ADR 0013): an intentional NON-level target,
  // applied as a THIRD additive term on top of the two-layer sum above —
  // never conflated with it, never stored in the same field. "Normal"
  // (activeTargetId === null) leaves effectiveCalibration identical to
  // zeroCalibration (regression guard).
  let targetPresets: TargetPreset[] = loadTargetPresets();
  let activeTargetId: string | null = loadActiveTargetId(targetPresets);
  const effectiveCalibration = () =>
    combineCalibrations(zeroCalibration(), targetOffsetFor(targetPresets, activeTargetId));
  applyTheme(settings.theme);
  applyAppearance(settings.appearance);
  followSystemTheme(() => settings.theme);
  // ?demo replaces the sensor with a fixed synthetic tilt — used by the
  // build-time screenshot generator and handy for trying the app on a
  // desktop without sensors.
  const demo = new URLSearchParams(location.search).has('demo');
  // The phone sensor stays alive for the whole session (never recreated)
  // so switching back from an external source needs no re-permissioning.
  // `sensor` is the ONE injection point (#128, ADR 0014) the rest of this
  // function reads from — `frame()` below closes over this binding, so
  // reassigning it (on a successful EasyLevel connect, or a fallback on
  // disconnect) takes effect on the very next animation frame.
  const phoneSensor = demo ? createDemoSensor() : createOrientationSensor();
  let sensor: OrientationSensor = phoneSensor;
  // EasyLevel BLE box (#116): created lazily, on the first connect
  // attempt (a real click handler — Web Bluetooth's `requestDevice`
  // requires a live user gesture), and kept around afterward so
  // reconnecting reuses the same adapter instance.
  let easyLevelSensor: EasyLevelSensor | null = null;

  /** Persist which source is active (#130) — read back on the next app
   * open to decide whether a silent reconnect is even worth attempting. */
  function rememberSensorSource(source: LevelSettings['sensorSource']): void {
    settings = { ...settings, sensorSource: source };
    saveSettings(settings);
  }

  /** Menu action: connect (or reconnect) the EasyLevel box. Must run
   * synchronously inside the button's own click handler. */
  async function connectEasyLevelNow(): Promise<SensorState> {
    easyLevelSensor ??= createEasyLevelSensor();
    const state = await easyLevelSensor.start();
    if (state === 'granted') {
      sensor = easyLevelSensor;
      rememberSensorSource('easylevel');
      // Remember this specific device (#130), not just "some sensor", so
      // a later app open can try a silent `getDevices()` reconnect instead
      // of showing the picker again.
      const deviceId = easyLevelSensor.getDeviceId();
      if (deviceId) saveRememberedEasyLevelDeviceId(deviceId);
      // The level screen may never have been built yet (e.g. a desktop
      // without phone motion sensors) — build it now that a real source
      // is feeding readings; harmless to rebuild if it already exists.
      showLevelScreen();
      // The amber calibration lamp now checks the EasyLevel installation
      // offset instead of the phone's pair (#131) — refresh immediately so
      // switching source alone (no calibration action) still updates it.
      updateIndicators();
    }
    return state;
  }

  /** Menu action: explicit disconnect — falls back to the phone sensor.
   * Deliberately does NOT forget the remembered device id (#130): this is
   * "not right now", not "never again" — only `sensorSource` flips back to
   * 'phone', so the next app open skips auto-reconnect until the user
   * connects again, while the box itself stays one tap away. */
  function disconnectEasyLevelNow(): void {
    easyLevelSensor?.disconnect();
    sensor = phoneSensor;
    rememberSensorSource('phone');
    // See the matching comment in `connectEasyLevelNow` (#131).
    updateIndicators();
  }

  /**
   * "Use phone sensor" (#134): the fallback prompt's explicit, tap-only
   * escape hatch from an unreachable EasyLevel connection. Reuses
   * `disconnectEasyLevelNow` verbatim — the exact same real switch the
   * menu's own "Disconnect" button already performs, never a parallel
   * implementation, and never automatic (ADR 0014: phone and EasyLevel
   * have different calibration references, so an unannounced switch could
   * show a plausible-looking but wrong reading).
   *
   * The one thing added on top: this tap is itself a genuine user
   * gesture, which is also the only thing `phoneSensor.start()` ever
   * needs (iOS included). That start may never have happened yet — e.g.
   * EasyLevel auto-reconnected (#130) at app open and took over the
   * startup flow, so the ordinary phone-sensor flow never ran — and
   * without it the phone sensor would sit silently at `getGravity() ===
   * null` forever. Calling it here is a no-op once already granted, so
   * this stays safe to call from every path that can reach this state.
   */
  function usePhoneSensorNow(): void {
    disconnectEasyLevelNow();
    void phoneSensor.start();
  }

  /**
   * "Retry" (#134): one tap, one attempt — never a retry loop or
   * backoff. Calls the existing silent `EasyLevelSensor.reconnect()`
   * (#130) with whatever device id is available, exactly the same call
   * the startup auto-reconnect already makes; on failure `reconnect()`
   * itself already resolves back to `'disconnected'`, so the fallback
   * prompt simply stays (or reappears) with no extra state to track here.
   */
  async function retryEasyLevelNow(): Promise<void> {
    const deviceId = easyLevelSensor?.getDeviceId() ?? loadRememberedEasyLevelDeviceId();
    if (!easyLevelSensor || !deviceId) return;
    const state = await easyLevelSensor.reconnect(deviceId);
    if (state === 'granted') {
      sensor = easyLevelSensor;
      updateIndicators();
    }
    updateSensorStatus();
  }

  /**
   * Silent reconnect on open (#130): only when the last session left
   * EasyLevel as the active source, and only a remembered device id (not a
   * fresh device picker) — see `easyLevelSensor.ts`'s `reconnect()` for
   * exactly which platform conditions this can and can't succeed under.
   *
   * Resolves true the moment EasyLevel has taken over the startup flow —
   * whether the box actually reconnected or not. A failed attempt
   * (`getDevices()` missing, box unreachable, ...) still adopts
   * `easyLevelSensor` as `sensor` and builds the level screen: its
   * existing per-frame loop already renders a 'disconnected' state
   * honestly (the same "connection lost" hint and status dot #116/#129
   * show for a live BLE drop), which is exactly the "fail cleanly, offer a
   * one-tap manual reconnect, never a silent failure" behavior this issue
   * asks for — reused rather than duplicated. Resolves false only when
   * there was nothing to even attempt (EasyLevel wasn't the last source,
   * nothing is remembered, or `navigator.bluetooth` itself doesn't exist),
   * in which case the caller runs the ordinary phone-sensor flow instead.
   */
  async function attemptEasyLevelAutoReconnect(): Promise<boolean> {
    if (settings.sensorSource !== 'easylevel') return false;
    const deviceId = loadRememberedEasyLevelDeviceId();
    if (!deviceId) return false;
    easyLevelSensor ??= createEasyLevelSensor();
    const state = await easyLevelSensor.reconnect(deviceId);
    if (state === 'unsupported') return false; // behave exactly as if EasyLevel had never been selected
    sensor = easyLevelSensor;
    showLevelScreen();
    updateSensorStatus();
    // See the matching comment in `connectEasyLevelNow` (#131): the amber
    // lamp's condition follows the active source.
    updateIndicators();
    return true;
  }

  // While the menu or the wizard is open the user is reading, phone in
  // hand — pause the guidance loop so the pose guard and the level
  // celebration cannot nag over the page.
  let onboardingOpen = false;

  // First-run wizard: placement, measurements, calibration. Skippable —
  // the warning lamps stay lit for whatever was skipped (#43).
  const openOnboarding = () => {
    onboardingOpen = true;
    showOnboarding({
      initialSettings: settings,
      appearance: settings.appearance,
      onSettingsSaved(next) {
        settings = next;
        applyTheme(settings.theme);
        applyAppearance(settings.appearance);
        updateIndicators();
        maybeRebuildScreen();
      },
      getCalibration: () => calibration,
      calibrate: () => calibrateNow(),
      readTilt: () => readTiltNow(),
      applyCalibration(next) {
        calibration = next;
        calibrationCapturedAt = Date.now();
        saveCalibration(next, undefined, calibrationCapturedAt);
        updateIndicators();
      },
      clearCalibration() {
        calibration = null;
        calibrationCapturedAt = null;
        clearCalibration();
        updateIndicators();
      },
      getVehicleCalibration: () => vehicleCalibration,
      getCalibrationCapturedAt: () => calibrationCapturedAt,
      getVehicleCalibrationCapturedAt: () => vehicleCalibrationCapturedAt,
      checkCalibration: () => checkAgainst(calibration),
      checkVehicleCalibration: () =>
        checkAgainst(combineCalibrations(calibration, vehicleCalibration)),
      calibrateVehicle: () => calibrateVehicleNow(),
      clearVehicleCalibration() {
        vehicleCalibration = null;
        vehicleCalibrationCapturedAt = null;
        clearVehicleCalibration();
        updateIndicators();
      },
      // Sensor source choice (#135, ADR 0014): same fields, same
      // callbacks as `createMenu` below wires up — the wizard's
      // external-sensor step embeds the exact same `sensorSourceSection`
      // component the real menu page uses, never a duplicate.
      getSensorSource: () => sensor.getSource(),
      getSensorState: () => sensor.getState(),
      connectEasyLevel: () => connectEasyLevelNow(),
      disconnectEasyLevel: () => disconnectEasyLevelNow(),
      getEasyLevelStatus: () => easyLevelSensor?.getStatus() ?? null,
      getInstallCalibration: () => easyLevelCalibration,
      calibrateInstall: () => calibrateEasyLevelNow(),
      getInstallCalibrationCapturedAt: () => easyLevelCalibrationCapturedAt,
      checkInstallCalibration: () => checkAgainst(easyLevelCalibration),
      clearInstallCalibration() {
        easyLevelCalibration = null;
        easyLevelCalibrationCapturedAt = null;
        clearEasyLevelCalibration();
        updateIndicators();
      },
      onFinished(completed) {
        onboardingOpen = false;
        markOnboardingSeen();
        if (completed) markOnboardingCompleted();
        updateIndicators();
      },
    });
  };

  // Shared options bag (#screen-cleanup follow-up): every field the ☰
  // Classic menu, the Modern Settings page, the "?" info page's
  // Diagnostics tab, and the External sensor page each need — reused
  // as-is by whichever of those get constructed below, never duplicated.
  const menuOptions = {
    initialSettings: settings,
    appearance: settings.appearance,
    openOnboarding,
    hasSavedSettings: () => demo || hasStoredSettings(),
    onSettingsSaved(next: LevelSettings) {
      settings = next;
      applyTheme(settings.theme);
      applyAppearance(settings.appearance);
      // The save click is a user gesture — the right moment to unlock
      // audio for the opt-in level chime and/or continuous guidance.
      if (settings.soundOnLevel || settings.soundGuidance) unlockAudio();
      updateIndicators();
      maybeRebuildScreen();
    },
    getCalibration: () => calibration,
    calibrate: () => calibrateNow(),
    readTilt: () => readTiltNow(),
    applyCalibration(next: Calibration) {
      calibration = next;
      calibrationCapturedAt = Date.now();
      saveCalibration(next, undefined, calibrationCapturedAt);
      updateIndicators();
    },
    clearCalibration() {
      calibration = null;
      calibrationCapturedAt = null;
      clearCalibration();
      updateIndicators();
    },
    getVehicleCalibration: () => vehicleCalibration,
    getCalibrationCapturedAt: () => calibrationCapturedAt,
    getVehicleCalibrationCapturedAt: () => vehicleCalibrationCapturedAt,
    checkCalibration: () => checkAgainst(calibration),
    checkVehicleCalibration: () =>
      checkAgainst(combineCalibrations(calibration, vehicleCalibration)),
    calibrateVehicle: () => calibrateVehicleNow(),
    clearVehicleCalibration() {
      vehicleCalibration = null;
      vehicleCalibrationCapturedAt = null;
      clearVehicleCalibration();
      updateIndicators();
    },
    getTargetPresets: () => targetPresets,
    getActiveTargetId: () => activeTargetId,
    selectTarget: (id: string | null) => selectTargetNow(id),
    addTargetPreset: (name: string) => addTargetPresetNow(name),
    deleteTargetPreset: (id: string) => deleteTargetPresetNow(id),
    getSensorSource: () => sensor.getSource(),
    getSensorState: () => sensor.getState(),
    connectEasyLevel: () => connectEasyLevelNow(),
    disconnectEasyLevel: () => disconnectEasyLevelNow(),
    getInstallCalibration: () => easyLevelCalibration,
    calibrateInstall: () => calibrateEasyLevelNow(),
    getInstallCalibrationCapturedAt: () => easyLevelCalibrationCapturedAt,
    checkInstallCalibration: () => checkAgainst(easyLevelCalibration),
    clearInstallCalibration() {
      easyLevelCalibration = null;
      easyLevelCalibrationCapturedAt = null;
      clearEasyLevelCalibration();
      updateIndicators();
    },
    getLastSampleAt: () => sensor.getLastSampleAt(),
    getRawTilt: () => diagnosticsRawTilt(),
    getCalibratedTilt: () => diagnosticsCalibratedTilt(),
    getActiveTargetName: () => activeTargetName(),
    getEasyLevelStatus: () => easyLevelSensor?.getStatus() ?? null,
    getSoundPrefs: () => ({
      soundOnLevel: settings.soundOnLevel,
      soundGuidance: settings.soundGuidance,
    }),
  };

  // Modern (screen-cleanup follow-up): the gear icon opens the Settings
  // page directly (General/Kalibrering/Vehicle/Ramps/Targets as tabs), never a
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

  // "?" opens its own Help/About/Feedback/Diagnostics tabbed page
  // (screen-cleanup follow-up), with the introduction relaunch at the top
  // of the Help tab — a fully independent page (universal, both
  // appearances), not a section of the ☰ Settings menu: sharing that
  // menu's history depth let its back button pop through to reveal the
  // Settings drawer underneath by mistake.
  const infoPage = createInfoPage({
    diagnostics: menuOptions,
    openOnboarding,
    hasCompletedOnboarding,
  });
  document.body.append(infoPage.element);
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  if (helpButton) infoPage.attach(helpButton);

  // External sensor (screen-cleanup follow-up): its own page, reached
  // only from the top-right sensor-status icon now that the ☰ menu no
  // longer carries an "External sensor" entry — universal, both
  // appearances. Omitted entirely without Web Bluetooth — never a
  // silently broken option (#116).
  const easyLevelSupported = isWebBluetoothSupported();
  const sensorPage = easyLevelSupported ? createSensorPage(menuOptions) : null;
  if (sensorPage) document.body.append(sensorPage.element);

  // Mute (#161): a single toggle for soundOnLevel + soundGuidance, reached
  // from the bottom bar without opening the menu. `preMuteSound` is the
  // exact prior values to restore on unmute — see domain/settings.ts's
  // toggleMute for why this is a pure, unit-tested function rather than
  // logic inlined here.
  let preMuteSound: SoundPrefs | null = null;
  const soundButton = document.querySelector<HTMLButtonElement>('#sound-button');
  const soundIconWaves = document.querySelector<SVGPathElement>('#sound-icon-waves');
  const soundIconMute = document.querySelector<SVGPathElement>('#sound-icon-mute');
  function updateSoundButton(): void {
    const muted = preMuteSound !== null;
    soundButton?.classList.toggle('bottombar__button--muted', muted);
    soundButton?.setAttribute(
      'aria-label',
      t(muted ? 'bottombar.sound.unmute' : 'bottombar.sound.mute'),
    );
    soundIconWaves?.toggleAttribute('hidden', muted);
    soundIconMute?.toggleAttribute('hidden', !muted);
  }
  soundButton?.addEventListener('click', () => {
    const result = toggleMute(settings, preMuteSound);
    settings = { ...settings, ...result.settings };
    preMuteSound = result.preMute;
    saveSettings(settings);
    // Unmuting is itself a real user gesture — the same unlock the
    // Settings-save path already performs when sound ends up on.
    if (settings.soundOnLevel || settings.soundGuidance) unlockAudio();
    updateSoundButton();
  });
  updateSoundButton();

  // Dashboard-style warning lamps. Demo mode presents as a configured
  // app (in memory only — nothing is written), so screenshots and demos
  // show the product, not the first-run warnings (#70).
  const indicators = createIndicators((section) => {
    if (isModern) {
      if (section === 'calibration') settingsPage!.openCalibration();
      else settingsPage!.open();
    } else {
      menu!.open(section);
    }
  });
  // Which pair of calibrations the amber lamp checks follows the ACTIVE
  // source (#131, ADR 0014), same as `zeroCalibration()` above: the
  // phone's sensor calibration + vehicle zero while the phone is active,
  // or just the EasyLevel installation offset while it is — never both
  // pairs at once, so connecting EasyLevel with no installation offset yet
  // still warns even if the phone was calibrated long ago, and vice versa.
  const updateIndicators = () =>
    indicators.update({
      settingsSaved: demo || hasStoredSettings(),
      calibrated:
        demo ||
        (sensor.getSource() === 'easylevel'
          ? easyLevelCalibration !== null
          : calibration !== null || vehicleCalibration !== null),
    });
  document.querySelector('#indicators')?.append(indicators.element);
  updateIndicators();

  // Target badge (#122, ADR 0013): the only main-screen trace of a
  // target preset — hidden whenever Normal (true level) is active, so
  // the normal case shows nothing extra. Tapping it jumps straight to
  // the Targets menu section (fast switching from the main screen).
  const targetBadge = createTargetBadge(() => {
    if (isModern) settingsPage!.openTargets();
    else menu!.open('targets');
  });
  document.querySelector('#indicators')?.append(targetBadge.element);
  const updateTargetBadge = () => {
    targetBadge.update(activeTargetName());
  };
  updateTargetBadge();

  // External-sensor status indicator (#129, screen-cleanup follow-up): the
  // only entry point to `sensorPage` now that the ☰ menu no longer
  // carries "External sensor" — visible whenever Web Bluetooth exists at
  // all, not just once connected (`sensorStatusIndicator.ts`).
  const sensorStatus = createSensorStatusIndicator(easyLevelSupported, () => sensorPage?.open());
  document.querySelector('#indicators')?.append(sensorStatus.element);
  const updateSensorStatus = () => sensorStatus.update(sensor.getSource(), sensor.getState());
  updateSensorStatus();

  function selectTargetNow(id: string | null): void {
    activeTargetId = id;
    saveActiveTargetId(id);
    updateTargetBadge();
  }

  /** Capture the current tilt, relative to the zero point (never to any
   * currently active preset), as a new named preset. */
  function addTargetPresetNow(name: string): string | null {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    const offset = presetOffsetFromReading(reading, zeroCalibration());
    if (offsetTooSteep(offset)) return t('targets.err.tooSteep');
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    targetPresets = [...targetPresets, { id, name, offset }];
    saveTargetPresets(targetPresets);
    return null;
  }

  function deleteTargetPresetNow(id: string): void {
    targetPresets = targetPresets.filter((preset) => preset.id !== id);
    saveTargetPresets(targetPresets);
    if (activeTargetId === id) selectTargetNow(null);
    else updateTargetBadge();
  }

  /** The active target preset's own name, or null for "Normal" — shared by
   * the main-screen badge and the diagnostics page (#133) so the two can
   * never disagree about what "effective target" means. */
  function activeTargetName(): string | null {
    return targetPresets.find((preset) => preset.id === activeTargetId)?.name ?? null;
  }

  /** Diagnostics page (#133, R36): raw (uncalibrated) roll/pitch, read
   * directly from the active sensor — never `readTiltNow()`, which starts
   * the sensor as a side effect when there is no reading yet; a passive
   * diagnostics refresh must never itself trigger a permission prompt. */
  function diagnosticsRawTilt(): Calibration | null {
    const gravity = sensor.getGravity();
    if (!gravity) return null;
    return {
      rollDeg: Math.atan2(gravity.x, gravity.z) * RAD_TO_DEG,
      pitchDeg: Math.atan2(gravity.y, gravity.z) * RAD_TO_DEG,
    };
  }

  /** Calibrated roll/pitch: the same effective calibration (sensor bias +
   * vehicle zero + active target, #122) the leveling math itself
   * subtracts — reused via `tiltFromGravity`, not recomputed. */
  function diagnosticsCalibratedTilt(): Calibration | null {
    const gravity = sensor.getGravity();
    if (!gravity) return null;
    const tilt = tiltFromGravity(gravity, effectiveCalibration());
    return { rollDeg: tilt.roll * RAD_TO_DEG, pitchDeg: tilt.pitch * RAD_TO_DEG };
  }

  // Shared by the menu and the onboarding wizard. Starting the sensor on
  // demand makes calibration work from the wizard before the main screen
  // (the tap itself is the iOS permission gesture).
  function readTiltNow(): Calibration | string {
    const gravity = sensor.getGravity();
    if (!gravity) {
      void sensor.start();
      return t('calibration.err.notRunning');
    }
    return {
      rollDeg: Math.atan2(gravity.x, gravity.z) * RAD_TO_DEG,
      pitchDeg: Math.atan2(gravity.y, gravity.z) * RAD_TO_DEG,
    };
  }

  function calibrateNow(): string | null {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    if (
      Math.abs(reading.rollDeg) > MAX_CALIBRATION_DEG ||
      Math.abs(reading.pitchDeg) > MAX_CALIBRATION_DEG
    ) {
      return t('calibration.err.notFlat');
    }
    calibration = reading;
    calibrationCapturedAt = Date.now();
    saveCalibration(calibration, undefined, calibrationCapturedAt);
    updateIndicators();
    return null;
  }

  /** How far off (degrees) the current reading is from a calibration's
   * promise of zero — the "check calibration" verdict text (#87). */
  function checkAgainst(offset: Calibration | null): string {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    const off = Math.max(
      Math.abs(reading.rollDeg - (offset?.rollDeg ?? 0)),
      Math.abs(reading.pitchDeg - (offset?.pitchDeg ?? 0)),
    );
    return off <= CALIBRATION_CHECK_GOOD_DEG
      ? t('calibration.check.good', { off: off.toFixed(1) })
      : t('calibration.check.off', { off: off.toFixed(1) });
  }

  function calibrateVehicleNow(): string | null {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    if (
      Math.abs(reading.rollDeg) > MAX_CALIBRATION_DEG ||
      Math.abs(reading.pitchDeg) > MAX_CALIBRATION_DEG
    ) {
      return t('calibration.vehicle.err.notFlat');
    }
    // Stored sensor-corrected: pure placement tilt, so it survives a
    // later sensor recalibration (ADR 0010).
    vehicleCalibration = vehicleZeroFromReading(reading, calibration);
    vehicleCalibrationCapturedAt = Date.now();
    saveVehicleCalibration(vehicleCalibration, undefined, vehicleCalibrationCapturedAt);
    updateIndicators();
    return null;
  }

  /** "Set vehicle level" for the EasyLevel box (#131, ADR 0014): the same
   * capture/validate/store flow as `calibrateVehicleNow` above, generalized
   * to this external source and kept in its own storage/state so the two
   * can never be conflated. There is no separate EasyLevel hardware-bias
   * layer to subtract (unlike the phone's `calibration`) — `null` here
   * simply means "none yet", the same shape `vehicleZeroFromReading`
   * already handles, so a future hardware-bias layer could subtract from
   * it without migrating anything already stored. */
  function calibrateEasyLevelNow(): string | null {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    if (
      Math.abs(reading.rollDeg) > MAX_CALIBRATION_DEG ||
      Math.abs(reading.pitchDeg) > MAX_CALIBRATION_DEG
    ) {
      return t('calibration.vehicle.err.notFlat');
    }
    easyLevelCalibration = vehicleZeroFromReading(reading, null);
    easyLevelCalibrationCapturedAt = Date.now();
    saveEasyLevelCalibration(easyLevelCalibration, undefined, easyLevelCalibrationCapturedAt);
    updateIndicators();
    return null;
  }

  const showMessage = (text: string) => {
    root.replaceChildren();
    const message = document.createElement('p');
    message.className = 'app__hint';
    message.textContent = text;
    root.append(message);
  };

  // A settings save can switch the vehicle type or change what the ramp
  // plan is computed from; the level screen is then rebuilt (dropping the
  // stabilizer's history so the new plan applies at once), and the
  // generation counter stops the superseded frame loop.
  const levelScreenKey = (s: LevelSettings) =>
    JSON.stringify([
      s.vehicleType,
      s.rearAxle,
      s.wheelbaseMm,
      s.trackWidthFrontMm,
      s.trackWidthRearMm,
      s.rampStepHeightsMm,
      s.rampCount,
      s.drainPosition,
      s.toleranceMm,
      // Modern's silhouette/wheel-card markup differs structurally from
      // Classic's on-diagram text (#106) — a saved appearance change
      // needs the same rebuild axle/vehicle-type changes already get.
      s.appearance,
    ]);
  let screenGeneration = 0;
  let screenKey: string | null = null;
  const maybeRebuildScreen = () => {
    if (screenKey !== null && screenKey !== levelScreenKey(settings)) showLevelScreen();
  };

  function showLevelScreen(): void {
    const generation = ++screenGeneration;
    screenKey = levelScreenKey(settings);
    root.replaceChildren();
    root.classList.add('app--level');

    // Always-visible status row: never empty, fixed height, so nothing
    // pops in and out while the user is watching the wheels.
    const status = document.createElement('p');
    status.className = 'status-line';
    status.setAttribute('aria-live', 'polite');
    const tilt = createTiltReadout();

    const waiting = document.createElement('p');
    waiting.className = 'app__hint';
    waiting.textContent = t('main.waiting');

    // Sensor unavailable fallback prompt (#134): the actionable form of
    // the plain "waiting" hint above, shown instead of it once the active
    // EasyLevel connection is unreachable (`isSensorUnavailable`,
    // `sensor/sensorFallback.ts`) — never both at once, see `frame()`.
    const fallbackPrompt = createSensorFallbackPrompt(
      () => void retryEasyLevelNow(),
      () => usePhoneSensorNow(),
    );

    // Full-screen confirmation shown briefly when level is reached (#124:
    // animated fade/scale, reduced-motion-aware — see levelOverlay.ts).
    const levelOverlay = createLevelOverlay();
    root.append(levelOverlay.element);

    // Vehicle engine (#72): compute → stabilize → render for the chosen
    // vehicle type, reporting what the celebration/re-arm logic needs.
    interface EngineTick {
      isLevel: boolean;
      maxCorrectionMm: number;
    }
    let engineElement: HTMLElement;
    let engineTick: (gravity: GravityVector, nowMs: number) => EngineTick;
    if (settings.vehicleType === 'caravan') {
      const diagram = createCaravanDiagram(settings.rearAxle);
      const stabilize = createCaravanStabilizer();
      const caravanStatusText = (result: ReturnType<typeof stabilize>): string => {
        if (result.isLevel) return t('main.level');
        const ramp = result.axle.left.severity !== 'none' || result.axle.right.severity !== 'none';
        const crank = result.jockey.direction !== 'ok';
        if (ramp && crank) return t('status.caravan.both');
        if (crank)
          return t(result.jockey.direction === 'up' ? 'status.crank.up' : 'status.crank.down');
        return t('status.one');
      };
      engineElement = diagram.element;
      engineTick = (gravity, nowMs) => {
        const result = stabilize(
          computeCaravanLeveling(gravity, settings, effectiveCalibration()),
          settings,
          nowMs,
        );
        diagram.update(result, settings.displayUnit, settings.rampStepHeightsMm);
        status.textContent = caravanStatusText(result);
        status.classList.toggle('status-line--level', result.isLevel);
        tilt.update(result);
        const maxAxleMm = Math.max(result.axle.left.displayMm, result.axle.right.displayMm);
        const jockeyMm = result.jockey.direction === 'ok' ? 0 : result.jockey.displayMm;
        return { isLevel: result.isLevel, maxCorrectionMm: Math.max(maxAxleMm, jockeyMm) };
      };
    } else {
      const diagram = createRvDiagram(settings.rearAxle, settings.appearance);
      const stabilize = createDisplayStabilizer();
      const statusText = (result: ReturnType<typeof stabilize>): string => {
        if (result.isLevel) return t('main.level');
        // Wheels the plan actually asks to drive up (#93) — a red wheel
        // without a step is one the owned ramps cannot serve.
        const toRaise = WHEEL_IDS.filter(
          (id) => result.wheels[id].stepMm > 0 && result.wheels[id].severity !== 'none',
        ).length;
        const maxMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
        if (maxMm <= settings.toleranceMm + 10) {
          return t('status.almost', {
            left: formatLength(Math.max(1, maxMm - settings.toleranceMm), settings.displayUnit),
          });
        }
        if (toRaise === 0) {
          const magnitude = deficitMagnitude(result.maxDeficitMm, settings.toleranceMm);
          return t(magnitude === 'close' ? 'status.cantLevel.close' : 'status.cantLevel.far');
        }
        return toRaise === 1 ? t('status.one') : t('status.many', { n: toRaise });
      };
      engineElement = diagram.element;
      engineTick = (gravity, nowMs) => {
        const result = stabilize(
          computeLeveling(gravity, settings, effectiveCalibration()),
          settings,
          nowMs,
        );
        diagram.update(result, settings.displayUnit, settings.rampStepHeightsMm);
        status.textContent = statusText(result);
        status.classList.toggle('status-line--level', result.isLevel);
        tilt.update(result);
        const maxMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
        return { isLevel: result.isLevel, maxCorrectionMm: maxMm };
      };
    }

    root.append(engineElement, status, tilt.element, waiting, fallbackPrompt.element);

    // Pose guard: wrong-pose overlay instead of wrong guidance (#51).
    const poseOverlay = document.createElement('div');
    poseOverlay.className = 'pose-overlay';
    poseOverlay.hidden = true;
    const poseText = document.createElement('p');
    poseText.className = 'pose-overlay__text';
    poseOverlay.append(poseText);
    root.append(poseOverlay);

    // Stale-data overlay (#132): a third, distinct state from the pose
    // overlay above and R25's "Measuring…" — there is no trustworthy data
    // at all (the active sensor has gone quiet, connected or not), so the
    // wheel/ramp guidance is hidden rather than left frozen mid-display.
    const staleOverlay = document.createElement('div');
    staleOverlay.className = 'stale-overlay';
    staleOverlay.hidden = true;
    const staleText = document.createElement('p');
    staleText.className = 'stale-overlay__text';
    staleText.textContent = t('stale.dataUnavailable');
    staleOverlay.append(staleText);
    root.append(staleOverlay);

    const detectPose = createPoseDetector();
    const landscape = window.matchMedia('(orientation: landscape)');
    // Rocking vehicle (people moving around): show "Measuring…" until the
    // reading has been calm for a moment (#86); the diagram itself stays
    // at full opacity — the status text is enough (#96).
    const isStill = createStillnessDetector();

    let wasLevel = false;
    // Celebration arming (field feedback, twice): the vibration + overlay
    // fire once per actual leveling. The trigger re-arms only after the
    // vehicle has been CLEARLY un-level — well past the tolerance, and
    // sustained — so jitter at the boundary can never celebrate again,
    // no matter how long the vehicle parks right on the edge.
    let celebrateArmed = false;
    let clearlyUnlevelSince: number | null = null;
    let lastCelebrate = -Infinity;
    const REARM_MARGIN_MM = 15;
    const REARM_SUSTAIN_MS = 3000;
    const CELEBRATE_COOLDOWN_MS = 20000;

    // Continuous audio guidance (#121, opt-in): pulse rate/pitch track the
    // STABILIZED maxCorrectionMm the engine already produces — never a raw
    // reading. The guidance state is still fed every frame (so its own
    // direction hysteresis keeps working smoothly), but a pulse is only
    // actually scheduled while still (R25) and the setting is on.
    const guideAudio = createAudioGuidance();
    let lastGuidancePulseAt = -Infinity;

    const celebrate = () => {
      if (!celebrateArmed || document.visibilityState !== 'visible') return;
      const now = performance.now();
      if (now - lastCelebrate < CELEBRATE_COOLDOWN_MS) return;
      celebrateArmed = false;
      lastCelebrate = now;
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      if (settings.soundOnLevel) playChime();
      levelOverlay.celebrate();
    };

    const frame = () => {
      // A rebuilt screen (vehicle type change) owns the loop from here.
      if (generation !== screenGeneration) return;
      // Refreshed every frame (#129), including while the menu is open
      // (see below) — a lost EasyLevel connection is only ever observed
      // by polling `getState()` (Web Bluetooth's `gattserverdisconnected`
      // has no separate callback into this module), the same way the
      // "waiting" hint below already discovers it.
      updateSensorStatus();
      // Settings, info page, sensor page, or wizard open: the user is
      // reading, phone in hand — no pose nagging, no overlays, no
      // celebration until they are back.
      if (isMenuOpen() || infoPage.isOpen() || (sensorPage?.isOpen() ?? false) || onboardingOpen) {
        poseOverlay.hidden = true;
        staleOverlay.hidden = true;
        fallbackPrompt.update(false);
        levelOverlay.hideNow();
        requestAnimationFrame(frame);
        return;
      }
      const gravity = sensor.getGravity();
      if (!gravity) {
        // No reading yet — or, for an external source (#116), no longer:
        // an EasyLevel disconnect clears `getGravity()` back to null after
        // readings were already flowing. Either way, say so instead of
        // freezing the diagram on its last frame (#116's acceptance
        // criteria) — this hint was already the "waiting for the very
        // first reading" case.
        //
        // Unreachable EasyLevel (#134) gets the actionable Retry/"Use
        // phone sensor" prompt instead of the plain text — never both at
        // once. Every other case here (first load, still connecting) is
        // unchanged: the plain "waiting for the tilt sensor" hint.
        const unavailable = isSensorUnavailable(sensor.getState());
        fallbackPrompt.update(unavailable);
        waiting.hidden = unavailable;
        if (!unavailable) waiting.textContent = t('main.waiting');
      } else {
        waiting.hidden = true;
        fallbackPrompt.update(false);
        const now = performance.now();
        // Stale data (#132): the sensor still reports a reading, but it
        // hasn't refreshed in a while — a BLE box whose notifications
        // silently stopped while the GATT link stayed "connected", or a
        // phone sensor stalled by tab backgrounding/OS throttling. Checked
        // before the pose guard below: a reading old enough to be untrusted
        // isn't safe to judge the pose from either, and the two overlays
        // must never both fight for the screen at once.
        const staleTimeoutMs =
          sensor.getSource() === 'easylevel' ? STALE_TIMEOUT_EASYLEVEL_MS : STALE_TIMEOUT_PHONE_MS;
        if (isSensorStale(sensor.getLastSampleAt(), now, staleTimeoutMs)) {
          staleOverlay.hidden = false;
          poseOverlay.hidden = true;
          levelOverlay.hideNow();
          requestAnimationFrame(frame);
          return;
        }
        staleOverlay.hidden = true;
        // Invalid pose: pause the guidance and say what to do instead.
        const badPose = detectPose(gravity) === 'not-flat';
        if (badPose || landscape.matches) {
          poseText.textContent = badPose ? t('pose.layFlat') : t('pose.portrait');
          poseOverlay.hidden = false;
          levelOverlay.hideNow();
          requestAnimationFrame(frame);
          return;
        }
        poseOverlay.hidden = true;
        const tilt = tiltFromGravity(gravity, null);
        const still = isStill((tilt.roll * 180) / Math.PI, (tilt.pitch * 180) / Math.PI, now);
        const { isLevel, maxCorrectionMm } = engineTick(gravity, now);
        if (!still) {
          // Momentary readings are meaningless while the vehicle rocks —
          // say so instead of flickering advice, and never celebrate.
          status.textContent = t('status.measuring');
          status.classList.remove('status-line--level');
        }
        if (still && isLevel && !wasLevel) celebrate();
        if (!isLevel) levelOverlay.hideNow();
        wasLevel = isLevel;
        const guidance = guideAudio(maxCorrectionMm, isLevel, settings, now);
        if (
          settings.soundGuidance &&
          still &&
          guidance.pulseIntervalMs !== null &&
          guidance.pitchHz !== null &&
          now - lastGuidancePulseAt >= guidance.pulseIntervalMs
        ) {
          playGuidancePulse(guidance.pitchHz, guidance.direction);
          lastGuidancePulseAt = now;
        }
        // Re-arm the celebration only once clearly un-level, sustained.
        if (!isLevel && maxCorrectionMm > settings.toleranceMm + REARM_MARGIN_MM) {
          clearlyUnlevelSince ??= now;
          if (now - clearlyUnlevelSince >= REARM_SUSTAIN_MS) celebrateArmed = true;
        } else {
          clearlyUnlevelSince = null;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const handleState = (state: SensorState) => {
    switch (state) {
      case 'granted':
        showLevelScreen();
        break;
      case 'denied':
        showMessage(t('main.denied'));
        break;
      default:
        showMessage(window.isSecureContext ? t('main.noSensors') : t('main.https'));
    }
  };

  if (!demo && !hasSeenOnboarding()) openOnboarding();

  if (demo) {
    showLevelScreen();
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
        void sensor.start().then(handleState);
      });
      root.append(hint, start);
    } else {
      void sensor.start().then(handleState);
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
  void attemptEasyLevelAutoReconnect().then((tookOver) => {
    if (!tookOver) startDefaultSensorFlow();
  });
}
