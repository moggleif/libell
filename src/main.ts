import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { setupShareButton } from './ui/share';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling, WHEEL_IDS } from './domain/leveling';
import { createDisplayStabilizer } from './domain/stability';
import { createPoseDetector } from './domain/pose';
import { formatLength, type Calibration, type LevelSettings } from './domain/settings';
import {
  clearCalibration,
  hasSeenOnboarding,
  hasStoredSettings,
  loadCalibration,
  loadLanguage,
  loadSettings,
  markOnboardingSeen,
  saveCalibration,
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
import { applyTheme, followSystemTheme } from './ui/theme';
import { createIndicators } from './ui/indicators';
import { showOnboarding } from './ui/onboarding';
import { resolveLanguage, setLanguage, t } from './ui/i18n';

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

function bootstrap(root: HTMLElement): void {
  keepScreenAwake();

  let settings: LevelSettings = loadSettings();
  let calibration: Calibration | null = loadCalibration();
  applyTheme(settings.theme);
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
      onSettingsSaved(next) {
        settings = next;
        applyTheme(settings.theme);
        updateIndicators();
      },
      getCalibration: () => calibration,
      calibrate: () => calibrateNow(),
      readTilt: () => readTiltNow(),
      applyCalibration(next) {
        calibration = next;
        saveCalibration(next);
        updateIndicators();
      },
      clearCalibration() {
        calibration = null;
        clearCalibration();
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
    openOnboarding,
    onSettingsSaved(next) {
      settings = next;
      applyTheme(settings.theme);
      // The save click is a user gesture — the right moment to unlock
      // audio for the opt-in level chime.
      if (settings.soundOnLevel) unlockAudio();
      updateIndicators();
    },
    getCalibration: () => calibration,
    calibrate: () => calibrateNow(),
    readTilt: () => readTiltNow(),
    applyCalibration(next) {
      calibration = next;
      saveCalibration(next);
      updateIndicators();
    },
    clearCalibration() {
      calibration = null;
      clearCalibration();
      updateIndicators();
    },
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
      calibrated: demo || calibration !== null,
    });
  document.querySelector('#indicators')?.append(indicators.element);
  updateIndicators();

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
    saveCalibration(calibration);
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

  const showLevelScreen = () => {
    root.replaceChildren();
    root.classList.add('app--level');

    const diagram = createRvDiagram();
    // Always-visible status row: never empty, fixed height, so nothing
    // pops in and out while the user is watching the wheels.
    const status = document.createElement('p');
    status.className = 'status-line';
    status.setAttribute('aria-live', 'polite');
    const tilt = createTiltReadout();

    const waiting = document.createElement('p');
    waiting.className = 'app__hint';
    waiting.textContent = t('main.waiting');

    // Full-screen confirmation shown briefly when level is reached.
    const overlay = document.createElement('div');
    overlay.className = 'level-overlay';
    overlay.hidden = true;
    const overlayMark = document.createElement('div');
    overlayMark.className = 'level-overlay__mark';
    overlayMark.textContent = '✓';
    const overlayText = document.createElement('p');
    overlayText.className = 'level-overlay__text';
    overlayText.textContent = t('main.level');
    overlay.append(overlayMark, overlayText);
    root.append(overlay);

    root.append(diagram.element, status, tilt.element, waiting);

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

    const stabilize = createDisplayStabilizer();
    let wasLevel = false;
    let overlayTimer = 0;
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

    const celebrate = () => {
      if (!celebrateArmed || document.visibilityState !== 'visible') return;
      const now = performance.now();
      if (now - lastCelebrate < CELEBRATE_COOLDOWN_MS) return;
      celebrateArmed = false;
      lastCelebrate = now;
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      if (settings.soundOnLevel) playChime();
      overlay.hidden = false;
      window.clearTimeout(overlayTimer);
      overlayTimer = window.setTimeout(() => {
        overlay.hidden = true;
      }, 2500);
    };

    const statusText = (result: ReturnType<typeof stabilize>): string => {
      if (result.isLevel) return t('main.level');
      const toRaise = WHEEL_IDS.filter((id) => result.wheels[id].severity !== 'none').length;
      const maxMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
      if (maxMm <= settings.toleranceMm + 10) {
        return t('status.almost', {
          left: formatLength(Math.max(1, maxMm - settings.toleranceMm), settings.displayUnit),
        });
      }
      return toRaise === 1 ? t('status.one') : t('status.many', { n: toRaise });
    };

    const frame = () => {
      // Menu or wizard open: the user is reading, phone in hand — no
      // pose nagging, no overlays, no celebration until they are back.
      if (menu.isOpen() || onboardingOpen) {
        poseOverlay.hidden = true;
        overlay.hidden = true;
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
          overlay.hidden = true;
          requestAnimationFrame(frame);
          return;
        }
        poseOverlay.hidden = true;
        const now = performance.now();
        const result = stabilize(computeLeveling(gravity, settings, calibration), settings, now);
        diagram.update(result, settings.displayUnit, settings.rampStepHeightsMm);
        status.textContent = statusText(result);
        status.classList.toggle('status-line--level', result.isLevel);
        if (result.isLevel && !wasLevel) celebrate();
        if (!result.isLevel) overlay.hidden = true;
        wasLevel = result.isLevel;
        // Re-arm the celebration only once clearly un-level, sustained.
        const maxMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
        if (!result.isLevel && maxMm > settings.toleranceMm + REARM_MARGIN_MM) {
          clearlyUnlevelSince ??= now;
          if (now - clearlyUnlevelSince >= REARM_SUSTAIN_MS) celebrateArmed = true;
        } else {
          clearlyUnlevelSince = null;
        }
        tilt.update(result);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

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
