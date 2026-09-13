import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { setupShareButton } from './ui/share';
import { shareVehicleSetup, takePendingVehicleSetupCode } from './ui/vehicleShare';
import { showIncomingVehicleSetup } from './ui/incomingVehicleSetup';
import { showToast } from './ui/toast';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling, tiltFromGravity, WHEEL_IDS, type GravityVector } from './domain/leveling';
import { computeCaravanLeveling, createCaravanStabilizer } from './domain/caravan';
import { combineCalibrations, vehicleZeroFromReading } from './domain/calibration';
import { createStillnessDetector } from './domain/stillness';
import { createDisplayStabilizer } from './domain/stability';
import { isSensorStale, STALE_TIMEOUT_PHONE_MS } from './domain/staleness';
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
  easyLevelSettings,
  formatLength,
  MAX_EASYLEVEL_CONNECT_DELAY_MS,
  toggleMute,
  withEasyLevelSettings,
  type Calibration,
  type EasyLevelMounting,
  SENSOR_SOURCES,
  type LevelSettings,
  type SensorSource,
  type SoundPrefs,
} from './domain/settings';
import {
  applyVehicleGeometry,
  decodeVehicleGeometry,
  pickVehicleGeometry,
} from './domain/vehicleShare';
import {
  clearCalibration,
  clearInstallCalibration,
  clearVehicleCalibration,
  hasDoneOnboarding,
  hasSeenOnboarding,
  hasStoredSettings,
  loadActiveTargetId,
  loadCalibrationInfo,
  loadInstallCalibrationInfo,
  type StoredCalibration,
  migrateLegacyInstallCalibration,
  loadLanguage,
  loadSettings,
  loadTargetPresets,
  loadVehicleCalibrationInfo,
  markOnboardingDone,
  markOnboardingSeen,
  saveActiveTargetId,
  saveCalibration,
  saveInstallCalibration,
  saveSettings,
  saveTargetPresets,
  saveVehicleCalibration,
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
import {
  availableExternalSensors,
  externalSensorById,
  hasAvailableExternalSensor,
  type ExternalSensorDescriptor,
  type ExternalSensorHealth,
} from './sensor/externalSensors';
import {
  createEasyLevelSensor,
  EASYLEVEL_DESCRIPTOR,
  createWebBluetoothTransport,
  type EasyLevelSensor,
} from './sensor/easyLevelSensor';
import {
  createXparkleSensor,
  createXparkleTransport,
  type XparkleSensor,
} from './sensor/xparkleSensor';
import { isRememberedXparkleDeviceUsable } from './sensor/xparkleSimulator';
import {
  createSimulatedEasyLevelTransport,
  easyLevelSimulationMode,
  isRememberedEasyLevelDeviceUsable,
} from './sensor/easyLevelSimulator';
import { isSensorUnavailable } from './sensor/sensorFallback';
import { createExternalSensorController } from './sensor/externalSensorController';
import { createRvDiagram } from './ui/rvDiagram';
import { createTiltReadout } from './ui/tiltReadout';
import { createMenu, type Menu } from './ui/menu';
import { createSettingsPage, type SettingsPage } from './ui/settingsPage';
import { createInfoPage } from './ui/infoMenu';
import { createSensorPage, type ExternalSensorPage } from './ui/sensorPage';
import { createIosSensorGuidePage } from './ui/iosSensorGuidePage';
import { isIos } from './ui/platform';
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

  // External-sensor storage moved from device-named keys to per-source
  // ones (#263, ADR 0016). Both copies run before anything reads either
  // value, exactly once each (they carry their own markers), and never
  // overwrite or resurrect anything — see the two functions for why the
  // legacy keys are copied rather than moved.
  migrateLegacyInstallCalibration();
  migrateLegacyRememberedDeviceId();

  // Incoming "share vehicle setup" link (R41, #207): consumed off the URL
  // immediately (clears the fragment) so a later refresh never re-prompts;
  // decoded and actually shown further down, once `updateIndicators` and
  // `maybeRebuildScreen` exist to react to an applied setup.
  const pendingVehicleSetupCode = takePendingVehicleSetupCode();

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
  // One per external source (#263/#272): each box sits in its own place in
  // the vehicle, so two sources can never share a value — ADR 0014's
  // "never conflate" rule, held here the same way it is held in storage.
  const installOffsets = new Map<SensorSource, StoredCalibration | null>(
    SENSOR_SOURCES.filter((source) => source !== 'phone').map((source) => [
      source,
      loadInstallCalibrationInfo(source),
    ]),
  );
  const installOffsetOf = (source: SensorSource) => installOffsets.get(source)?.value ?? null;
  const activeInstallOffset = () => installOffsetOf(sensor().getSource());
  // The two-layer calibration sum — what "level" means, untouched by
  // target presets below (#122, ADR 0013). Selected per the ACTIVE sensor
  // source (#131, ADR 0014): each source supplies its own sensor-bias/
  // installation-offset pair, so switching sources never mixes one
  // source's calibration into the other's readings.
  const zeroCalibration = () =>
    sensor().getSource() === 'phone'
      ? combineCalibrations(calibration, vehicleCalibration)
      : activeInstallOffset();
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
  const phoneSensor = demo ? createDemoSensor() : createOrientationSensor();
  /**
   * The source feeding readings right now — the ONE injection point (#128,
   * ADR 0014). Read fresh on every use rather than cached in a binding
   * (#265): the controller below owns the switch, so a connect or a
   * fallback takes effect on the very next animation frame with nothing
   * here to keep in sync.
   */
  const sensor = (): OrientationSensor => externalSensors.getActiveSensor();
  /**
   * Mounting orientation (#217), set from the External sensor page — an
   * ordinary persisted setting (unlike `setEasyLevelConnectDelay` below,
   * this is not a debug-only field), but set directly here rather than
   * through the Settings page's own Save/Undo/Reset flow, matching how the
   * install-offset calibration right next to it on that same page already
   * behaves.
   */
  function setEasyLevelMounting(mounting: EasyLevelMounting): void {
    settings = withEasyLevelSettings(settings, { mounting });
    saveSettings(settings);
  }

  /**
   * Debug hardware-compatibility workaround (#212), set from the EasyLevel
   * status page's debug disclosure — not a normal settings-form field, so
   * it is persisted directly here rather than through the Settings page's
   * own save flow. The transport factory below reads `settings` live, so
   * this takes effect on the very next connect attempt with no further
   * wiring needed.
   */
  function setEasyLevelConnectDelay(enabled: boolean, ms: number): void {
    // Clamped here, not just trusted from the UI's own <input> bounds
    // (#212): a value written straight into `settings` bypasses
    // `parseSettings`'s own clamp until the next reload, so this call is
    // the only guard until then.
    const clampedMs = Math.min(MAX_EASYLEVEL_CONNECT_DELAY_MS, Math.max(0, Math.round(ms) || 0));
    settings = withEasyLevelSettings(settings, {
      connectDelayEnabled: enabled,
      connectDelayMs: clampedMs,
    });
    saveSettings(settings);
  }

  /**
   * Build the adapter for an external source (#265): the one place a
   * source id becomes a live adapter. Reads `settings` live on every
   * connect rather than capturing values once, so the debug connect delay
   * (#212) and the mounting orientation (#217) both take effect on the
   * very next attempt without recreating anything.
   */
  function createExternalSensor(source: SensorSource): LibellExternalSensor | null {
    if (source === 'xparkle') return createXparkleSensor(createXparkleTransport());
    if (source !== 'easylevel') return null;
    // Simulated box (#220): the `?easylevel-sim` flag swaps the transport
    // at this one seam — everything above it (sensor state machine,
    // calibration, UI) is exactly the code a real box runs through, and
    // the real Web Bluetooth transport is never even constructed.
    const simulation = easyLevelSimulationMode();
    const transport =
      simulation !== 'off'
        ? createSimulatedEasyLevelTransport(simulation)
        : createWebBluetoothTransport(() => {
            const device = easyLevelSettings(settings);
            return device.connectDelayEnabled ? device.connectDelayMs : 0;
          });
    return createEasyLevelSensor(transport, () => easyLevelSettings(settings).mounting);
  }

  /**
   * A source's health in the shape the UI renders (#268): each adapter's
   * own protocol struct is mapped here, so no UI module ever imports a
   * protocol. A field left null reads as "nothing has arrived yet"; a
   * field the device does not have at all is excluded by its descriptor's
   * capabilities instead, so no row is drawn for it.
   */
  function healthOf(source: SensorSource): ExternalSensorHealth | null {
    const sensor = externalSensors.getSensor(source);
    if (!sensor) return null;
    if (source === 'easylevel') {
      const status = (sensor as EasyLevelSensor).getStatus();
      return status
        ? {
            batteryPercent: status.batteryPercent,
            temperatureCelsius: status.temperatureCelsius,
            firmwareLabel: String(status.firmwareTier),
          }
        : null;
    }
    if (source === 'xparkle') {
      // This box reports battery and nothing else; its descriptor says so,
      // so no temperature or firmware row is drawn to be left empty.
      const reading = (sensor as XparkleSensor).getReading();
      return reading
        ? { batteryPercent: reading.batteryPercent, temperatureCelsius: null, firmwareLabel: null }
        : null;
    }
    return null;
  }

  /**
   * A short, actionable line about why a source is not working, or null
   * (#272). Today the one case is the Xparkle box rejecting its password:
   * without this the user would see the ordinary "could not connect" and
   * have no way to know the box is fine and the password is not.
   */
  function sensorNoteFor(source: SensorSource): string | null {
    if (source !== 'xparkle') return null;
    const sensor = externalSensors.getSensor('xparkle');
    return sensor && (sensor as XparkleSensor).isPasswordRejected()
      ? t('sensorSource.err.password')
      : null;
  }

  /**
   * Every adapter this build can construct. A union rather than the bare
   * `ExternalSensor` so `healthOf` above can reach each one's own extras
   * after narrowing on the source it asked for — the casts are safe
   * because `createExternalSensor` is the only thing that ever builds
   * these, one branch per source.
   */
  type LibellExternalSensor = EasyLevelSensor | XparkleSensor;

  /**
   * The external-sensor lifecycle (#265) — connect, disconnect, the silent
   * auto-reconnect at open (#130), the background auto-retry (#211) and
   * the "use phone sensor" escape hatch (#134) all live in one place now,
   * for every source rather than one device. `main.ts` keeps only the
   * wiring: which screen to build, and which indicators to refresh.
   */
  const externalSensors = createExternalSensorController<LibellExternalSensor>({
    phoneSensor,
    createSensor: createExternalSensor,
    loadDeviceId: loadRememberedDeviceId,
    saveDeviceId: saveRememberedDeviceId,
    isRememberedDeviceUsable: (source: SensorSource, deviceId: string) =>
      source === 'xparkle'
        ? isRememberedXparkleDeviceUsable(deviceId)
        : isRememberedEasyLevelDeviceUsable(deviceId),
    getPreferredSource: () => settings.sensorSource,
    rememberSource: (source) => {
      settings = { ...settings, sensorSource: source };
      saveSettings(settings);
    },
    // The level screen may never have been built yet (e.g. a desktop
    // without phone motion sensors) — build it now that a real source is
    // feeding readings; harmless to rebuild if it already exists.
    onLevelScreenNeeded: () => showLevelScreen(),
    // The amber calibration lamp checks whichever source is active (#131),
    // so switching source alone still has to refresh it.
    onIndicatorsChanged: () => updateIndicators(),
    onStatusChanged: () => updateSensorStatus(),
  });

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
      getSensorSource: () => sensor().getSource(),
      getSensorState: () => sensor().getState(),
      // The onboarding wizard offers one external source; #268's list
      // page is where more than one becomes visible.
      sensor: EASYLEVEL_DESCRIPTOR,
      // With more than one box available the wizard offers them all
      // rather than picking one for the user (#272).
      sensorOptionsFor: (descriptor: ExternalSensorDescriptor) => ({
        ...menuOptions,
        sensor: descriptor,
        connectSensor: () => externalSensors.connect(descriptor.id),
        disconnectSensor: () => externalSensors.disconnect(),
        getSensorNote: () => sensorNoteFor(descriptor.id),
        getInstallCalibration: () => installOffsetOf(descriptor.id),
        calibrateInstall: () => calibrateInstallNow(descriptor.id),
        getInstallCalibrationCapturedAt: () =>
          installOffsets.get(descriptor.id)?.capturedAt ?? null,
        checkInstallCalibration: () => checkAgainst(installOffsetOf(descriptor.id)),
        clearInstallCalibration: () => clearInstallOffset(descriptor.id),
      }),
      connectSensor: () => externalSensors.connect('easylevel'),
      disconnectSensor: () => externalSensors.disconnect(),
      getInstallCalibration: () => installOffsetOf('easylevel'),
      calibrateInstall: () => calibrateInstallNow('easylevel'),
      getInstallCalibrationCapturedAt: () => installOffsets.get('easylevel')?.capturedAt ?? null,
      checkInstallCalibration: () => checkAgainst(installOffsetOf('easylevel')),
      clearInstallCalibration: () => clearInstallOffset('easylevel'),
      getMounting: () => easyLevelSettings(settings).mounting,
      setMounting: (mounting: EasyLevelMounting) => setEasyLevelMounting(mounting),
      onFinished(done) {
        onboardingOpen = false;
        markOnboardingSeen();
        if (done) markOnboardingDone();
        updateIndicators();
      },
    });
  };

  // Shared options bag (#screen-cleanup follow-up): every field the ☰
  // Classic menu, the Modern Settings page, and the External sensor page
  // (including its nested status/debug page) each need — reused as-is by
  // whichever of those get constructed below, never duplicated.
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
    getSensorSource: () => sensor().getSource(),
    getSensorState: () => sensor().getState(),
    sensor: EASYLEVEL_DESCRIPTOR,
    connectSensor: () => externalSensors.connect('easylevel'),
    disconnectSensor: () => externalSensors.disconnect(),
    getInstallCalibration: () => installOffsetOf('easylevel'),
    calibrateInstall: () => calibrateInstallNow('easylevel'),
    getInstallCalibrationCapturedAt: () => installOffsets.get('easylevel')?.capturedAt ?? null,
    checkInstallCalibration: () => checkAgainst(installOffsetOf('easylevel')),
    clearInstallCalibration: () => clearInstallOffset('easylevel'),
    getMounting: () => easyLevelSettings(settings).mounting,
    setMounting: (mounting: EasyLevelMounting) => setEasyLevelMounting(mounting),
    getCalibratedTilt: () => calibratedTiltNow(),
    getActiveTargetName: () => activeTargetName(),
    getHealth: () => healthOf('easylevel'),
    getEasyLevelDeviceId: () => externalSensors.getSensor('easylevel')?.getDeviceId() ?? null,
    getEasyLevelLastSampleAt: () =>
      externalSensors.getSensor('easylevel')?.getLastSampleAt() ?? null,
    getEasyLevelRawAccel: () => externalSensors.getSensor('easylevel')?.getGravity() ?? null,
    // Raw status bytes are EasyLevel's own debug surface, gated by its
    // descriptor's `debugBytes` capability (#268) — a source without them
    // never draws the row.
    getEasyLevelStatusBytes: () => {
      const sensor = externalSensors.getSensor('easylevel');
      return sensor && sensor.getSource() === 'easylevel'
        ? (sensor as EasyLevelSensor).getStatusBytes()
        : null;
    },
    getEasyLevelConnectDelay: () => ({
      enabled: easyLevelSettings(settings).connectDelayEnabled,
      ms: easyLevelSettings(settings).connectDelayMs,
    }),
    setEasyLevelConnectDelay: (enabled: boolean, ms: number) =>
      setEasyLevelConnectDelay(enabled, ms),
    getSoundPrefs: () => ({
      soundOnLevel: settings.soundOnLevel,
      soundGuidance: settings.soundGuidance,
    }),
    onShareVehicleSetup: (current: LevelSettings) => {
      void shareVehicleSetup(pickVehicleGeometry(current));
    },
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

  // "?" opens its own Help/About/Feedback tabbed page (screen-cleanup
  // follow-up), with the introduction relaunch at the top of the Help tab
  // — a fully independent page (universal, both appearances), not a
  // section of the ☰ Settings menu: sharing that menu's history depth let
  // its back button pop through to reveal the Settings drawer underneath
  // by mistake.
  const infoPage = createInfoPage({ openOnboarding, hasDoneOnboarding });
  document.body.append(infoPage.element);
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  if (helpButton) infoPage.attach(helpButton);

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
      createSensorPage(availableExternalSensors(), (descriptor) => ({
        ...menuOptions,
        sensor: descriptor,
        connectSensor: () => externalSensors.connect(descriptor.id),
        disconnectSensor: () => externalSensors.disconnect(),
        getHealth: () => healthOf(descriptor.id),
        getSensorNote: () => sensorNoteFor(descriptor.id),
        // Each source's installation offset is its own (#263): where one
        // box is bolted in says nothing about where another is.
        getInstallCalibration: () => installOffsetOf(descriptor.id),
        calibrateInstall: () => calibrateInstallNow(descriptor.id),
        getInstallCalibrationCapturedAt: () =>
          installOffsets.get(descriptor.id)?.capturedAt ?? null,
        checkInstallCalibration: () => checkAgainst(installOffsetOf(descriptor.id)),
        clearInstallCalibration: () => clearInstallOffset(descriptor.id),
      }))
    : null;
  const sensorPage = externalSensorPage ?? (showIosGuide ? createIosSensorGuidePage() : null);
  if (sensorPage) document.body.append(sensorPage.element);
  // Attached after `sensorPage.element` (see `sensorPage.ts`'s doc
  // comment): a device page must paint on top of the External sensor list
  // page when both happen to be open at once.
  if (externalSensorPage) document.body.append(...externalSensorPage.statusElements);

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
        (sensor().getSource() === 'phone'
          ? calibration !== null || vehicleCalibration !== null
          : activeInstallOffset() !== null),
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
  const sensorStatus = createSensorStatusIndicator(externalSensorSupported, showIosGuide, () =>
    sensorPage?.open(),
  );
  // Into the pinned top-bar corner — not the #indicators cluster — so the
  // icon and the Install button beside it always own the top-right
  // corner and the other top-bar items wrap or shift left of them (#244).
  document.querySelector('#sensor-slot')?.append(sensorStatus.element);
  syncTopbarCorner();
  const updateSensorStatus = () => sensorStatus.update(sensor().getSource(), sensor().getState());
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
   * the main-screen badge and the Targets section so the two can never
   * disagree about what "effective target" means. */
  function activeTargetName(): string | null {
    return targetPresets.find((preset) => preset.id === activeTargetId)?.name ?? null;
  }

  /** The sensor status page's live reading row (`easyLevelStatusPage.ts`):
   * the same effective calibration (sensor bias + vehicle zero + active
   * target, #122) the leveling math itself subtracts — reused via
   * `tiltFromGravity`, not recomputed. Never `readTiltNow()`, which starts
   * the sensor as a side effect when there is no reading yet; a passive
   * status-page refresh must never itself trigger a permission prompt. */
  function calibratedTiltNow(): Calibration | null {
    const gravity = sensor().getGravity();
    if (!gravity) return null;
    const tilt = tiltFromGravity(gravity, effectiveCalibration());
    return { rollDeg: tilt.roll * RAD_TO_DEG, pitchDeg: tilt.pitch * RAD_TO_DEG };
  }

  // Shared by the menu and the onboarding wizard. Starting the sensor on
  // demand makes calibration work from the wizard before the main screen
  // (the tap itself is the iOS permission gesture).
  function readTiltNow(): Calibration | string {
    const gravity = sensor().getGravity();
    if (!gravity) {
      void sensor().start();
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
  function calibrateInstallNow(source: SensorSource): string | null {
    const reading = readTiltNow();
    if (typeof reading === 'string') return reading;
    if (
      Math.abs(reading.rollDeg) > MAX_CALIBRATION_DEG ||
      Math.abs(reading.pitchDeg) > MAX_CALIBRATION_DEG
    ) {
      return t('calibration.vehicle.err.notFlat');
    }
    const value = vehicleZeroFromReading(reading, null);
    const capturedAt = Date.now();
    installOffsets.set(source, { value, capturedAt });
    saveInstallCalibration(source, value, undefined, capturedAt);
    updateIndicators();
    return null;
  }

  function clearInstallOffset(source: SensorSource): void {
    installOffsets.set(source, null);
    clearInstallCalibration(source);
    updateIndicators();
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

    // The status row now speaks only when it has something the diagram
    // cannot show (#252): "2 wheels to raise" and "level!" were the
    // diagram's own wheel cards written out in words, so they are gone and
    // the row is empty most of the time. What it still says — readings
    // that cannot be trusted, ramps that do not reach and by how much, how
    // little is left — has no icon, so it appears when it applies and the
    // row hides itself otherwise rather than holding a blank line.
    const status = document.createElement('p');
    status.className = 'status-line';
    status.setAttribute('aria-live', 'polite');
    const setStatus = (text: string): void => {
      status.textContent = text;
      status.hidden = text === '';
    };
    setStatus('');
    const tilt = createTiltReadout();

    const waiting = document.createElement('p');
    waiting.className = 'app__hint';
    waiting.textContent = t('main.waiting');

    // Sensor unavailable fallback prompt (#134): the actionable form of
    // the plain "waiting" hint above, shown instead of it once the active
    // EasyLevel connection is unreachable (`isSensorUnavailable`,
    // `sensor/sensorFallback.ts`) — never both at once, see `frame()`.
    const fallbackPrompt = createSensorFallbackPrompt(
      () => void externalSensors.retry(),
      () => externalSensors.usePhoneSensor(),
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
      // Nothing left to say here (#252): the caravan diagram draws the
      // jockey wheel's direction, its action and its amount inside the
      // drawing itself, and the axle wheels carry their own severity — so
      // every message this used to produce was the picture in words. The
      // "measuring" warning below is set on the row directly and is
      // unaffected.
      const caravanStatusText = (): string => '';
      engineElement = diagram.element;
      engineTick = (gravity, nowMs) => {
        const result = stabilize(
          computeCaravanLeveling(gravity, settings, effectiveCalibration()),
          settings,
          nowMs,
        );
        diagram.update(result, settings.displayUnit, settings.rampStepHeightsMm);
        setStatus(caravanStatusText());
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
        // Level, and which wheels to raise, are what the wheel cards say —
        // in colour, glyph and step number, per wheel (#252). Saying it
        // again in a sentence added nothing but a line.
        if (result.isLevel) return '';
        const maxMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
        // How little is left, and whether the ramps reach at all, are the
        // two things no wheel card can show: a grey wheel says the ramps
        // do not reach, never by how much.
        if (maxMm <= settings.toleranceMm + 10) {
          return t('status.almost', {
            left: formatLength(Math.max(1, maxMm - settings.toleranceMm), settings.displayUnit),
          });
        }
        // Wheels the plan actually asks to drive up (#93) — a red wheel
        // without a step is one the owned ramps cannot serve.
        const toRaise = WHEEL_IDS.filter(
          (id) => result.wheels[id].stepMm > 0 && result.wheels[id].severity !== 'none',
        ).length;
        if (toRaise === 0) {
          const magnitude = deficitMagnitude(result.maxDeficitMm, settings.toleranceMm);
          return t(magnitude === 'close' ? 'status.cantLevel.close' : 'status.cantLevel.far');
        }
        return '';
      };
      engineElement = diagram.element;
      engineTick = (gravity, nowMs) => {
        const result = stabilize(
          computeLeveling(gravity, settings, effectiveCalibration()),
          settings,
          nowMs,
        );
        diagram.update(result, settings.displayUnit, settings.rampStepHeightsMm);
        setStatus(statusText(result));
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
      // Live battery/temperature/reading on the sensor status page
      // (screen-cleanup follow-up to #133/#129): same "every frame,
      // regardless of what's open" discipline as `updateSensorStatus()`
      // above — `refreshLive()` itself is the no-op guard when that page
      // isn't the one currently open.
      externalSensorPage?.refreshLive();
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
      const gravity = sensor().getGravity();
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
        const unavailable = isSensorUnavailable(sensor().getState());
        fallbackPrompt.update(unavailable);
        waiting.hidden = unavailable;
        if (unavailable) {
          // Background auto-retry (#211) — see `maybeAutoRetryEasyLevel`.
          externalSensors.maybeAutoRetry(performance.now());
        } else {
          waiting.textContent = t('main.waiting');
          // Reset so a *later* disconnect retries immediately rather than
          // waiting out a stale interval left over from this one.
        }
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
        // Each external source declares its own timeout (#266); the phone
        // is not an external source and keeps the domain layer's own.
        const staleTimeoutMs =
          externalSensorById(sensor().getSource())?.staleTimeoutMs ?? STALE_TIMEOUT_PHONE_MS;
        if (isSensorStale(sensor().getLastSampleAt(), now, staleTimeoutMs)) {
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
          setStatus(t('status.measuring'));
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
        updateIndicators();
        maybeRebuildScreen();
      },
      onDismiss: () => {
        // Nothing to do — the link is already consumed off the URL.
      },
    });
  } else if (!demo && !hasSeenOnboarding()) {
    openOnboarding();
  }

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
