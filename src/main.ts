import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { setupShareButton } from './ui/share';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling, tiltFromGravity, WHEEL_IDS, type GravityVector } from './domain/leveling';
import { computeCaravanLeveling, createCaravanStabilizer } from './domain/caravan';
import { combineCalibrations, vehicleZeroFromReading } from './domain/calibration';
import { createStillnessDetector } from './domain/stillness';
import { createDisplayStabilizer } from './domain/stability';
import { createAudioGuidance, type GuidanceDirection } from './domain/audioGuidance';
import {
  offsetTooSteep,
  presetOffsetFromReading,
  targetOffsetFor,
  type TargetPreset,
} from './domain/targetPresets';
import { createCaravanDiagram } from './ui/caravanDiagram';
import { createPoseDetector } from './domain/pose';
import { formatLength, type Calibration, type LevelSettings } from './domain/settings';
import {
  clearCalibration,
  clearVehicleCalibration,
  hasSeenOnboarding,
  hasStoredSettings,
  loadActiveTargetId,
  loadCalibrationInfo,
  loadLanguage,
  loadSettings,
  loadTargetPresets,
  loadVehicleCalibrationInfo,
  markOnboardingSeen,
  saveActiveTargetId,
  saveCalibration,
  saveTargetPresets,
  saveVehicleCalibration,
} from './data/settingsStore';
import {
  createOrientationSensor,
  isSensorSupported,
  needsPermissionGesture,
  type SensorState,
} from './sensor/orientation';
import { createRvDiagram } from './ui/rvDiagram';
import { createTiltReadout } from './ui/tiltReadout';
import { createMenu } from './ui/menu';
import { createTargetBadge } from './ui/targetBadge';
import { applyAppearance, applyTheme, followSystemTheme } from './ui/theme';
import { createIndicators } from './ui/indicators';
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
const menuButtonEl = document.querySelector<HTMLButtonElement>('#menu-button');
if (menuButtonEl) menuButtonEl.setAttribute('aria-label', t('topbar.menu'));
if (installHint) installHint.textContent = t('install.hint');

const versionFooter = document.querySelector<HTMLElement>('#app-version');
if (versionFooter && __APP_VERSION__) {
  versionFooter.textContent = `v${__APP_VERSION__}`;
}

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  bootstrap(app);
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
  // The two-layer calibration sum — what "level" means, untouched by
  // target presets below (#122, ADR 0013).
  const zeroCalibration = () => combineCalibrations(calibration, vehicleCalibration);
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
  const sensor = demo ? createDemoSensor() : createOrientationSensor();

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
      onFinished() {
        onboardingOpen = false;
        markOnboardingSeen();
        updateIndicators();
      },
    });
  };

  // Menu (hamburger) with Settings / Calibration / Help.
  const menu = createMenu({
    initialSettings: settings,
    appearance: settings.appearance,
    openOnboarding,
    hasSavedSettings: () => demo || hasStoredSettings(),
    onSettingsSaved(next) {
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
    getTargetPresets: () => targetPresets,
    getActiveTargetId: () => activeTargetId,
    selectTarget: (id) => selectTargetNow(id),
    addTargetPreset: (name) => addTargetPresetNow(name),
    deleteTargetPreset: (id) => deleteTargetPresetNow(id),
  });
  document.body.append(menu.element);
  const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
  if (menuButton) menu.attach(menuButton);

  // Dashboard-style warning lamps. Demo mode presents as a configured
  // app (in memory only — nothing is written), so screenshots and demos
  // show the product, not the first-run warnings (#70).
  const indicators = createIndicators((section) => menu.open(section));
  const updateIndicators = () =>
    indicators.update({
      settingsSaved: demo || hasStoredSettings(),
      calibrated: demo || calibration !== null || vehicleCalibration !== null,
    });
  document.querySelector('#indicators')?.append(indicators.element);
  updateIndicators();

  // Target badge (#122, ADR 0013): the only main-screen trace of a
  // target preset — hidden whenever Normal (true level) is active, so
  // the normal case shows nothing extra. Tapping it jumps straight to
  // the Targets menu section (fast switching from the main screen).
  const targetBadge = createTargetBadge(() => menu.open('targets'));
  document.querySelector('#indicators')?.append(targetBadge.element);
  const updateTargetBadge = () => {
    const active = targetPresets.find((preset) => preset.id === activeTargetId) ?? null;
    targetBadge.update(active ? active.name : null);
  };
  updateTargetBadge();

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
        if (toRaise === 0) return t('status.cantLevel');
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

    root.append(engineElement, status, tilt.element, waiting);

    // Pose guard: wrong-pose overlay instead of wrong guidance (#51).
    const poseOverlay = document.createElement('div');
    poseOverlay.className = 'pose-overlay';
    poseOverlay.hidden = true;
    const poseText = document.createElement('p');
    poseText.className = 'pose-overlay__text';
    poseOverlay.append(poseText);
    root.append(poseOverlay);
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
      // Menu or wizard open: the user is reading, phone in hand — no
      // pose nagging, no overlays, no celebration until they are back.
      if (menu.isOpen() || onboardingOpen) {
        poseOverlay.hidden = true;
        levelOverlay.hideNow();
        requestAnimationFrame(frame);
        return;
      }
      const gravity = sensor.getGravity();
      if (gravity) {
        waiting.hidden = true;
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
        const now = performance.now();
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
