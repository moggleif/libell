import './ui/styles.css';
import { setupInstallButton } from './ui/install';
import { keepScreenAwake } from './ui/wakeLock';
import { computeLeveling } from './domain/leveling';
import type { LevelSettings } from './domain/settings';
import { loadSettings } from './data/settingsStore';
import {
  createOrientationSensor,
  isSensorSupported,
  needsPermissionGesture,
  type SensorState,
} from './sensor/orientation';
import { createRvDiagram } from './ui/rvDiagram';
import { createWheelList } from './ui/wheelList';
import { createBubbleLevel } from './ui/bubbleLevel';
import { createTiltReadout } from './ui/tiltReadout';
import { createSettingsPanel } from './ui/settingsPanel';

const installButton = document.querySelector<HTMLButtonElement>('#install-button');
const installHint = document.querySelector<HTMLElement>('#install-hint');
if (installButton && installHint) {
  setupInstallButton(installButton, installHint);
}

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  bootstrap(app);
}

function bootstrap(root: HTMLElement): void {
  keepScreenAwake();

  let settings: LevelSettings = loadSettings();
  const sensor = createOrientationSensor();

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
    const wheelList = createWheelList();
    const bubble = createBubbleLevel();
    const tilt = createTiltReadout();
    const secondary = document.createElement('div');
    secondary.className = 'app__secondary';
    secondary.append(bubble.element, tilt.element);
    const settingsPanel = createSettingsPanel(settings, (next) => {
      settings = next;
    });

    const waiting = document.createElement('p');
    waiting.className = 'app__hint';
    waiting.textContent = 'Waiting for the tilt sensor…';

    root.append(diagram.element, wheelList.element, secondary, settingsPanel.element, waiting);

    const frame = () => {
      const gravity = sensor.getGravity();
      if (gravity) {
        waiting.hidden = true;
        const result = computeLeveling(gravity, settings);
        diagram.update(result, settings);
        wheelList.update(result);
        bubble.update(result);
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
