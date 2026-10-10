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
import {
  MAX_EASYLEVEL_CONNECT_DELAY_MS,
  type Calibration,
  type SensorSource,
} from '../domain/settings';
import type { GravityVector } from '../domain/leveling';
import { isLowBattery, type ExternalSensorHealth } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { CHROME_FLAGS_ADDRESS, offersSilentReconnectTip } from '../sensor/silentReconnect';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';
import { showToast } from './toast';

export interface EasyLevelStatusOptions {
  /** The external source this page describes (#262) — its `displayName`
   * fills the page title and the connection text (#267). */
  sensor: ExternalSensorDescriptor;
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /** The active sensor's current state. */
  getSensorState(): SensorState;
  /** This source's own health — battery, temperature, firmware label
   * (#268) — or null before anything has arrived. Which of its fields are
   * rendered is decided by `sensor.capabilities`, not by the value. */
  getHealth(): ExternalSensorHealth | null;
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
  /**
   * Debug hardware-compatibility workaround (#212): whether an extra fixed
   * delay is inserted between GATT connect and service discovery, and
   * what it's currently set to (only applied while `enabled`). Read once
   * per page open, not every `refresh()` frame — see this file's own
   * comment on `syncConnectDelay` for why.
   */
  getEasyLevelConnectDelay(): { enabled: boolean; ms: number };
  /** Persists a new enabled/delay pair (#212) — takes effect on the very
   * next EasyLevel connect attempt, by any path. */
  setEasyLevelConnectDelay(enabled: boolean, ms: number): void;
  /**
   * Connect (or reconnect) this box from its own page (#314) — the device
   * picker, so it must run inside the button's click handler. Optional:
   * without it the page shows the state but offers no button.
   */
  connectSensor?(): Promise<SensorState>;
  /** Whether to offer the silent-reconnect tip (#310); defaults to asking
   * the browser itself. */
  offersSilentReconnectTip?(): boolean;
}

export interface EasyLevelStatusPage {
  element: HTMLElement;
  /** Container for this sensor's own settings blocks (#226) — the
   * mounting picker and installation offset, appended by `sensorPage.ts`
   * from `sensorSourceSection.ts`'s `installElement`. Sits below the
   * live detail rows and above the debug disclosure. */
  settingsSlot: HTMLElement;
  /** Inside the collapsed "More" disclosure (#314): the rarely needed
   * actions `sensorSourceSection.ts` builds, placed by `sensorPage.ts`. */
  moreSlot: HTMLElement;
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

  const page = createStandalonePage(
    t('sensorStatus.title', { name: options.sensor.displayName }),
    () => {
      syncConnectDelay();
      refresh();
    },
  );
  // Opened from within the (still-open) External sensor page — needs to
  // paint above it, not just rely on DOM append order elsewhere.
  page.element.classList.add('sensor-status-page');

