/**
 * Sensor source menu page (#116, ADR 0014): "Connect EasyLevel sensor" plus
 * the detailed health status added by #129 — the only working
 * `sensorSource` choice beyond the phone's own built-in sensor. Only ever
 * added to the menu when Web Bluetooth exists (`menu.ts` checks
 * `isWebBluetoothSupported()` before calling `createSensorSourceSection`) —
 * never a silent failure on Safari/iOS, per #116's acceptance criteria.
 *
 * #129 adds the connection-state text distinguishing a live connection from
 * one that dropped (previously both read as "connected", #116's original
 * minimal scope), plus battery/RSSI/temperature rows. Those are always
 * shown as "not available yet": `faf52c22-...`'s bytes beyond the firmware
 * version are undecoded (#116, deferred to #123) and there is no reliable,
 * cross-browser way to read RSSI from Web Bluetooth — this page must never
 * fabricate a number for any of the three.
 */
import type { SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t } from './i18n';

export interface SensorSourceOptions {
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /**
   * The active sensor's current state (#129) — in particular
   * `'disconnected'`, reached when a previously-granted EasyLevel
   * connection drops while it stays the selected source (see
   * `easyLevelSensor.ts`'s `onGattDisconnected`).
   */
  getSensorState(): SensorState;
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

  // Detailed health (#129): only meaningful once the box is (or was) the
  // active source — hidden entirely while the phone's own sensor is
  // active, same as the main-screen indicator this page is reached from.
  const detail = document.createElement('div');
  detail.className = 'menu__detail';
  detail.hidden = true;
  const detailHeading = document.createElement('h3');
  detailHeading.className = 'menu__heading';
  detailHeading.textContent = t('sensorSource.detail.heading');
  const notAvailable = t('sensorSource.detail.notAvailable');
  function detailRow(
    labelKey:
      | 'sensorSource.detail.battery'
      | 'sensorSource.detail.rssi'
      | 'sensorSource.detail.temperature',
  ): HTMLParagraphElement {
    const row = document.createElement('p');
    row.className = 'menu__text';
    row.textContent = t(labelKey, { value: notAvailable });
    return row;
  }
  detail.append(
    detailHeading,
    detailRow('sensorSource.detail.battery'),
    detailRow('sensorSource.detail.rssi'),
    detailRow('sensorSource.detail.temperature'),
  );
  body.append(detail);

  /** Button labels/visibility only — never touches `status`, so an
   * in-flight connect's status text survives a `refresh()` call. */
  function refreshButtons(): void {
    const connected = options.getSensorSource() === 'easylevel';
    connectButton.textContent = connected ? t('sensorSource.reconnect') : t('sensorSource.connect');
    disconnectButton.hidden = !connected;
  }

  function refresh(): void {
    refreshButtons();
    const active = options.getSensorSource() === 'easylevel';
    status.textContent = !active
      ? t('sensorSource.status.phone')
      : options.getSensorState() === 'disconnected'
        ? t('sensorSource.status.disconnected')
        : t('sensorSource.status.connected');
    detail.hidden = !active;
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
