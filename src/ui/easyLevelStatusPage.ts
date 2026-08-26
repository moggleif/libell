/**
 * Sensor status page: reached by tapping the sensor row on the External
 * sensor page (`sensorSourceSection.ts`). A deeper, single-purpose view of
 * whatever is currently feeding gravity readings — battery, temperature and
 * a live roll/pitch reading up top, refreshed continuously while this page
 * is open (`refresh()` is called every animation frame by `sensorPage.ts`'s
 * `refreshLive()`, the same "runs every frame regardless of what's open"
 * pattern `main.ts` already uses for the top-bar sensor-status dot).
 *
 * The primary rows work for either sensor source. The "Debug info"
 * disclosure below them does not (design review — the earlier version
 * embedded the universal, sensor-agnostic Diagnostics page here, which was
 * cut entirely for being too generic to earn its keep): it is EasyLevel-
 * only, hidden while the phone's own sensor is active, and shows raw
 * values straight off the box — device id, last-sample age, the raw accel
 * int16 triplet, firmware tier, and the raw status-characteristic bytes as
 * hex — the kind of detail that matters when a box isn't behaving as
 * expected (wrong reading, no data arriving, an unfamiliar firmware tier),
 * not everyday reading material.
 *
 * Battery/temperature reuse the exact `sensorSource.detail.*` wording
 * `sensorSourceSection.ts` already shows inline on the External sensor
 * page — same values, same strings, just repeated here for a focused view
 * that doesn't require battery/temperature to share space with the
 * connect/disconnect controls.
 */
import type { Calibration, SensorSource } from '../domain/settings';
import type { GravityVector } from '../domain/leveling';
import { isLowBattery, type EasyLevelStatus } from '../sensor/easyLevelProtocol';
import type { SensorState } from '../sensor/orientation';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';
import { showToast } from './toast';

export interface EasyLevelStatusOptions {
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /** The active sensor's current state. */
  getSensorState(): SensorState;
  /** `faf52c22-...` parsed into battery/temperature/firmware-tier (#123),
   * or null before the first status notification arrives. */
  getEasyLevelStatus(): EasyLevelStatus | null;
  /** Calibrated roll/pitch — the same effective calibration the leveling
   * math itself uses — or null before the first sample. Shown for either
   * sensor source, unlike the EasyLevel-only fields below. */
  getCalibratedTilt(): Calibration | null;
  /** The connected box's Web Bluetooth device id (#130), or null. */
  getEasyLevelDeviceId(): string | null;
  /** `performance.now()` at the box's last accepted accel notification, or
   * null — the EasyLevel sensor's own value, not whichever source happens
   * to be active, so this still means something while the phone sensor is
   * the active source but a box was connected before. */
  getEasyLevelLastSampleAt(): number | null;
  /** The raw accel int16 triplet straight off the box (`easyLevelSensor.ts`
   * doesn't scale it — see `easyLevelProtocol.ts`), or null. */
  getEasyLevelRawAccel(): GravityVector | null;
  /** Raw `faf52c22-...` bytes, or null. */
  getEasyLevelStatusBytes(): Uint8Array | null;
}

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

/** "0.4 s ago" from a `performance.now()`-based sample timestamp — never a
 * wall-clock date, since `getEasyLevelLastSampleAt()` is monotonic and
 * page-relative, not a `Date.now()` epoch value. */
function ageText(lastSampleAt: number | null, nowMs: number): string {
  if (lastSampleAt === null) return '—';
  const seconds = Math.max(0, (nowMs - lastSampleAt) / 1000);
  return t('sensorStatus.debug.age', { s: seconds.toFixed(1) });
}

