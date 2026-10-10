/**
 * Sensor unavailable fallback prompt (#134) — the interactive recovery UI
 * for when the active EasyLevel connection cannot be reached: never a
 * frozen or ambiguous screen, always an explicit choice between Retry and
 * "Use phone sensor" (the issue's own example wording). This is the
 * actionable form of the plain "waiting" hint `main.ts`'s frame loop
 * already showed for this exact case (`sensor.getState() === 'disconnected'`,
 * see `sensor/sensorFallback.ts`) — not a second, competing "sensor is
 * down" surface.
 *
 * ADR 0014 splits calibration three ways per source, so a silent,
 * automatic switch to the phone could show a plausible-looking but wrong
 * reading — "Use phone sensor" is therefore always this explicit tap.
 * `main.ts` wires it to the exact same switch-to-phone path the menu's
 * own "Disconnect" button already uses, never a parallel implementation.
 * "Retry" opens the device picker for the active source, the same connect
 * the sensor page's button runs (#307) — one tap, one attempt from this
 * component's own point of view; on failure the state simply stays
 * 'disconnected' and this prompt stays shown (or reappears, per `update()`
 * below). This component itself never loops or retries on its own —
 * `main.ts` separately drives a silent background `reconnect()` (#211), so recovery
 * does not depend on the user finding this button — but that lives
 * entirely outside this file: from here, a tap still means exactly one
 * attempt, no more.
 *
 * One sentence, one primary action, one quiet link (#313, the #309 UX
 * review). It used to lead with a paragraph about the phone lying flat —
 * an option the user had not picked — and offer three equal buttons. The
 * phone's own pose rule is now said only after switching to it, by R17's
 * wrong-pose overlay, and the top-bar chip already reaches the box page.
 */
import { t } from './i18n';

export interface SensorFallbackPrompt {
  element: HTMLElement;
  /**
   * Shown only while `unavailable` is true — driven by
   * `sensor/sensorFallback.ts`'s `isSensorUnavailable(sensor.getState())`,
   * never computed independently here. Recovery is automatic: the caller
   * simply stops passing `true` once the state resolves (a successful
   * Retry, or the source having switched to the phone) — there is no
   * separate "clear" method.
   *
   * `canRetrySilently` says whether the background retry (#211) can reach
   * the box at all (#313): after an app restart on a browser without
   * `getDevices()` it cannot, so the card asks for the one tap instead of
   * promising an automatic retry that will never land.
   */
  update(unavailable: boolean, canRetrySilently: boolean): void;
}

export function createSensorFallbackPrompt(
  /** Opens the device picker (#307); resolves once that attempt is over. */
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

  /** A tapped Reconnect that did not bring the box back (#313). Cleared
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
