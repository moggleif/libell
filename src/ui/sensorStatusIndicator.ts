/**
 * Main-screen external-sensor indicator (#129): a small, neutral dot in
 * the top bar. Originally shown only while an external source (today:
 * EasyLevel, #116/ADR 0014) was the active `OrientationSensor` — but the
 * ☰ Settings menu no longer carries an "External sensor" entry
 * (screen-cleanup follow-up), so this indicator is now the *only* way to
 * reach that page: it stays visible whenever Web Bluetooth exists at all,
 * with a distinct neutral "tap to connect" look while the phone's own
 * sensor is still active, alongside its existing connected/disconnected
 * looks. Hidden only when Web Bluetooth doesn't exist in this browser —
 * never a silently broken option (#116's original acceptance criteria).
 *
 * Deliberately no numbers here — battery/RSSI/temperature live one tap
 * away on the External sensor page (`sensorPage.ts` /
 * `sensorSourceSection.ts`), reached by tapping this indicator, the same
 * "tap the indicator to open the matching page" pattern the warning lamps
 * use (`indicators.ts`).
 *
 * The connected/disconnected distinction is the visible half of #129's
 * "never leave apparently-live instructions on screen" guarantee: the
 * indicator honestly mirrors `OrientationSensor.getState()`, switching to
 * a clearly different (warning) look the moment the connection is lost.
 * The freeze/stale-data logic itself — actually holding back the wheel
 * diagram from looking live on stale data — is #132's separate scope.
 */
import type { SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t } from './i18n';

export interface SensorStatusIndicator {
  element: HTMLButtonElement;
  /** `source`/`state` mirror `OrientationSensor.getSource()`/`getState()`. */
  update(source: SensorSource, state: SensorState): void;
}

export function createSensorStatusIndicator(
  easyLevelSupported: boolean,
  onClick: () => void,
): SensorStatusIndicator {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sensor-status';
  // Never shown at all without Web Bluetooth — nothing this button could
  // usefully open (#116's "never a silently broken option").
  button.hidden = !easyLevelSupported;
  const dot = document.createElement('span');
  dot.className = 'sensor-status__dot';
  dot.setAttribute('aria-hidden', 'true');
  button.append(dot);
  button.addEventListener('click', onClick);

  return {
    element: button,
    update(source, state) {
      if (!easyLevelSupported) return;
      button.classList.remove('sensor-status--connected', 'sensor-status--disconnected');
      if (source === 'phone') {
        const label = t('sensorStatus.idle');
        button.setAttribute('aria-label', label);
        button.title = label;
        return;
      }
      const connected = state !== 'disconnected';
      button.classList.toggle('sensor-status--connected', connected);
      button.classList.toggle('sensor-status--disconnected', !connected);
      const label = connected ? t('sensorStatus.connected') : t('sensorStatus.disconnected');
      button.setAttribute('aria-label', label);
      button.title = label;
    },
  };
}
