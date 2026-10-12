/**
 * How Libell reaches an Xparkle RVS01: the transport seam the sensor talks
 * through, the real Web Bluetooth link behind it, and the simulated box that
 * `?xparkle-sim` puts in its place.
 */
import { BLE_ADVERTISEMENT_WAIT_MS } from './bleAdvertisement';
import { createWebBluetoothLink } from './webBluetoothLink';
import { createSimulatedXparkleTransport, xparkleSimulationMode } from './xparkleSimulator';
import {
  XPARKLE_DEVICE_NAME_FRAGMENTS,
  XPARKLE_LIVE_CHARACTERISTIC_UUID,
  XPARKLE_NOTIFY_CHARACTERISTIC_UUID,
  XPARKLE_SERVICE_UUID,
  XPARKLE_WRITE_CHARACTERISTIC_UUID,
} from './xparkleProtocol';

export const XPARKLE_ADVERTISEMENT_WAIT_MS = BLE_ADVERTISEMENT_WAIT_MS;

export interface XparkleConnection {
  /** Web Bluetooth's device id, remembered for a silent reconnect through
   * `getDevices()`. */
  readonly deviceId: string;
  /** Subscribe to `fff4` (command replies — never live readings). */
  subscribeNotify(onData: (view: DataView) => void): Promise<void>;
  /** One read of `fff2`. Rejects or resolves null when it cannot be read. */
  readLive(): Promise<DataView | null>;
  /** Write one framed command to `fff3`. */
  write(frame: Uint8Array): Promise<void>;
  disconnect(): void;
}

/** Seam over Web Bluetooth, so the connect state machine is testable with a
 * fake (`navigator.bluetooth` does not exist in Vitest). */
export interface XparkleTransport {
  /** Shows the OS device picker and connects. Needs a live user gesture. */
  connect(onDisconnect: () => void): Promise<XparkleConnection>;
  /** Silent reconnect to an already-authorized device — no picker, no
   * gesture. Resolves null (never rejects) for every "cannot do this
   * silently" reason, so they all degrade onto the gesture path. */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<XparkleConnection | null>;
}

/**
 * The real Web Bluetooth transport.
 *
 * The official app scans unfiltered and matches the advertised name
 * (`RVLevel` / `RVbalance`), so whether the box advertises
 * `XPARKLE_SERVICE_UUID` is unknown — and filtering EasyLevel on a service
 * real boxes never advertise left the OS picker empty. So both kinds of
 * filter are listed: `requestDevice()` matches ANY filter, so an extra one
 * can only widen the picker, never narrow it.
 */
export function createXparkleWebBluetoothTransport(): XparkleTransport {
  return createWebBluetoothLink({
    name: 'Xparkle',
    requestOptions: {
      filters: [
        ...XPARKLE_DEVICE_NAME_FRAGMENTS.map((namePrefix) => ({ namePrefix })),
        { services: [XPARKLE_SERVICE_UUID] },
      ],
      optionalServices: [XPARKLE_SERVICE_UUID],
    },
    wire: wireXparkle,
  });
}

/** The notify characteristic opens only when the sensor subscribes. */
async function wireXparkle(
  server: BluetoothRemoteGATTServer,
): Promise<Omit<XparkleConnection, 'deviceId' | 'disconnect'>> {
  const service = await server.getPrimaryService(XPARKLE_SERVICE_UUID);
  const live = await service.getCharacteristic(XPARKLE_LIVE_CHARACTERISTIC_UUID);
  const write = await service.getCharacteristic(XPARKLE_WRITE_CHARACTERISTIC_UUID);
  return {
    async subscribeNotify(onData) {
      const notify = await service.getCharacteristic(XPARKLE_NOTIFY_CHARACTERISTIC_UUID);
      notify.addEventListener('characteristicvaluechanged', () => {
        if (notify.value) onData(notify.value);
      });
      await notify.startNotifications();
    },
    readLive: () => live.readValue(),
    write: (frame) => write.writeValue(frame),
  };
}

/** Real Web Bluetooth: Chrome/Android only, never Safari/iOS, where users
 * are pointed at Bluefy instead (R39). */
function isXparkleWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** Real Web Bluetooth or the simulated box: the one gate for "does this
 * source exist here at all". */
export function isXparkleAvailable(): boolean {
  return isXparkleWebBluetoothSupported() || xparkleSimulationMode() !== 'off';
}

/** The simulated box whenever its flag is on, real Web Bluetooth otherwise —
 * chosen at this one seam, so everything above it is the code a real box
 * runs through. */
export function createXparkleTransport(): XparkleTransport {
  const simulation = xparkleSimulationMode();
  return simulation !== 'off'
    ? createSimulatedXparkleTransport(simulation)
    : createXparkleWebBluetoothTransport();
}
