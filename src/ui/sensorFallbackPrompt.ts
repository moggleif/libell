/**
 * Recovery prompt for when the active box cannot be reached: never a frozen
 * or ambiguous screen, always an explicit choice between Retry and "Use
 * phone sensor". It is the actionable form of the "waiting" hint for
 * `sensor.getState() === 'disconnected'` (see `sensor/sensorFallback.ts`),
 * not a second "sensor is down" surface.
 *
 * ADR 0014 splits calibration three ways per source, so a silent switch to
 * the phone could show a plausible-looking but wrong reading — "Use phone
 * sensor" is therefore always an explicit tap. A Retry tap is exactly one
 * attempt; the silent background `reconnect()` is driven elsewhere.
 *
 * One sentence, one primary action, one quiet link. The phone's own pose
 * rule is said only after switching to it, by the wrong-pose overlay.
 */
import { t } from './i18n';

export interface SensorFallbackPrompt {
  element: HTMLElement;
  /**
   * Shown only while `unavailable` is true (`isSensorUnavailable` in
   * `sensor/sensorFallback.ts`); there is no separate "clear" method.
   *
   * `canRetrySilently` says whether the background retry can reach the box
   * at all: after an app restart on a browser without `getDevices()` it
   * cannot, so the card asks for the one tap instead of promising an
   * automatic retry that will never land.
   */
  update(unavailable: boolean, canRetrySilently: boolean): void;
}

/** The prompt's elements and what it says; the functions below work on one. */
interface Prompt {
  readonly view: ReturnType<typeof createView>;
  /** A tapped Reconnect that did not bring the box back. Cleared as soon as
   * the prompt hides, so a later loss starts fresh. */
  failed: boolean;
  silent: boolean;
}

export function createSensorFallbackPrompt(
  /** Opens the device picker; resolves once that attempt is over. */
  onRetry: () => Promise<void> | void,
  onUsePhone: () => void,
): SensorFallbackPrompt {
  const prompt: Prompt = { view: createView(), failed: false, silent: true };
  const { container, retryButton, usePhoneButton } = prompt.view;
  usePhoneButton.addEventListener('click', onUsePhone);
  retryButton.addEventListener('click', () => {
    void Promise.resolve(onRetry()).then(() => {
      // Still shown means the attempt did not reconnect; the next
      // update() confirms either way.
      if (!container.hidden) {
        prompt.failed = true;
        render(prompt);
      }
    });
  });

  render(prompt);
  return {
    element: container,
    update: (unavailable, canRetrySilently) => update(prompt, unavailable, canRetrySilently),
  };
}

function createView() {
  const container = document.createElement('div');
  container.className = 'sensor-fallback';
  container.hidden = true;
  const text = document.createElement('p');
  text.className = 'sensor-fallback__text';
  const hint = document.createElement('p');
  hint.className = 'sensor-fallback__hint';
  const actions = document.createElement('div');
  actions.className = 'sensor-fallback__actions';
  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'menu__action';
  retryButton.textContent = t('sensorFallback.retry');
  // A quiet link, not a second button: switching source is the escape
  // hatch, not the expected next step.
  const usePhoneButton = document.createElement('button');
  usePhoneButton.type = 'button';
  usePhoneButton.className = 'link-button';
  usePhoneButton.textContent = t('sensorFallback.usePhone');
  actions.append(retryButton, usePhoneButton);
  container.append(text, hint, actions);
  return { container, text, hint, retryButton, usePhoneButton };
}

function render({ view, failed, silent }: Prompt): void {
  view.text.textContent = t(silent ? 'sensorFallback.lost' : 'sensorFallback.connect');
  view.hint.textContent = failed
    ? t('sensorFallback.notFound')
    : t(silent ? 'sensorFallback.autoRetry' : 'sensorFallback.pick');
}

function update(prompt: Prompt, unavailable: boolean, canRetrySilently: boolean): void {
  const { container } = prompt.view;
  if (!unavailable) prompt.failed = false;
  if (container.hidden === !unavailable && prompt.silent === canRetrySilently) return;
  prompt.silent = canRetrySilently;
  container.hidden = !unavailable;
  render(prompt);
}
