/**
 * A box's own page, reached from its card on the External sensor page.
 * `refresh()` is called every animation frame by `sensorPage.ts` while open.
 */
import type { SensorSource } from '../domain/settings';
import type { Calibration } from '../domain/calibration';
import type { GravityVector } from '../domain/leveling';
import { isLowBattery, type BoxHealth } from '../sensor/boxes';
import type { SensorState } from '../sensor/orientation';
import type { BoxDescriptor } from '../sensor/boxes';
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
  sensor: BoxDescriptor;
  getSensorSource(): SensorSource;
  getSensorState(): SensorState;
  /** Null before anything has arrived. Which fields are rendered is decided
   * by `sensor.capabilities`, not by the value. */
  getHealth(): BoxHealth | null;
  /** The same effective calibration the leveling math uses; null before the
   * first sample. */
  getCalibratedTilt(): Calibration | null;
  getDeviceId(): string | null;
  /** `performance.now()` at this box's own last accepted sample, even while
   * another source is active. */
  getLastSampleAt(): number | null;
  /** As the adapter reports it: the EasyLevel's is raw int16, unscaled. */
  getRawAccel(): GravityVector | null;
  /** The EasyLevel's raw `faf52c22-...` status bytes, or null. */
  getEasyLevelStatusBytes(): Uint8Array | null;
  /**
   * Hardware-compatibility workaround: an extra fixed delay between GATT
   * connect and service discovery, applied only while `enabled`. Read once
   * per page open, never per frame.
   */
  getEasyLevelConnectDelay(): { enabled: boolean; ms: number };
  /** Takes effect on the next EasyLevel connect attempt, by any path. */
  setEasyLevelConnectDelay(enabled: boolean, ms: number): void;
  /**
   * Opens the device picker, so it must run inside the click handler.
   * Without it the page offers no connect button.
   */
  connectSensor?(): Promise<SensorState>;
  /** Defaults to asking the browser itself. */
  offersSilentReconnectTip?(): boolean;
  /** For a box that asks for a password. */
  password?: BoxPasswordOptions;
}

export interface BoxStatusPage {
  element: HTMLElement;
  /** Filled by `sensorPage.ts` with `sensorSourceSection.ts`'s
   * `installElement`. */
  settingsSlot: HTMLElement;
  /** For the box's Disconnect, placed by `sensorPage.ts`. */
  footerSlot: HTMLElement;
  /** The box's position, at the start of the live tilt line. */
  positionSlot: HTMLElement;
  isOpen(): boolean;
  open(): void;
  close(): void;
  /** Cheap enough to call every animation frame while `isOpen()`. */
  refresh(): void;
}

/**
 * `redraw` is the whole page's refresh, so a connect from here shows on
 * every row at once.
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
 * Without `getDevices()` a restarted app needs the device picker again; the
 * Chrome flag that adds it is not something every user should have to
 * learn, so the tip lives here rather than in the reconnect prompt.
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
  // Otherwise the tilt would be the phone's or stale.
  const delivering = connection === 'connected' || connection === 'password';
  parts.liveLine.refresh(delivering ? options.getCalibratedTilt() : null);
  parts.lowBattery.refresh(batteryPercent);
  parts.debug.refresh(isActive, health);
}

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
  // a control that does nothing.
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
  // Opened from within the still-open External sensor page: must paint
  // above it regardless of DOM order.
  page.element.classList.add('sensor-status-page');

  // No signal-strength row: Web Bluetooth exposes RSSI only while
  // advertising, which a connected box has stopped.
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
