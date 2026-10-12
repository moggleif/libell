/**
 * EasyLevel BLE box — an `OrientationSensor` (ADR 0014) alongside the phone
 * sensor and `?demo`. Always opt-in from the menu; never replaces the phone
 * sensor automatically. Byte parsing lives in `easyLevelProtocol.ts`; the
 * transport is injected so the state machine is testable without a box or
 * `navigator.bluetooth`.
 *
 * Protocol (reverse-engineered from the official app):
 * - GATT service `faf52c20-...` is discovered only after connecting; the scan
 *   filter uses `EASYLEVEL_ADVERTISED_SERVICE_UUID`. `faf52c21-...` (NOTIFY)
 *   carries the raw accel/gyro payload.
 * - `faf52c22-...` (NOTIFY/READ) carries firmware version, battery,
 *   temperature and calibration bytes. Subscribed best-effort: only
 *   `faf52c21-...` is required for leveling; without status, readings simply
 *   go uncalibrated.
 * - No encryption, no WRITE characteristic.
 *
 * **Startup ordering:** status is subscribed *before* accel, matching the
 * official app's post-connect setup, so a box that notifies its status on
 * subscribe is likely calibrated before its first accel sample. That is not
 * guaranteed (enabling notifications is not a value arriving), so
 * `getGravity()` stays `null` until a status notification arrives, status
 * subscription fails, or `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS` elapses.
 *
 * Reconnect: `reconnect()` uses `navigator.bluetooth.getDevices()` plus
 * `gatt.connect()` to reattach to a previously paired box without a picker or
 * user gesture (Chrome/Android). When that is unavailable or fails it fails
 * cleanly — never a new picker, never a loop — leaving the caller to fall back
 * to the gesture-triggered `start()`.
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting } from '../domain/sensorDeviceSettings';
import type { OrientationSensor, SensorState } from './orientation';
import {
  connectWithPicker,
  createEasyLevelLink,
  disconnectByUser,
  reconnectSilently,
} from './easyLevelLink';
import type { EasyLevelStatus } from './easyLevelProtocol';
import {
  createWebBluetoothTransport,
  isEasyLevelAvailable,
  type EasyLevelTransport,
} from './easyLevelTransport';
import type { ExternalSensorDescriptor } from './externalSensors';

/**
 * This box as the registry (ADR 0016) sees it. Battery, temperature and
 * firmware tier come from `faf52c22-...`; mounting is R43, the installation
 * offset R34. Signal strength is absent because no browser can report it.
 */
export const EASYLEVEL_DESCRIPTOR: ExternalSensorDescriptor = {
  id: 'easylevel',
  displayName: 'EasyLevel',
  isAvailable: isEasyLevelAvailable,
  capabilities: {
    battery: true,
    temperature: true,
    firmwareVersion: true,
    mounting: true,
    installCalibration: true,
    debugBytes: true,
    reportedOrientation: false,
    // Limited to the manual's two placements.
    learnMounting: true,
    upright: false,
    zeroesItself: false,
  },
  // Notifications are event-driven, so BLE connection-interval jitter can
  // create larger gaps than the phone's 2s allows for.
  staleTimeoutMs: 4000,
};

export interface EasyLevelSensor extends OrientationSensor {
  /** Raw `faf52c22-...` bytes, for the debug disclosure. */
  getStatusBytes(): Uint8Array | null;
  /** Null until a status notification arrives; cleared on disconnect so a
   * stale reading is never shown as live. */
  getStatus(): EasyLevelStatus | null;
  /** The latest reading before the mounting rotation, for the lift guide. */
  getRawGravity(): GravityVector | null;
  getDeviceId(): string | null;
  /**
   * Silent reconnect: never falls back to the picker (useless outside a click
   * handler). Any failure resolves `'disconnected'`, so the UI's existing
   * "lost connection" handling covers it.
   */
  reconnect(deviceId: string): Promise<SensorState>;
  /** Explicit user disconnect — distinct from an unexpected `gattserverdisconnected`. */
  disconnect(): void;
}

export function createEasyLevelSensor(
  transport: EasyLevelTransport = createWebBluetoothTransport(),
  /** Read on every sample, so a mounting change applies without reconnecting. */
  getMounting: () => EasyLevelMounting = () => 'standard',
  /** Clock seam for tests. */
  now: () => number = () => performance.now(),
): EasyLevelSensor {
  const link = createEasyLevelLink(getMounting, now);
  return {
    start: () => connectWithPicker(link, transport),
    reconnect: (deviceId) => reconnectSilently(link, transport, deviceId),
    getState: () => link.state,
    getGravity: () => link.gravity,
    getRawGravity: () => link.rawGravity,
    getDeviceId: () => link.connection?.deviceId ?? null,
    getSource: () => 'easylevel',
    getLastSampleAt: () => link.lastSampleAt,
    getStatusBytes: () => link.statusBytes,
    getStatus: () => link.status,
    disconnect: () => disconnectByUser(link),
  };
}
