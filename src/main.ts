import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling } from './domain/leveling';
import { createDisplayStabilizer } from './domain/stability';
import type { Calibration, LevelSettings } from './domain/settings';
import {
  clearCalibration,
  hasStoredSettings,
  loadCalibration,
  loadLanguage,
  loadSettings,
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
import { createIndicators } from './ui/indicators';
import { resolveLanguage, setLanguage, t } from './ui/i18n';

setLanguage(resolveLanguage(loadLanguage()));

const installButton = document.querySelector<HTMLButtonElement>('#install-button');
const installHint = document.querySelector<HTMLElement>('#install-hint');
if (installButton && installHint) {
  setupInstallButton(installButton, installHint);
}

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

function bootstrap(root: HTMLElement): void {
  keepScreenAwake();

  let settings: LevelSettings = loadSettings();
  let calibration: Calibration | null = loadCalibration();
  const sensor = createOrientationSensor();

  // Menu (hamburger) with Settings / Calibration / Help.
  const menu = createMenu({
    initialSettings: settings,
    onSettingsSaved(next) {
      settings = next;
      updateIndicators();
    },
    getCalibration: () => calibration,
    calibrate() {
      const gravity = sensor.getGravity();
      if (!gravity) {
        return t('calibration.err.notRunning');
      }
      const rollDeg = Math.atan2(gravity.x, gravity.z) * RAD_TO_DEG;
      const pitchDeg = Math.atan2(gravity.y, gravity.z) * RAD_TO_DEG;
      if (Math.abs(rollDeg) > MAX_CALIBRATION_DEG || Math.abs(pitchDeg) > MAX_CALIBRATION_DEG) {
        return t('calibration.err.notFlat');
      }
      calibration = { rollDeg, pitchDeg };
      saveCalibration(calibration);
      updateIndicators();
      return null;
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

  // Dashboard-style warning lamps.
  const indicators = createIndicators((section) => menu.open(section));
  const updateIndicators = () =>
    indicators.update({ settingsSaved: hasStoredSettings(), calibrated: calibration !== null });
  document.querySelector('#indicators')?.append(indicators.element);
  updateIndicators();

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
    const levelMessage = document.createElement('p');
    levelMessage.className = 'level-message';
    levelMessage.setAttribute('aria-live', 'polite');
    const tilt = createTiltReadout();

    const waiting = document.createElement('p');
    waiting.className = 'app__hint';
    waiting.textContent = t('main.waiting');

    root.append(diagram.element, levelMessage, tilt.element, waiting);

    const stabilize = createDisplayStabilizer();
    const frame = () => {
      const gravity = sensor.getGravity();
      if (gravity) {
        waiting.hidden = true;
        const result = stabilize(computeLeveling(gravity, settings, calibration), settings);
        diagram.update(result);
        levelMessage.textContent = result.isLevel ? t('main.level') : '';
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
