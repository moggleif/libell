/**
 * Main-screen external-sensor indicator (#129): a small electronics-chip
 * icon in the top bar — a generic "sensor hardware" glyph rather than a
 * Bluetooth symbol, since it also has to make sense for the iOS
 * guide-only case below, where nothing is actually paired over
 * Bluetooth. Originally shown only while an external source (today:
 * EasyLevel, #116/ADR 0014) was the active `OrientationSensor` — but the
 * ☰ Settings menu no longer carries an "External sensor" entry
 * (screen-cleanup follow-up), so this indicator is now the *only* way to
 * reach that page: it stays visible whenever Web Bluetooth exists at all,
 * with a distinct neutral "tap to connect" look while the phone's own
 * sensor is still active, alongside its existing connected/disconnected
 * looks. Hidden only when Web Bluetooth doesn't exist in this browser and
 * no guide-only fallback applies — never a silently broken option (#116's
 * original acceptance criteria). On iOS specifically (R39), Web Bluetooth
 * never exists, but the dot stays visible anyway in a distinct "tap for
 * setup guide" look: tapping it opens the Bluefy workaround guide
 * (`iosSensorGuidePage.ts`) instead of a connect flow that could never
 * work in Safari.
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

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/** IC-chip glyph: a body plus four pins per side, unfilled and stroked
 * only — `.sensor-status__icon` (styles.css) sets the stroke color, so
 * the existing connected/disconnected/idle classes keep coloring it
 * exactly as they colored the old plain dot. */
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
  /** True only on iOS without Web Bluetooth (R39) — `onClick` still opens
   * `sensorPage`, but there it is `iosSensorGuidePage.ts`, not the ordinary
   * connect flow. Mutually exclusive with `easyLevelSupported` in practice
   * (iOS never has Web Bluetooth today), but read independently below so
   * neither assumes the other. */
  guideOnly: boolean,
  onClick: () => void,
): SensorStatusIndicator {
  const visible = easyLevelSupported || guideOnly;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sensor-status';
  // Never shown at all without Web Bluetooth or a guide to fall back to —
  // nothing this button could usefully open (#116's "never a silently
  // broken option").
  button.hidden = !visible;
  button.append(chipIcon());
  button.addEventListener('click', onClick);

  return {
    element: button,
    update(source, state) {
      if (!visible) return;
      // The guide-only dot never reflects source/state — there is no
      // `EasyLevelSensor` behind it to connect or disconnect, only a page
      // explaining Bluefy (R39).
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
      const connected = state !== 'disconnected';
      button.classList.toggle('sensor-status--connected', connected);
      button.classList.toggle('sensor-status--disconnected', !connected);
      const label = connected ? t('sensorStatus.connected') : t('sensorStatus.disconnected');
      button.setAttribute('aria-label', label);
      button.title = label;
    },
  };
}
