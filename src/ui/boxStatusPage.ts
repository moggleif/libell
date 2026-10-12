/**
 * Sensor status page: reached by tapping the sensor row on the External
 * sensor page (`sensorSourceSection.ts`). A deeper, single-purpose view of
 * whatever is currently feeding gravity readings — battery, temperature and
 * a live roll/pitch reading up top, refreshed continuously while this page
 * is open (`refresh()` is called every animation frame by `sensorPage.ts`'s
 * `refreshLive()`, the same "runs every frame regardless of what's open"
 * pattern `main.ts` already uses for the top-bar sensor-status dot).
 *
 * The primary rows work for every box. The "Debug info" disclosure below
 * them does not (design review — the earlier version embedded the
 * universal, sensor-agnostic Diagnostics page here, which was cut entirely
 * for being too generic to earn its keep): it is drawn only for a box whose
 * descriptor has the `debugBytes` capability (today the EasyLevel), hidden
 * while the phone's own sensor is active, and shows raw values straight
 * off the box — device id, last-sample age, the raw accel triplet,
 * firmware tier, and the raw status-characteristic bytes as hex — the kind
 * of detail that matters when a box isn't behaving as expected (wrong
 * reading, no data arriving, an unfamiliar firmware tier), not everyday
 * reading material.
 *
 * Battery/temperature reuse the exact `sensorSource.detail.*` wording
 * `sensorSourceSection.ts` already shows inline on the External sensor
 * page — same values, same strings, just repeated here for a focused view
 * that doesn't require battery/temperature to share space with the
 * connect/disconnect controls.
 */
import type { Calibration, SensorSource } from '../domain/settings';
import type { GravityVector } from '../domain/leveling';
import { isLowBattery, type ExternalSensorHealth } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { CHROME_FLAGS_ADDRESS, offersSilentReconnectTip } from '../sensor/silentReconnect';
import { createBoxDebugDisclosure, type BoxDebugDisclosure } from './boxDebugDisclosure';
import {
  createBoxPasswordBlock,
  type BoxPasswordBlock,
  type BoxPasswordOptions,
} from './boxPasswordBlock';
import { boxConnection, type BoxConnection } from './boxConnection';
import { connectButtonText, headerText, showsConnectButton, tiltLineText } from './boxStatusText';
import { createElement } from './dom';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';
import { showToast } from './toast';

export interface BoxStatusOptions {
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
   * math itself uses — or null before the first sample. Shown for every
   * box, unlike the debug fields below. */
  getCalibratedTilt(): Calibration | null;
  /** This box's Web Bluetooth device id (#130), or null. */
  getDeviceId(): string | null;
  /** `performance.now()` at this box's last accepted sample, or null —
   * the box's own value, not whichever source happens to be active, so
   * this still means something while the phone sensor is the active
   * source but the box was connected before. */
  getLastSampleAt(): number | null;
  /** The accel triplet as this box's adapter reports it (the EasyLevel's
   * is raw int16, unscaled — see `easyLevelProtocol.ts`), or null. */
  getRawAccel(): GravityVector | null;
  /** The EasyLevel's raw `faf52c22-...` status bytes, or null. */
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
  /** The box's password (#367), for a box that asks for one: while it is
   * rejected the header says so, never "Connected", and the way to type
   * the right code sits right under it. */
  password?: BoxPasswordOptions;
}

export interface BoxStatusPage {
  element: HTMLElement;
  /** Container for this sensor's own settings blocks (#226) — the
   * mounting picker and installation offset, appended by `sensorPage.ts`
   * from `sensorSourceSection.ts`'s `installElement`. Sits below the
   * live detail rows and above the debug disclosure. */
  settingsSlot: HTMLElement;
  /** Under the checklist (#332): the box's Disconnect, built by
   * `sensorSourceSection.ts` and placed by `sensorPage.ts`. There is no
   * "More" any more; every action sits where it belongs. */
  footerSlot: HTMLElement;
  /** At the start of the live line (#332): the box's position ("✓ Stands
   * upright"), so position and tilt read as one status line. */
  positionSlot: HTMLElement;
  isOpen(): boolean;
  open(): void;
  close(): void;
  /** Re-reads every live value — cheap enough to call every animation
   * frame while `isOpen()`, same discipline `sensorPage.ts`'s
   * `refreshLive()` follows. */
  refresh(): void;
}

