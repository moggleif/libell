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

export function createSensorFallbackPrompt(
  /** Opens the device picker; resolves once that attempt is over. */
  onRetry: () => Promise<void> | void,
  onUsePhone: () => void,
): SensorFallbackPrompt {
  const container = document.createElement('div');
  container.className = 'sensor-fallback';
  container.hidden = true;

  const text = document.createElement('p');
  text.className = 'sensor-fallback__text';
  const hint = document.createElement('p');
  hint.className = 'sensor-fallback__hint';
  container.append(text, hint);

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
  usePhoneButton.addEventListener('click', onUsePhone);

  actions.append(retryButton, usePhoneButton);
  container.append(actions);

  /** A tapped Reconnect that did not bring the box back. Cleared
   * as soon as the prompt hides, so a later loss starts fresh. */
  let failed = false;
  let silent = true;

  function render(): void {
    text.textContent = t(silent ? 'sensorFallback.lost' : 'sensorFallback.connect');
    hint.textContent = failed
      ? t('sensorFallback.notFound')
      : t(silent ? 'sensorFallback.autoRetry' : 'sensorFallback.pick');
  }

  retryButton.addEventListener('click', () => {
    void Promise.resolve(onRetry()).then(() => {
      // Still shown means the attempt did not reconnect; the next
      // update() confirms either way.
      if (!container.hidden) {
        failed = true;
        render();
      }
    });
  });

  render();
  return {
    element: container,
    update(unavailable, canRetrySilently) {
      if (!unavailable) failed = false;
      if (container.hidden === !unavailable && silent === canRetrySilently) return;
      silent = canRetrySilently;
      container.hidden = !unavailable;
      render();
    },
  };
}