  // The header (#314, the #309 UX review): the connection state in a few
  // words, and — whenever the box is not delivering — the one button that
  // fixes it, right here. This page used to tell the user to tap a
  // Reconnect button that only existed on the list page above it.
  const header = document.createElement('div');
  header.className = 'box-header';
  const stateRow = document.createElement('p');
  stateRow.className = 'menu__text menu__text--status box-header__state';
  const stateDot = document.createElement('span');
  stateDot.className = 'box-header__dot';
  stateDot.setAttribute('aria-hidden', 'true');
  const stateText = document.createElement('span');
  stateRow.append(stateDot, stateText);
  const connectButton = document.createElement('button');
  connectButton.type = 'button';
  connectButton.className = 'menu__action';
  connectButton.hidden = true;
  let connecting = false;
  connectButton.addEventListener('click', () => {
    if (!options.connectSensor) return;
    connecting = true;
    refresh();
    void options.connectSensor().finally(() => {
      connecting = false;
      refresh();
    });
  });
  header.append(stateRow, connectButton);
  // No signal-strength row (#228). Web Bluetooth exposes RSSI only through
  // `advertisementreceived` (via `watchAdvertisements()`), never for an
  // established GATT connection — and a BLE peripheral generally stops
  // advertising once connected, which is exactly the state this page is
  // open in. So there is nothing to measure here, ever.
  const batteryRow = document.createElement('p');
  batteryRow.className = 'menu__text';
  // The orientation the box keeps itself (R49, #290): read-only, since it
  // is changed in the vendor app, but worth seeing.
  const orientationRow = document.createElement('p');
  orientationRow.className = 'menu__text';
  const temperatureRow = document.createElement('p');
  temperatureRow.className = 'menu__text';
  const readingRow = document.createElement('p');
  readingRow.className = 'menu__text';
  // A plain threshold + hysteresis band (#123's `isLowBattery`).
  const lowBatteryRow = document.createElement('p');
  lowBatteryRow.className = 'menu__text menu__text--warning';
  lowBatteryRow.hidden = true;
  let wasLowBattery = false;
  const capabilities = options.sensor.capabilities;
  page.body.append(header, readingRow);
  if (capabilities.battery) page.body.append(lowBatteryRow);

  // This sensor's own setup (#226, #314): the checklist built by
  // `sensorSourceSection.ts` and placed here by `sensorPage.ts`.
  const settingsSlot = document.createElement('div');
  page.body.append(settingsSlot);

  // "More" (#314): everything a user rarely needs, collapsed — the
  // secondary actions, the detail rows, and the debug info.
  const moreDetails = document.createElement('details');
  moreDetails.className = 'menu__detail box-more';
  const moreSummary = document.createElement('summary');
  moreSummary.className = 'sensor-status__debug-summary';
  moreSummary.textContent = t('box.more');
  const moreSlot = document.createElement('div');
  moreDetails.append(moreSummary, moreSlot);
  // Only the rows this device can actually fill (#268, ADR 0016).
  if (capabilities.battery) moreDetails.append(batteryRow);
  if (capabilities.temperature) moreDetails.append(temperatureRow);
  if (capabilities.reportedOrientation) moreDetails.append(orientationRow);
  page.body.append(moreDetails);

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

  // Connect-delay workaround (#212): an experimental hardware-
  // compatibility knob, not a normal setting, so it lives here rather
  // than the settings panel. Reuses `.settings__field`/`.settings__checkbox`
  // as-is (same look as the settings form's own toggles) rather than
  // inventing a parallel style for one control.
  const connectDelayHint = document.createElement('p');
  connectDelayHint.className = 'settings__hint';
  connectDelayHint.textContent = t('sensorStatus.debug.connectDelay.intro');
  const connectDelayEnableField = document.createElement('label');
  connectDelayEnableField.className = 'settings__field';
  const connectDelayEnableCaption = document.createElement('span');
  connectDelayEnableCaption.textContent = t('sensorStatus.debug.connectDelay.enable');
  const connectDelayEnableInput = document.createElement('input');
  connectDelayEnableInput.type = 'checkbox';
  connectDelayEnableInput.className = 'settings__checkbox';
  connectDelayEnableField.append(connectDelayEnableCaption, connectDelayEnableInput);
  const connectDelayMsField = document.createElement('label');
  connectDelayMsField.className = 'settings__field';
  const connectDelayMsCaption = document.createElement('span');
  connectDelayMsCaption.textContent = t('sensorStatus.debug.connectDelay.ms');
  const connectDelayMsInput = document.createElement('input');
  connectDelayMsInput.type = 'number';
  connectDelayMsInput.min = '0';
  connectDelayMsInput.max = String(MAX_EASYLEVEL_CONNECT_DELAY_MS);
  connectDelayMsInput.step = '50';
  connectDelayMsField.append(connectDelayMsCaption, connectDelayMsInput);