/**
 * The header (#314, the #309 UX review): the connection state in a few
 * words, and — whenever the box is not delivering — the one button that
 * fixes it, right here. `redraw` is the whole page's refresh, so a connect
 * from here shows on every row at once.
 */
function createHeader(
  connectSensor: (() => Promise<SensorState>) | undefined,
  redraw: () => void,
): {
  element: HTMLElement;
  refresh(connection: BoxConnection, batteryPercent: number | null): void;
} {
  const element = createElement('div', 'box-header');
  const stateRow = createElement('p', 'menu__text menu__text--status box-header__state');
  const stateDot = createElement('span', 'box-header__dot');
  stateDot.setAttribute('aria-hidden', 'true');
  const stateText = document.createElement('span');
  stateRow.append(stateDot, stateText);
  const connectButton = createElement('button', 'menu__action');
  connectButton.type = 'button';
  connectButton.hidden = true;
  element.append(stateRow, connectButton);

  let connecting = false;
  connectButton.addEventListener('click', () => {
    if (!connectSensor) return;
    connecting = true;
    redraw();
    void connectSensor().finally(() => {
      connecting = false;
      redraw();
    });
  });

  function refresh(connection: BoxConnection, batteryPercent: number | null): void {
    stateRow.classList.toggle('is-connected', connection === 'connected');
    stateRow.classList.toggle('is-lost', connection === 'lost' || connection === 'password');
    stateText.textContent = headerText(connection, batteryPercent);
    connectButton.hidden = !showsConnectButton(Boolean(connectSensor), connection);
    connectButton.disabled = connecting;
    connectButton.textContent = connectButtonText(connecting, connection !== 'notConnected');
  }
  return { element, refresh };
}

/** One live status line (#332): the box's position, then its tilt. */
function createLiveLine(): {
  element: HTMLElement;
  positionSlot: HTMLElement;
  refresh(tilt: Calibration | null): void;
} {
  const element = createElement('p', 'menu__text box-live');
  const positionSlot = createElement('span', 'box-live__position');
  const tiltText = document.createElement('span');
  element.append(positionSlot, tiltText);
  function refresh(tilt: Calibration | null): void {
    const hasPosition = [...positionSlot.children].some((c) => !(c as HTMLElement).hidden);
    tiltText.textContent = tiltLineText(tilt, hasPosition);
  }
  return { element, positionSlot, refresh };
}

/** A plain threshold + hysteresis band (#123's `isLowBattery`). */
function createLowBatteryRow(): {
  element: HTMLElement;
  refresh(batteryPercent: number | null): void;
} {
  const element = createElement('p', 'menu__text menu__text--warning');
  element.hidden = true;
  let wasLow = false;
  function refresh(batteryPercent: number | null): void {
    wasLow = batteryPercent === null ? false : isLowBattery(batteryPercent, wasLow);
    element.hidden = !wasLow;
    if (wasLow && batteryPercent !== null) {
      element.textContent = t('sensorSource.lowBattery', {
        value: `${Math.round(batteryPercent)}%`,
      });
    }
  }
  return { element, refresh };
}

/**
 * Silent-reconnect tip (#310): for any box, closed by default, and only in
 * a Chromium browser off iOS that has Web Bluetooth but not `getDevices()`
 * (never Bluefy on iPhone: no `chrome://flags`). Without it a restarted app
 * needs the device picker again (#307); the flag that adds it is not
 * something every user should have to learn, so it lives here rather than
 * in the reconnect prompt.
 */
function createSilentReconnectTip(): HTMLElement {
  const element = createElement('details', 'menu__detail sensor-status__advanced');
  const summary = createElement('summary', 'sensor-status__debug-summary');
  summary.textContent = t('sensorStatus.advanced');
  const intro = createElement('p', 'menu__text');
  intro.textContent = t('sensorStatus.silentReconnect.intro');
  const steps = createElement('p', 'menu__text');
  steps.textContent = t('sensorStatus.silentReconnect.steps', { address: CHROME_FLAGS_ADDRESS });
  const copyButton = createElement('button', 'menu__action menu__action--secondary');
  copyButton.type = 'button';
  copyButton.textContent = t('sensorStatus.silentReconnect.copy', {
    address: CHROME_FLAGS_ADDRESS,
  });
  copyButton.addEventListener('click', () => {
    void navigator.clipboard.writeText(CHROME_FLAGS_ADDRESS).then(
      () => showToast(t('sensorStatus.silentReconnect.copied')),
      () => showToast(t('sensorStatus.debug.copy.failed')),
    );
  });
  element.append(summary, intro, steps, copyButton);
  return element;
}

