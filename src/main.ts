import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling } from './domain/leveling';
import type { Calibration, LevelSettings } from './domain/settings';
import {
  clearCalibration,
  hasStoredSettings,
  loadCalibration,
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

const installButton = document.querySelector<HTMLButtonElement>('#install-button');
const installHint = document.querySelector<HTMLElement>('#install-hint');
if (installButton && installHint) {
  setupInstallButton(installButton, installHint);
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
        return 'The tilt sensor is not running yet — tap Start on the main screen first.';
      }
      const rollDeg = Math.atan2(gravity.x, gravity.z) * RAD_TO_DEG;
      const pitchDeg = Math.atan2(gravity.y, gravity.z) * RAD_TO_DEG;
      if (Math.abs(rollDeg) > MAX_CALIBRATION_DEG || Math.abs(pitchDeg) > MAX_CALIBRATION_DEG) {
        return 'The phone does not look flat — place it on a level surface and try again.';
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
    waiting.textContent = 'Waiting for the tilt sensor…';

    root.append(diagram.element, levelMessage, tilt.element, waiting);

    const frame = () => {
      const gravity = sensor.getGravity();
      if (gravity) {
        waiting.hidden = true;
        const result = computeLeveling(gravity, settings, calibration);
        diagram.update(result, settings);
        levelMessage.textContent = result.isLevel ? 'Your RV is level!' : '';
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
        showMessage(
          'Motion access was denied, so LevelMate cannot read the tilt. ' +
            'Allow motion & orientation access for this site and reload.',
        );
        break;
      default:
        showMessage(
          window.isSecureContext
            ? 'This device does not expose motion sensors, so LevelMate cannot read the tilt.'
            : 'LevelMate needs a secure connection (HTTPS) to read the tilt sensors. ' +
                'Open the app over HTTPS and try again.',
        );
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
    hint.textContent = 'Lay your phone flat inside your RV, top edge toward the front.';
    const start = document.createElement('button');
    start.type = 'button';
    start.className = 'app__start';
    start.textContent = 'Start';
    start.addEventListener('click', () => {
      void sensor.start().then(handleState);
    });
    root.append(hint, start);
  } else {
    void sensor.start().then(handleState);
  }
}