  debugDetails.append(debugSummary, debugIntro, deviceIdRow, lastSampleRow, rawAccelRow);
  if (capabilities.firmwareVersion) debugDetails.append(firmwareTierRow);
  if (capabilities.debugBytes) debugDetails.append(rawStatusBytesRow);
  debugDetails.append(
    copyDebugButton,
    connectDelayHint,
    connectDelayEnableField,
    connectDelayMsField,
  );
  // The whole disclosure, not just its rows: its contents — raw protocol
  // bytes, the raw accelerometer triplet, the #212 connect-delay
  // workaround — are one device's own debug surface, and a source without
  // them would show a disclosure full of dashes and a control that does
  // nothing (#272).
  if (capabilities.debugBytes) moreDetails.append(debugDetails);

  // Silent-reconnect tip (#310): for any box, closed by default, and only
  // in a Chromium browser off iOS that has Web Bluetooth but not
  // `getDevices()` (never Bluefy on iPhone: no `chrome://flags`). Without
  // it a restarted app needs the device picker again (#307); the flag that
  // adds it is not something every user should have to learn, so it lives
  // here rather than in the reconnect prompt.
  if ((options.offersSilentReconnectTip ?? offersSilentReconnectTip)()) {
    const advanced = document.createElement('details');
    advanced.className = 'menu__detail sensor-status__advanced';
    const advancedSummary = document.createElement('summary');
    advancedSummary.className = 'sensor-status__debug-summary';
    advancedSummary.textContent = t('sensorStatus.advanced');
    const tipIntro = document.createElement('p');
    tipIntro.className = 'menu__text';
    tipIntro.textContent = t('sensorStatus.silentReconnect.intro');
    const tipSteps = document.createElement('p');
    tipSteps.className = 'menu__text';
    tipSteps.textContent = t('sensorStatus.silentReconnect.steps', {
      address: CHROME_FLAGS_ADDRESS,
    });
    const copyFlagsButton = document.createElement('button');
    copyFlagsButton.type = 'button';
    copyFlagsButton.className = 'menu__action menu__action--secondary';
    copyFlagsButton.textContent = t('sensorStatus.silentReconnect.copy', {
      address: CHROME_FLAGS_ADDRESS,
    });
    copyFlagsButton.addEventListener('click', () => {
      void navigator.clipboard.writeText(CHROME_FLAGS_ADDRESS).then(
        () => showToast(t('sensorStatus.silentReconnect.copied')),
        () => showToast(t('sensorStatus.debug.copy.failed')),
      );
    });
    advanced.append(advancedSummary, tipIntro, tipSteps, copyFlagsButton);
    page.body.append(advanced);
  }

  /**
   * Reads the stored connect-delay setting into the two controls above —
   * called once per page open (from `createStandalonePage`'s `onOpen`
   * below), deliberately NOT from `refresh()`: `refresh()` runs every
   * animation frame while this page is open, and re-asserting `.value`/
   * `.checked` on every frame would fight the user mid-edit (a keystroke
   * into the ms field getting reset before the next one lands). The
   * read-only debug rows above have no such problem — nothing ever types
   * into them — so only these two controls need this split.
   */
  function syncConnectDelay(): void {
    const { enabled, ms } = options.getEasyLevelConnectDelay();
    connectDelayEnableInput.checked = enabled;
    connectDelayMsInput.value = String(ms);
    connectDelayMsInput.disabled = !enabled;
  }

  function commitConnectDelay(): void {
    connectDelayMsInput.disabled = !connectDelayEnableInput.checked;
    options.setEasyLevelConnectDelay(
      connectDelayEnableInput.checked,
      Number(connectDelayMsInput.value),
    );
  }
  connectDelayEnableInput.addEventListener('change', commitConnectDelay);
  connectDelayMsInput.addEventListener('change', commitConnectDelay);

