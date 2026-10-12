/**
 * Starting the readings at launch: the remembered box's silent reconnect
 * first, otherwise the phone's own sensor, with iOS's tap for motion
 * access and an honest message when there is none.
 */
import type { OrientationSensor, SensorState } from '../sensor/orientation';
import { t } from '../ui/i18n';

export interface SensorStartupDeps {
  root: HTMLElement;
  sensor: () => OrientationSensor;
  /** Resolves true when a remembered box took over the start-up. */
  attemptAutoReconnect: () => Promise<boolean>;
  showLevelScreen(): void;
  isSensorSupported: () => boolean;
  needsPermissionGesture: () => boolean;
  isSecureContext: () => boolean;
}

export function startSensors(deps: SensorStartupDeps): Promise<void> {
  // A box that took over (connected, or shown as disconnected) must not
  // be followed by the phone flow: its `start()` would open the device
  // picker, which needs a user gesture this page-load path lacks.
  return deps.attemptAutoReconnect().then((tookOver) => {
    if (!tookOver) startPhoneSensor(deps);
  });
}

function startPhoneSensor(deps: SensorStartupDeps): void {
  const handleState = (state: SensorState) => showSensorState(state, deps);
  if (!deps.isSensorSupported()) {
    handleState('unsupported');
    return;
  }
  const start = () => void deps.sensor().start().then(handleState);
  if (deps.needsPermissionGesture()) showStartButton(deps.root, start);
  else start();
}

function showSensorState(state: SensorState, deps: SensorStartupDeps): void {
  if (state === 'granted') deps.showLevelScreen();
  else if (state === 'denied') showMessage(deps.root, t('main.denied'));
  else showMessage(deps.root, deps.isSecureContext() ? t('main.noSensors') : t('main.https'));
}

function hint(text: string): HTMLParagraphElement {
  const element = document.createElement('p');
  element.className = 'app__hint';
  element.textContent = text;
  return element;
}

function showMessage(root: HTMLElement, text: string): void {
  root.replaceChildren(hint(text));
}

/** iOS releases motion data only after a user gesture. */
function showStartButton(root: HTMLElement, onStart: () => void): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'app__start';
  button.textContent = t('main.start');
  button.addEventListener('click', onStart);
  root.replaceChildren(hint(t('main.hint')), button);
}
