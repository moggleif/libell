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
 * "Retry" is likewise wired to the existing `EasyLevelSensor.reconnect()`
 * (#130) — one tap, one attempt from this component's own point of view;
 * on failure the state simply stays 'disconnected' and this prompt stays
 * shown (or reappears, per `update()` below). This component itself never
 * loops or retries on its own — `main.ts` separately drives an automatic
 * background retry on the same `reconnect()` call (#211), so recovery
 * does not depend on the user finding this button — but that lives
 * entirely outside this file: from here, a tap still means exactly one
 * attempt, no more.
 *
 * Phone mode needs the phone lying flat inside the vehicle (R1/R17) where
 * a permanently-mounted EasyLevel box does not — this prompt's own copy
 * says so plainly, so tapping "Use phone sensor" is never presented as a
 * like-for-like swap. The existing R17 wrong-pose overlay reinforces the
 * same point after the switch, if the phone is not already lying flat —
 * reused as-is rather than duplicated here.
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
   */
  update(unavailable: boolean): void;
}

export function createSensorFallbackPrompt(
  onRetry: () => void,
  onUsePhone: () => void,
): SensorFallbackPrompt {
  const container = document.createElement('div');
  container.className = 'sensor-fallback';
  container.hidden = true;

  const text = document.createElement('p');
  text.className = 'sensor-fallback__text';
  text.textContent = t('sensorFallback.unavailable');
  container.append(text);

  // Said plainly up front, before the user decides — not only after the
  // tap — per the issue's own requirement ("say this plainly ... it's not
  // a like-for-like swap").
  const hint = document.createElement('p');
  hint.className = 'sensor-fallback__hint';
  hint.textContent = t('sensorFallback.phoneHint');
  container.append(hint);

  const actions = document.createElement('div');
  actions.className = 'sensor-fallback__actions';

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'menu__action';
  retryButton.textContent = t('sensorFallback.retry');
  retryButton.addEventListener('click', onRetry);

  const usePhoneButton = document.createElement('button');
  usePhoneButton.type = 'button';
  usePhoneButton.className = 'menu__action menu__action--secondary';
  usePhoneButton.textContent = t('sensorFallback.usePhone');
  usePhoneButton.addEventListener('click', onUsePhone);

  actions.append(retryButton, usePhoneButton);
  container.append(actions);

  return {
    element: container,
    update(unavailable) {
      container.hidden = !unavailable;
    },
  };
}
