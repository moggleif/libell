/**
 * Sensor status page: reached by tapping the sensor row on the External
 * sensor page (`sensorSourceSection.ts`). A deeper, single-purpose view of
 * whatever is currently feeding gravity readings — battery, temperature and
 * a live roll/pitch reading up top, refreshed continuously while this page
 * is open (`refresh()` is called every animation frame by `sensorPage.ts`'s
 * `refreshLive()`, the same "runs every frame regardless of what's open"
 * pattern `main.ts` already uses for the top-bar sensor-status dot).
 *
 * The primary rows work for either sensor source — same as
 * `diagnosticsSection.ts` below, which this page embeds wholesale as a
 * collapsible "Debug info" section rather than re-implementing sample-rate/
 * tilt-formatting a second time. A native `<details>` needs no JS to track
 * open/closed state, and reusing `createDiagnosticsSection` verbatim means
 * this page and the universal "?" → Diagnostics tab can never disagree.
 *
 * Battery/temperature/RSSI reuse the exact `sensorSource.detail.*` wording
 * `sensorSourceSection.ts` already shows inline on the External sensor
 * page — same values, same strings, just repeated here for a focused view
 * that doesn't require battery/temperature to share space with the
 * connect/disconnect controls.
 */
import { isLowBattery } from '../sensor/easyLevelProtocol';
import { createDiagnosticsSection, tiltText, type DiagnosticsOptions } from './diagnosticsSection';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';

export interface EasyLevelStatusPage {
  element: HTMLElement;
  isOpen(): boolean;
  open(): void;
  close(): void;
  /** Re-reads every live value — cheap enough to call every animation
   * frame while `isOpen()`, same discipline `sensorPage.ts`'s
   * `refreshLive()` follows. */
  refresh(): void;
}

export function createEasyLevelStatusPage(options: DiagnosticsOptions): EasyLevelStatusPage {
  const notAvailable = t('sensorSource.detail.notAvailable');

  const page = createStandalonePage(t('sensorStatus.title'), () => refresh());
  // Opened from within the (still-open) External sensor page — needs to
  // paint above it, not just rely on DOM append order elsewhere.
  page.element.classList.add('sensor-status-page');

  const stateRow = document.createElement('p');
  stateRow.className = 'menu__text menu__text--status';
  const batteryRow = document.createElement('p');
  batteryRow.className = 'menu__text';
  const temperatureRow = document.createElement('p');
  temperatureRow.className = 'menu__text';
  const readingRow = document.createElement('p');
  readingRow.className = 'menu__text';
  // Same plain threshold + hysteresis band as the inline detail block
  // (#123's `isLowBattery`) — its own latch here, never shared with that
  // block's, so the two pages can't leave each other in a stale "low" state.
  const lowBatteryRow = document.createElement('p');
  lowBatteryRow.className = 'menu__text menu__text--warning';
  lowBatteryRow.hidden = true;
  let wasLowBattery = false;
  page.body.append(stateRow, batteryRow, temperatureRow, readingRow, lowBatteryRow);

  // Debug info: closed by default, same native-<details> discipline as the
  // settings page's Advanced disclosure (#157) — reuses the universal
  // Diagnostics section wholesale (source/state/sample rate/raw+calibrated
  // tilt/target/version/RSSI/"Copy diagnostics"), not a second copy.
  const debugDetails = document.createElement('details');
  debugDetails.className = 'menu__detail sensor-status__debug';
  const debugSummary = document.createElement('summary');
  debugSummary.className = 'sensor-status__debug-summary';
  debugSummary.textContent = t('sensorStatus.debug');
  debugDetails.append(debugSummary);
  const diagnostics = createDiagnosticsSection(options);
  debugDetails.append(diagnostics.element);
  page.body.append(debugDetails);

  function refresh(): void {
    const source = options.getSensorSource();
    const state = options.getSensorState();
    stateRow.textContent =
      source !== 'easylevel'
        ? t('sensorSource.status.phone')
        : state === 'disconnected'
          ? t('sensorSource.status.disconnected')
          : t('sensorSource.status.connected');

    const status = source === 'easylevel' ? options.getEasyLevelStatus() : null;
    batteryRow.textContent = t('sensorSource.detail.battery', {
      value: status ? `${Math.round(status.batteryPercent)}%` : notAvailable,
    });
    temperatureRow.textContent = t('sensorSource.detail.temperature', {
      value: status ? `${status.temperatureCelsius.toFixed(1)}°C` : notAvailable,
    });
    readingRow.textContent = t('sensorStatus.reading', {
      value: tiltText(options.getCalibratedTilt()),
    });

    wasLowBattery = status ? isLowBattery(status.batteryPercent, wasLowBattery) : false;
    lowBatteryRow.hidden = !wasLowBattery;
    if (wasLowBattery && status) {
      lowBatteryRow.textContent = t('sensorSource.lowBattery', {
        value: `${Math.round(status.batteryPercent)}%`,
      });
    }

    diagnostics.refresh();
  }

  refresh();
  return {
    element: page.element,
    isOpen: page.isOpen,
    open: page.open,
    close: page.close,
    refresh,
  };
}
