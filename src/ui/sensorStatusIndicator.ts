/**
 * Main-screen external-sensor indicator (#129): a small, neutral dot shown
 * only while an external source (today: EasyLevel, #116/ADR 0014) is the
 * active `OrientationSensor` — nothing at all is added to the main screen
 * while the phone's own sensor is active (regression guard, see #129's
 * acceptance criteria and this file's test).
 *
 * Deliberately no numbers here — battery/RSSI/temperature live one tap
 * away in the "External sensor" menu page (`sensorSourceSection.ts`),
 * reached by tapping this indicator, the same "tap the indicator to open
 * the matching menu section" pattern the warning lamps use
 * (`indicators.ts`).
 *
 * This is the visible half of #129's "never leave apparently-live
 * instructions on screen" guarantee: the indicator honestly mirrors
 * `OrientationSensor.getState()`, switching to a clearly different
 * (warning) look the moment the connection is lost. The freeze/stale-data
 * logic itself — actually holding back the wheel diagram from looking
 * live on stale data — is #132's separate scope.
 */
import type { SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t } from './i18n';

export interface SensorStatusIndicator {
  element: HTMLButtonElement;
  /** `source`/`state` mirror `OrientationSensor.getSource()`/`getState()`. */
  update(source: SensorSource, state: SensorState): void;
}

export function createSensorStatusIndicator(onClick: () => void): SensorStatusIndicator {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sensor-status';
  button.hidden = true;
  const dot = document.createElement('span');
  dot.className = 'sensor-status__dot';
  dot.setAttribute('aria-hidden', 'true');
  button.append(dot);
  button.addEventListener('click', onClick);

  return {
    element: button,
    update(source, state) {
      if (source === 'phone') {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      const connected = state !== 'disconnected';
      button.classList.toggle('sensor-status--connected', connected);
      button.classList.toggle('sensor-status--disconnected', !connected);
      const label = connected ? t('sensorStatus.connected') : t('sensorStatus.disconnected');
      button.setAttribute('aria-label', label);
      button.title = label;
    },
  };
}
