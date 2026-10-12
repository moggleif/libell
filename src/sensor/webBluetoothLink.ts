/**
 * The Web Bluetooth link every BLE box adapter shares: pick the box,
 * connect its GATT server, tear the link down cleanly, retry once, and
 * reconnect silently. Each box supplies only its scan filter and how to
 * open its own service and characteristics.
 */
import { waitForAdvertisement } from './bleAdvertisement';

/** What one kind of box tells the link about itself. */
export interface WebBluetoothBox<Wiring> {
  /** Names the box in the error a missing GATT server raises. */
  name: string;
  /** The picker's filters, and every service opened after connecting. */
  requestOptions: RequestDeviceOptions;
  /** Open the box's service and characteristics on a connected server. A
   * failure here closes the link again. */
  wire(server: BluetoothRemoteGATTServer): Promise<Wiring>;
}

/** A connected box: its own members plus the two every link has. */
export type WebBluetoothConnection<Wiring> = Wiring & {
  deviceId: string;
  /** A deliberate disconnect, never reported as a lost link. */
  disconnect(): void;
};

export interface WebBluetoothLink<Wiring> {
  /** Opens the picker, so it needs a user gesture. Rejects when the user
   * cancels or the box will not connect. */
  connect(onDisconnect: () => void): Promise<WebBluetoothConnection<Wiring>>;
  /** No picker and no gesture. Resolves null, never rejects, whenever the
   * box cannot be reached silently. */
  reconnect(
    deviceId: string,
    onDisconnect: () => void,
  ): Promise<WebBluetoothConnection<Wiring> | null>;
}

export function createWebBluetoothLink<Wiring>(
  box: WebBluetoothBox<Wiring>,
): WebBluetoothLink<Wiring> {
  /**
   * The box picked in this page session. Chrome on Android keeps
   * `getDevices()` behind a flag, and the picked device object stays
   * connectable for as long as the page lives.
   */
  let picked: BluetoothDevice | null = null;

  async function connectToDevice(
    device: BluetoothDevice,
    onDisconnect: () => void,
  ): Promise<WebBluetoothConnection<Wiring>> {
    device.addEventListener('gattserverdisconnected', onDisconnect);
    // The listener goes first, because `gatt.disconnect()` fires the event
    // too and a deliberate disconnect is not a lost link. The link is
    // actively closed on failure, because a box stops advertising while a
    // half-open link holds it.
    const teardown = () => {
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      device.gatt?.disconnect();
    };
    try {
      const server = await device.gatt?.connect();
      if (!server) throw new Error(`${box.name}: GATT connect failed`);
      const wiring = await box.wire(server);
      return { ...wiring, deviceId: device.id, disconnect: teardown };
    } catch (error) {
      teardown();
      throw error;
    }
  }

  /** Right after Disconnect a box can take a moment before it advertises
   * and accepts a connection again: hear it, then try once
   * more. A second failure is the caller's ordinary "could not connect". */
  async function connectWithOneRetry(
    device: BluetoothDevice,
    onDisconnect: () => void,
  ): Promise<WebBluetoothConnection<Wiring>> {
    try {
      return await connectToDevice(device, onDisconnect);
    } catch {
      await waitForAdvertisement(device);
      return connectToDevice(device, onDisconnect);
    }
  }

  /** The box picked this session, else the browser's list of devices this
   * origin may use. `getDevices()` can be missing even where
   * `navigator.bluetooth` is not. */
  async function findDevice(deviceId: string): Promise<BluetoothDevice | null> {
    if (picked?.id === deviceId) return picked;
    const getDevices = navigator.bluetooth?.getDevices;
    if (typeof getDevices !== 'function') return null;
    const devices = await getDevices.call(navigator.bluetooth);
    return devices.find((candidate) => candidate.id === deviceId) ?? null;
  }

  return {
    async connect(onDisconnect) {
      // Callers check `navigator.bluetooth` before offering the picker.
      picked = await navigator.bluetooth!.requestDevice(box.requestOptions);
      return connectWithOneRetry(picked, onDisconnect);
    },
    async reconnect(deviceId, onDisconnect) {
      try {
        const device = await findDevice(deviceId);
        if (!device) return null;
        // A connect to a box no scan has seen since the drop often fails
        // even with the box in range.
        await waitForAdvertisement(device);
        return await connectToDevice(device, onDisconnect);
      } catch {
        return null;
      }
    },
  };
}
