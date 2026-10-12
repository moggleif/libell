/**
 * Minimal ambient Web Bluetooth API types — TypeScript's bundled `DOM` lib
 * does not include them, and the repo stays dependency-free (ADR 0005)
 * rather than pulling in `@types/web-bluetooth`. Not a full spec surface —
 * extend as a real need appears.
 */

interface BluetoothLEScanFilter {
  services?: string[];
  namePrefix?: string;
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: string[];
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  /** The Xparkle box reports its live tilt on a READ characteristic
   * rather than by notification. */
  readValue(): Promise<DataView>;
  /** `writeValue` rather than `writeValueWithResponse`: what the vendor
   * app's own BLE layer uses and every current implementation supports. */
  writeValue(value: ArrayBufferView | ArrayBuffer): Promise<void>;
}

interface BluetoothRemoteGATTService extends EventTarget {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  /** Browser-assigned, stable across sessions for a device the user has
   * granted access to — not the box's real MAC address. */
  readonly id: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  /**
   * Start delivering `advertisementreceived` events for this device.
   * Optional because some browsers that have `getDevices()` lack it —
   * feature-detect it.
   */
  watchAdvertisements?(options?: { signal?: AbortSignal }): Promise<void>;
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  /**
   * The previously authorized devices for this origin, without a picker or
   * a user gesture. Optional because not every browser with `bluetooth`
   * implements it — feature-detect before calling.
   */
  getDevices?(): Promise<BluetoothDevice[]>;
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}
