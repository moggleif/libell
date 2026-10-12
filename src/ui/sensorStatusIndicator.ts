/**
 * Main-screen external-sensor indicator: an electronics-chip icon in the
 * top bar — not a Bluetooth symbol, since it must also make sense in the
 * iOS guide-only case, where nothing is paired over Bluetooth. It is the
 * only way to reach the External sensor page, so it stays visible whenever
 * Web Bluetooth exists, with a neutral "tap to connect" look while the
 * phone's own sensor is active. Hidden only when there is no Web Bluetooth
 * and no guide-only fallback — never a silently broken option. On iOS
 * there is never Web Bluetooth; the icon opens the Bluefy setup guide
 * (`iosSensorGuidePage.ts`) instead.
 *
 * Deliberately no numbers here — battery/RSSI/temperature live one tap
 * away on the External sensor page.
 *
 * The connected/disconnected looks mirror `OrientationSensor.getState()`,
 * switching to a warning look the moment the connection is lost or its
 * data goes stale (R32), so stale instructions never look live.
 */
import type { SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t, type MessageKey } from './i18n';
import { svgEl } from './svg';

export interface SensorStatusIndicator {
  element: HTMLButtonElement;
  /** `source`/`state` mirror `OrientationSensor.getSource()`/`getState()`;
   * `stale` is R35's verdict on the source's latest sample. */
  update(source: SensorSource, state: SensorState, stale?: boolean): void;
}

/** IC-chip glyph: a body plus four pins per side, unfilled and stroked
 * only — `.sensor-status__icon` sets the stroke color per state class. */
function chipIcon(): SVGSVGElement {
  const icon = svgEl('svg', {
    viewBox: '0 0 24 24',
    class: 'sensor-status__icon',
    'aria-hidden': 'true',
  });
  icon.append(svgEl('rect', { x: '7', y: '7', width: '10', height: '10', rx: '2' }));
  const pins: [number, number, number, number][] = [
    [9, 2, 9, 7],
    [15, 2, 15, 7],
    [9, 17, 9, 22],
    [15, 17, 15, 22],
    [2, 9, 7, 9],
    [2, 15, 7, 15],
    [17, 9, 22, 9],
    [17, 15, 22, 15],
  ];
  for (const [x1, y1, x2, y2] of pins) {
    icon.append(svgEl('line', { x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2) }));
  }
  return icon;
}

export function createSensorStatusIndicator(
  easyLevelSupported: boolean,
  /** True only on iOS without Web Bluetooth — `onClick` then opens
   * `iosSensorGuidePage.ts`, not the connect flow. Mutually exclusive with
   * `easyLevelSupported` in practice, but read independently. */
  guideOnly: boolean,
  onClick: () => void,
): SensorStatusIndicator {
  const visible = easyLevelSupported || guideOnly;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sensor-status';
  // Without Web Bluetooth or a guide there is nothing this could open.
  button.hidden = !visible;
  button.append(chipIcon());
  button.addEventListener('click', onClick);

  return {
    element: button,
    update(source, state, stale = false) {
      if (!visible) return;
      // The guide-only icon has no box behind it, only a page explaining
      // Bluefy.
      if (guideOnly) {
        const label = t('sensorStatus.idle.guide');
        button.setAttribute('aria-label', label);
        button.title = label;
        return;
      }
      button.classList.remove('sensor-status--connected', 'sensor-status--disconnected');
      if (source === 'phone') {
        const label = t('sensorStatus.idle');
        button.setAttribute('aria-label', label);
        button.title = label;
        return;
      }
      const label = boxLabel(state, stale);
      const live = label === 'sensorStatus.connected';
      button.classList.toggle('sensor-status--connected', live);
      button.classList.toggle('sensor-status--disconnected', !live);
      const text = t(label);
      button.setAttribute('aria-label', text);
      button.title = text;
    },
  };
}

/** A lost link outranks stale data: it says more about what to do. */
function boxLabel(state: SensorState, stale: boolean): MessageKey {
  if (state === 'disconnected') return 'sensorStatus.disconnected';
  return stale ? 'sensorStatus.stale' : 'sensorStatus.connected';
}