/** Everything on the page that redraws itself from the live values. */
interface LiveParts {
  header: ReturnType<typeof createHeader>;
  passwordBlock: BoxPasswordBlock | null;
  liveLine: ReturnType<typeof createLiveLine>;
  lowBattery: ReturnType<typeof createLowBatteryRow>;
  debug: BoxDebugDisclosure;
}

function refreshLiveParts(options: BoxStatusOptions, parts: LiveParts): void {
  const isActive = options.getSensorSource() === options.sensor.id;
  const connection = boxConnection(
    isActive,
    options.getSensorState(),
    () => options.password?.isRejected() ?? false,
  );
  const health = isActive ? options.getHealth() : null;
  const batteryPercent = health?.batteryPercent ?? null;
  parts.header.refresh(connection, options.sensor.capabilities.battery ? batteryPercent : null);
  parts.passwordBlock?.refresh();
  // Only this box's own reading: while it is not in use, or has lost
  // contact, the tilt would be the phone's or stale, so a dash (#343).
  const delivering = connection === 'connected' || connection === 'password';
  parts.liveLine.refresh(delivering ? options.getCalibratedTilt() : null);
  parts.lowBattery.refresh(batteryPercent);
  parts.debug.refresh(isActive, health);
}

/**
 * Top to bottom: the header, the password fix, the live line, the battery
 * warning, the box's setup (#226, #314) and its Disconnect (#332) — both
 * built by `sensorSourceSection.ts` and placed by `sensorPage.ts` — then
 * the debug info and the silent-reconnect tip.
 */
function appendInOrder(
  body: HTMLElement,
  options: BoxStatusOptions,
  parts: LiveParts,
  slots: { settingsSlot: HTMLElement; footerSlot: HTMLElement },
): void {
  const capabilities = options.sensor.capabilities;
  body.append(parts.header.element);
  if (parts.passwordBlock) body.append(parts.passwordBlock.element);
  body.append(parts.liveLine.element);
  if (capabilities.battery) body.append(parts.lowBattery.element);
  body.append(slots.settingsSlot, slots.footerSlot);
  // A source without raw bytes would show a disclosure full of dashes and
  // a control that does nothing (#272).
  if (capabilities.debugBytes) body.append(parts.debug.element);
  if ((options.offersSilentReconnectTip ?? offersSilentReconnectTip)()) {
    body.append(createSilentReconnectTip());
  }
}

export function createBoxStatusPage(options: BoxStatusOptions): BoxStatusPage {
  const page = createStandalonePage(
    t('sensorStatus.title', { name: options.sensor.displayName }),
    () => {
      parts.debug.syncConnectDelay();
      refresh();
    },
  );
  // Opened from within the (still-open) External sensor page — needs to
  // paint above it, not just rely on DOM append order elsewhere.
  page.element.classList.add('sensor-status-page');

  // No signal-strength row (#228): Web Bluetooth exposes RSSI only while
  // advertising, which a connected box has stopped. No battery row (the
  // header says it) and no row for the box's own mounting setting (the
  // direction step says it), #332.
  const parts: LiveParts = {
    header: createHeader(options.connectSensor, () => refresh()),
    passwordBlock: options.password
      ? createBoxPasswordBlock(options.password, options.sensor.displayName)
      : null,
    liveLine: createLiveLine(),
    lowBattery: createLowBatteryRow(),
    debug: createBoxDebugDisclosure(options),
  };
  const slots = {
    settingsSlot: document.createElement('div'),
    footerSlot: createElement('div', 'box-footer'),
  };
  appendInOrder(page.body, options, parts, slots);
  const refresh = () => refreshLiveParts(options, parts);

  parts.debug.syncConnectDelay();
  refresh();
  return {
    element: page.element,
    ...slots,
    positionSlot: parts.liveLine.positionSlot,
    isOpen: page.isOpen,
    open: page.open,
    close: page.close,
    refresh,
  };
}
