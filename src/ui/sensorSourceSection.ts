/**
 * Sensor source menu page (#116, ADR 0014): a minimal "Connect EasyLevel
 * sensor" entry point — the only working `sensorSource` choice beyond the
 * phone's own built-in sensor. Only ever added to the menu when Web
 * Bluetooth exists (`menu.ts` checks `isWebBluetoothSupported()` before
 * calling `createSensorSourceSection`) — never a silent failure on
 * Safari/iOS, per #116's acceptance criteria.
 *
 * Deliberately minimal: no battery/RSSI/connection-quality UI (#129,
 * #130, #134 — separate issues). This page only connects, shows whether
 * the box or the phone is currently the active source, and disconnects
 * back to the phone.
 */
import type { SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t } from './i18n';

export interface SensorSourceOptions {
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /**
   * Connect (or reconnect) to the box. Must be called directly from this
   * button's click handler — `requestDevice` requires a live user
   * gesture. Resolves to the state reached: 'granted' on success,
   * 'denied' if the picker was cancelled or GATT connect failed,
   * 'unsupported' if Web Bluetooth vanished between page-open and click.
   */
  connectEasyLevel(): Promise<SensorState>;
  /** Explicit disconnect — falls back to the phone sensor. */
  disconnectEasyLevel(): void;
}

export interface SensorSourceSection {
  element: HTMLElement;
  refresh(): void;
}

export function createSensorSourceSection(options: SensorSourceOptions): SensorSourceSection {
  const body = document.createElement('div');

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('sensorSource.intro');
  body.append(intro);

  const status = document.createElement('p');
  status.className = 'menu__text menu__text--status';
  body.append(status);

  const connectButton = document.createElement('button');
  connectButton.type = 'button';
  connectButton.className = 'menu__action';
  body.append(connectButton);

  const disconnectButton = document.createElement('button');
  disconnectButton.type = 'button';
  disconnectButton.className = 'menu__action menu__action--secondary';
  disconnectButton.textContent = t('sensorSource.disconnect');
  body.append(disconnectButton);

  /** Button labels/visibility only — never touches `status`, so an
   * in-flight connect's status text survives a `refresh()` call. */
  function refreshButtons(): void {
    const connected = options.getSensorSource() === 'easylevel';
    connectButton.textContent = connected ? t('sensorSource.reconnect') : t('sensorSource.connect');
    disconnectButton.hidden = !connected;
  }

  function refresh(): void {
    refreshButtons();
    status.textContent =
      options.getSensorSource() === 'easylevel'
        ? t('sensorSource.status.connected')
        : t('sensorSource.status.phone');
  }

  connectButton.addEventListener('click', () => {
    status.textContent = t('sensorSource.status.connecting');
    void options.connectEasyLevel().then((state) => {
      status.textContent =
        state === 'granted'
          ? t('sensorSource.status.connected')
          : state === 'unsupported'
            ? t('sensorSource.err.unsupported')
            : t('sensorSource.err.failed');
      refreshButtons();
    });
  });

  disconnectButton.addEventListener('click', () => {
    options.disconnectEasyLevel();
    refresh();
  });

  refresh();
  return { element: body, refresh };
}
