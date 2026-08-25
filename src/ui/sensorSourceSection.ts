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
 * minimal scope), plus battery/RSSI/temperature rows. #123 decodes
 * `faf52c22-...`'s battery and temperature bytes (`easyLevelProtocol.ts`'s
 * `parseEasyLevelStatus`), so those two now show real values once the first
 * status notification arrives — "not available yet" only in the brief
 * window before that, or before EasyLevel has ever connected. Signal
 * strength stays "not available yet": there is no reliable, cross-browser
 * way to read RSSI from Web Bluetooth — this page must never fabricate a
 * number for it.
 *
 * #123 also adds a low-battery warning here (not a leveling-screen
 * interruption): a plain threshold with a hysteresis band
 * (`easyLevelProtocol.ts`'s `isLowBattery`) so it doesn't flicker right at
 * the line, shown only on this settings page and only while EasyLevel is
 * the active source.
 *
 * #131 adds the installation-offset block below the health details: once
 * the box is permanently mounted, its own physical orientation stops
 * mattering — the same "vehicle zero" concept R24 already gives the phone
 * (ADR 0010), generalized to this external source per ADR 0014's three-way
 * calibration split. It lives on this page, not inside the Calibration
 * menu section, because it only makes sense once EasyLevel is (or was)
 * connected — same rule the health-detail block above already follows.
 */
import type { Calibration, SensorSource } from '../domain/settings';
import { isLowBattery, type EasyLevelStatus } from '../sensor/easyLevelProtocol';
import type { SensorState } from '../sensor/orientation';
import { ageText } from './calibrationAge';
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
  /** `faf52c22-...` parsed into battery/temperature/firmware-tier (#123),
   * or null before the first status notification arrives. */
  getEasyLevelStatus(): EasyLevelStatus | null;
  /**
   * The box's installation offset (#131, ADR 0014) — where the
   * permanently-mounted enclosure physically sits, mirroring
   * `CalibrationOptions.getVehicleCalibration()` but stored completely
   * independently: this is never the phone's own vehicle zero.
   */
  getInstallCalibration(): Calibration | null;
  /** Capture the current reading as this box's installation offset ("Set vehicle level"). Returns an error text, or null on success. */
  calibrateInstall(): string | null;
  /** When the installation offset was captured (R26) — null when unknown. */
  getInstallCalibrationCapturedAt(): number | null;
  /** Compare the current reading against the installation offset's promise of zero — returns a verdict text (R26). */
  checkInstallCalibration(): string;
  clearInstallCalibration(): void;
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

  const connectButton = document.createElement('button');
  connectButton.type = 'button';
  connectButton.className = 'menu__action';
  body.append(connectButton);

  // The listed sensor + its disconnect action, side by side (screen-cleanup
  // follow-up): "Disconnect" now reads as belonging to the connected
  // sensor named beside it, instead of being a second stray full-width
  // button underneath "Connect" — and hidden entirely whenever there is no
  // sensor connected to disconnect (unchanged rule, just relocated).
  const sensorRow = document.createElement('div');
  sensorRow.className = 'sensor-row';
  const status = document.createElement('p');
  status.className = 'menu__text menu__text--status';
  const disconnectButton = document.createElement('button');
  disconnectButton.type = 'button';
  disconnectButton.className = 'menu__action menu__action--secondary menu__action--inline';
  disconnectButton.textContent = t('sensorSource.disconnect');
  sensorRow.append(status, disconnectButton);
  body.append(sensorRow);

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
  const batteryRow = document.createElement('p');
  batteryRow.className = 'menu__text';
  const rssiRow = document.createElement('p');
  rssiRow.className = 'menu__text';
  // Signal strength genuinely never becomes available (no reliable,
  // cross-browser way to read RSSI from Web Bluetooth) — set once, unlike
  // battery/temperature below which `refresh()` keeps live.
  rssiRow.textContent = t('sensorSource.detail.rssi', { value: notAvailable });
  const temperatureRow = document.createElement('p');
  temperatureRow.className = 'menu__text';
  // Low-battery warning (#123): a plain threshold + hysteresis band, not a
  // full dead-band/dwell stabilizer — see `isLowBattery`'s doc comment.
  // Hidden whenever it doesn't apply, never removed from the layout.
  const lowBatteryRow = document.createElement('p');
  lowBatteryRow.className = 'menu__text menu__text--warning';
  lowBatteryRow.hidden = true;
  let wasLowBattery = false;
  detail.append(detailHeading, batteryRow, rssiRow, temperatureRow, lowBatteryRow);
  body.append(detail);

  /** Battery/temperature (#123) — refreshed every `refresh()` call, unlike
   * the fixed rssiRow above, since a status notification can arrive at any
   * time while this page is open. */
  function refreshStatus(): void {
    const easyLevelStatus = options.getEasyLevelStatus();
    batteryRow.textContent = t('sensorSource.detail.battery', {
      value: easyLevelStatus ? `${Math.round(easyLevelStatus.batteryPercent)}%` : notAvailable,
    });
    temperatureRow.textContent = t('sensorSource.detail.temperature', {
      value: easyLevelStatus ? `${easyLevelStatus.temperatureCelsius.toFixed(1)}°C` : notAvailable,
    });
    wasLowBattery = easyLevelStatus
      ? isLowBattery(easyLevelStatus.batteryPercent, wasLowBattery)
      : false;
    lowBatteryRow.hidden = !wasLowBattery;
    if (wasLowBattery && easyLevelStatus) {
      lowBatteryRow.textContent = t('sensorSource.lowBattery', {
        value: `${Math.round(easyLevelStatus.batteryPercent)}%`,
      });
    }
  }

  // Installation calibration (#131, ADR 0014): the same "vehicle zero"
  // concept R24 already gives the phone (ADR 0010), generalized to this
  // permanently-mounted external sensor — its own independent stored
  // offset (`getInstallCalibration`/`calibrateInstall`/...), never the
  // phone's. Visible under the same rule as the health-detail block above:
  // whenever EasyLevel is (or was) the active source, connected or not —
  // capturing while disconnected simply surfaces the ordinary "not
  // running" error `readTilt`-based captures already give elsewhere.
  const installSection = document.createElement('div');
  installSection.hidden = true;
  const installHeading = document.createElement('h3');
  installHeading.className = 'menu__heading';
  installHeading.textContent = t('sensorSource.install.h');
  const installIntro = document.createElement('p');
  installIntro.className = 'menu__text';
  installIntro.textContent = t('sensorSource.install.intro');
  const installStatus = document.createElement('p');
  installStatus.className = 'menu__text menu__text--status';
  const installButton = document.createElement('button');
  installButton.type = 'button';
  installButton.className = 'menu__action';
  installButton.textContent = t('sensorSource.install.now');
  const installCheckButton = document.createElement('button');
  installCheckButton.type = 'button';
  installCheckButton.className = 'menu__action menu__action--secondary';
  installCheckButton.textContent = t('calibration.check');
  const installClearButton = document.createElement('button');
  installClearButton.type = 'button';
  installClearButton.className = 'menu__action menu__action--secondary';
  installClearButton.textContent = t('sensorSource.install.clear');
  installSection.append(
    installHeading,
    installIntro,
    installButton,
    installStatus,
    installCheckButton,
    installClearButton,
  );
  body.append(installSection);

  /** Same status/age/disabled-buttons pattern as the phone's vehicle zero
   * (R26) — reused wording via `sensorSource.install.*` and the shared
   * `ageText` helper rather than a one-off implementation. */
  function refreshInstall(error?: string): void {
    const offset = options.getInstallCalibration();
    if (error) {
      installStatus.textContent = error;
    } else if (offset) {
      installStatus.textContent =
        t('sensorSource.install.status', {
          roll: offset.rollDeg.toFixed(1),
          pitch: offset.pitchDeg.toFixed(1),
        }) + ageText(options.getInstallCalibrationCapturedAt());
    } else {
      installStatus.textContent = t('sensorSource.install.status.none');
    }
    installClearButton.disabled = !offset;
    installCheckButton.disabled = !offset;
  }

  installButton.addEventListener('click', () => {
    refreshInstall(options.calibrateInstall() ?? undefined);
  });
  installCheckButton.addEventListener('click', () => {
    refreshInstall(options.checkInstallCalibration());
  });
  installClearButton.addEventListener('click', () => {
    options.clearInstallCalibration();
    refreshInstall();
  });

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
    installSection.hidden = !active;
    if (active) {
      refreshInstall();
      refreshStatus();
    } else {
      // Never carry a stale "low" latch into a future EasyLevel session.
      wasLowBattery = false;
      lowBatteryRow.hidden = true;
    }
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
