/**
 * How Libell reaches an EasyLevel box: the transport seam the sensor talks
 * through, and the real Web Bluetooth link behind it. The simulated box
 * (`easyLevelSimulator.ts`) plugs into the same seam.
 */
import { easyLevelSimulationMode } from './easyLevelSimulator';
import { createWebBluetoothLink } from './webBluetoothLink';

export const EASYLEVEL_SERVICE_UUID = 'faf52c20-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_ACCEL_CHARACTERISTIC_UUID = 'faf52c21-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_STATUS_CHARACTERISTIC_UUID = 'faf52c22-5078-11e9-b475-0800200c9a66';
/**
 * The service UUID modern boxes put in their BLE advertisement —
 * `EASYLEVEL_SERVICE_UUID` is never advertised. Taken from the official
 * app's own scan filter.
 */
export const EASYLEVEL_ADVERTISED_SERVICE_UUID = '669a0c20-0008-a7ba-e311-0685c0f7978a';
/**
 * Name prefix of legacy boxes that advertise no service UUID — the official
 * app's own fallback filter.
 */
export const EASYLEVEL_DEVICE_NAME_PREFIX = 'CARATI';

/** Web Bluetooth is Chrome/Android only — never Safari/iOS. */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * EasyLevel can work in this browser: real Web Bluetooth, or the simulated
 * box. The one gate for "does EasyLevel exist here at all";
 * `isWebBluetoothSupported()` stays the real transport's narrower contract.
 */
export function isEasyLevelAvailable(): boolean {
  return isWebBluetoothSupported() || easyLevelSimulationMode() !== 'off';
}

export interface EasyLevelConnection {
  /** Remembered so a later session can find this device via `getDevices()`. */
  readonly deviceId: string;
  subscribeAccel(onData: (view: DataView) => void): Promise<void>;
  /** Best-effort — the box's firmware may not have it. */
  subscribeStatus(onData: (view: DataView) => void): Promise<void>;
  disconnect(): void;
}

/** Thin seam over Web Bluetooth so the state machine can use a fake transport. */
export interface EasyLevelTransport {
  /**
   * Shows the OS device picker and connects GATT. Must run inside a real user
   * gesture — `requestDevice` throws otherwise. `onDisconnect` fires if GATT
   * drops later.
   */
  connect(onDisconnect: () => void): Promise<EasyLevelConnection>;
  /**
   * Silent reconnect via `getDevices()` — no picker, no gesture. Resolves
   * `null` (never rejects) whenever it cannot be done silently.
   */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<EasyLevelConnection | null>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The real Web Bluetooth transport. The picker matches ANY filter: the
 * advertised UUID for modern boxes, the `CARATI` name prefix for legacy ones.
 * `EASYLEVEL_SERVICE_UUID` must be in `optionalServices` — Web Bluetooth
 * blocks any GATT service in neither `filters` nor `optionalServices`.
 *
 * `getConnectDelayMs` is a debug compatibility workaround: an optional pause
 * after GATT connect and before service discovery, for a box that needs time
 * to settle (the official app applies one). Read fresh on every connect.
 */
export function createWebBluetoothTransport(
  getConnectDelayMs: () => number = () => 0,
): EasyLevelTransport {
  return createWebBluetoothLink({
    name: 'EasyLevel',
    requestOptions: {
      filters: [
        { services: [EASYLEVEL_ADVERTISED_SERVICE_UUID] },
        { namePrefix: EASYLEVEL_DEVICE_NAME_PREFIX },
      ],
      optionalServices: [EASYLEVEL_SERVICE_UUID],
    },
    wire: (server) => wireEasyLevel(server, getConnectDelayMs()),
  });
}

/** Each characteristic opens only when the sensor subscribes to it. */
async function wireEasyLevel(
  server: BluetoothRemoteGATTServer,
  connectDelayMs: number,
): Promise<Omit<EasyLevelConnection, 'deviceId' | 'disconnect'>> {
  if (connectDelayMs > 0) await delay(connectDelayMs);
  const service = await server.getPrimaryService(EASYLEVEL_SERVICE_UUID);

  async function subscribe(uuid: string, onData: (view: DataView) => void): Promise<void> {
    const characteristic = await service.getCharacteristic(uuid);
    characteristic.addEventListener('characteristicvaluechanged', () => {
      if (characteristic.value) onData(characteristic.value);
    });
    await characteristic.startNotifications();
  }

  return {
    subscribeAccel: (onData) => subscribe(EASYLEVEL_ACCEL_CHARACTERISTIC_UUID, onData),
    subscribeStatus: (onData) => subscribe(EASYLEVEL_STATUS_CHARACTERISTIC_UUID, onData),
  };
}