function hexBytes(bytes: Uint8Array | null): string | null {
  if (!bytes) return null;
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

export function createEasyLevelStatusPage(options: EasyLevelStatusOptions): EasyLevelStatusPage {
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

  // Debug info (EasyLevel only): closed by default, same native-<details>
  // discipline as the settings page's Advanced disclosure (#157) — no JS
  // needed to track open/closed state. The whole block is hidden while the
  // phone's own sensor is active — there is no "raw box data" to show.
  const debugDetails = document.createElement('details');
  debugDetails.className = 'menu__detail sensor-status__debug';
  const debugSummary = document.createElement('summary');
  debugSummary.className = 'sensor-status__debug-summary';
  debugSummary.textContent = t('sensorStatus.debug');
  const debugIntro = document.createElement('p');
  debugIntro.className = 'menu__text';
  debugIntro.textContent = t('sensorStatus.debug.intro');
  const deviceIdRow = document.createElement('p');
  deviceIdRow.className = 'menu__text';
  const lastSampleRow = document.createElement('p');
  lastSampleRow.className = 'menu__text';
  const rawAccelRow = document.createElement('p');
  rawAccelRow.className = 'menu__text';
  const firmwareTierRow = document.createElement('p');
  firmwareTierRow.className = 'menu__text';
  const rawStatusBytesRow = document.createElement('p');
  rawStatusBytesRow.className = 'menu__text';
  const copyDebugButton = document.createElement('button');
  copyDebugButton.type = 'button';
  copyDebugButton.className = 'menu__action';
  copyDebugButton.textContent = t('sensorStatus.debug.copy');
  debugDetails.append(
    debugSummary,
    debugIntro,
    deviceIdRow,
    lastSampleRow,
    rawAccelRow,
    firmwareTierRow,
    rawStatusBytesRow,
    copyDebugButton,
  );
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
    const tilt = options.getCalibratedTilt();
    readingRow.textContent = t('sensorStatus.reading', {
      value: tilt
        ? `${t('sensorStatus.roll')} ${tilt.rollDeg.toFixed(1)}°, ${t('sensorStatus.pitch')} ${tilt.pitchDeg.toFixed(1)}°`
        : '—',
    });

    wasLowBattery = status ? isLowBattery(status.batteryPercent, wasLowBattery) : false;
    lowBatteryRow.hidden = !wasLowBattery;
    if (wasLowBattery && status) {
      lowBatteryRow.textContent = t('sensorSource.lowBattery', {
        value: `${Math.round(status.batteryPercent)}%`,
      });
    }

    debugDetails.hidden = source !== 'easylevel';
    if (source === 'easylevel') {
      deviceIdRow.textContent = t('sensorStatus.debug.deviceId', {
        value: options.getEasyLevelDeviceId() ?? notAvailable,
      });
      lastSampleRow.textContent = t('sensorStatus.debug.lastSample', {
        value: ageText(options.getEasyLevelLastSampleAt(), performance.now()),
      });
      const rawAccel = options.getEasyLevelRawAccel();
      rawAccelRow.textContent = t('sensorStatus.debug.rawAccel', {
        value: rawAccel ? `${rawAccel.x}, ${rawAccel.y}, ${rawAccel.z}` : notAvailable,
      });
      firmwareTierRow.textContent = t('sensorStatus.debug.firmwareTier', {
        value: status ? String(status.firmwareTier) : notAvailable,
      });
      rawStatusBytesRow.textContent = t('sensorStatus.debug.rawStatusBytes', {
        value: hexBytes(options.getEasyLevelStatusBytes()) ?? notAvailable,
      });
    }
  }

  copyDebugButton.addEventListener('click', () => {
    const status = options.getEasyLevelStatus();
    const rawAccel = options.getEasyLevelRawAccel();
    const text = [
      'Libell EasyLevel debug info',
      `Connection state: ${options.getSensorState()}`,
      `Device ID: ${options.getEasyLevelDeviceId() ?? notAvailable}`,
      `Last sample: ${ageText(options.getEasyLevelLastSampleAt(), performance.now())}`,
      `Raw accelerometer (x/y/z): ${rawAccel ? `${rawAccel.x}, ${rawAccel.y}, ${rawAccel.z}` : notAvailable}`,
      `Firmware tier: ${status ? status.firmwareTier : notAvailable}`,
      `Raw status bytes: ${hexBytes(options.getEasyLevelStatusBytes()) ?? notAvailable}`,
    ].join('\n');
    void navigator.clipboard.writeText(text).then(
      () => showToast(t('sensorStatus.debug.copied')),
      () => showToast(t('sensorStatus.debug.copy.failed')),
    );
  });

  refresh();
  return {
    element: page.element,
    isOpen: page.isOpen,
    open: page.open,
    close: page.close,
    refresh,
  };
}