  function refresh(): void {
    const source = options.getSensorSource();
    const state = options.getSensorState();
    const isActive = source === options.sensor.id;
    const lost = isActive && state === 'disconnected';
    stateRow.classList.toggle('is-connected', isActive && !lost);
    stateRow.classList.toggle('is-lost', lost);

    const health = isActive ? options.getHealth() : null;
    const batteryKnown = capabilities.battery && health?.batteryPercent != null;
    stateText.textContent = !isActive
      ? t('box.state.notConnected')
      : lost
        ? t('box.state.lost')
        : batteryKnown
          ? `${t('box.state.connected')} · ${t('box.state.battery', {
              value: `${Math.round(health?.batteryPercent ?? 0)} %`,
            })}`
          : t('box.state.connected');
    connectButton.hidden = !options.connectSensor || (isActive && !lost);
    connectButton.disabled = connecting;
    connectButton.textContent = connecting
      ? t('sensorSource.status.connecting')
      : isActive
        ? t('sensorFallback.retry')
        : t('box.connect');
    const batteryPercent = health?.batteryPercent ?? null;
    batteryRow.textContent = t('sensorSource.detail.battery', {
      value: batteryPercent === null ? notAvailable : `${Math.round(batteryPercent)}%`,
    });
    temperatureRow.textContent = t('sensorSource.detail.temperature', {
      value:
        health?.temperatureCelsius == null
          ? notAvailable
          : `${health.temperatureCelsius.toFixed(1)}°C`,
    });
    const orientation = health?.reportedOrientation ?? null;
    orientationRow.textContent = t('sensorSource.detail.orientation', {
      value: orientation === null ? notAvailable : t(`sensorSource.orientation.${orientation}`),
    });
    const tilt = options.getCalibratedTilt();
    readingRow.textContent = t('sensorStatus.reading', {
      value: tilt
        ? `${t('tilt.sideSide')} ${tilt.rollDeg.toFixed(1)}° · ${t('tilt.frontBack')} ${tilt.pitchDeg.toFixed(1)}°`
        : '—',
    });

    wasLowBattery = batteryPercent === null ? false : isLowBattery(batteryPercent, wasLowBattery);
    lowBatteryRow.hidden = !wasLowBattery;
    if (wasLowBattery && batteryPercent !== null) {
      lowBatteryRow.textContent = t('sensorSource.lowBattery', {
        value: `${Math.round(batteryPercent)}%`,
      });
    }

    debugDetails.hidden = !isActive;
    if (isActive) {
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
        value: health?.firmwareLabel ?? notAvailable,
      });
      rawStatusBytesRow.textContent = t('sensorStatus.debug.rawStatusBytes', {
        value: hexBytes(options.getEasyLevelStatusBytes()) ?? notAvailable,
      });
    }
  }

  copyDebugButton.addEventListener('click', () => {
    const health = options.getHealth();
    const rawAccel = options.getEasyLevelRawAccel();
    const text = [
      `Libell ${options.sensor.displayName} debug info`,
      `Connection state: ${options.getSensorState()}`,
      `Device ID: ${options.getEasyLevelDeviceId() ?? notAvailable}`,
      `Last sample: ${ageText(options.getEasyLevelLastSampleAt(), performance.now())}`,
      `Raw accelerometer (x/y/z): ${rawAccel ? `${rawAccel.x}, ${rawAccel.y}, ${rawAccel.z}` : notAvailable}`,
      `Firmware: ${health?.firmwareLabel ?? notAvailable}`,
      `Raw status bytes: ${hexBytes(options.getEasyLevelStatusBytes()) ?? notAvailable}`,
    ].join('\n');
    void navigator.clipboard.writeText(text).then(
      () => showToast(t('sensorStatus.debug.copied')),
      () => showToast(t('sensorStatus.debug.copy.failed')),
    );
  });

  syncConnectDelay();
  refresh();
  return {
    element: page.element,
    settingsSlot,
    moreSlot,
    isOpen: page.isOpen,
    open: page.open,
    close: page.close,
    refresh,
  };
}
