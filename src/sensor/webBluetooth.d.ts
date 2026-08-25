/**
 * Minimal ambient Web Bluetooth API types (#116) — TypeScript's bundled
 * `DOM` lib does not include them, and the repo stays offline/dependency-
 * free (ADR 0005) rather than pulling in a `@types/web-bluetooth` package
 * for the handful of members `easyLevelSensor.ts` actually calls. Not a
 * full spec surface — extend as a real need appears.
 */

interface BluetoothLEScanFilter {
  services?: string[];
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: string[];
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
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
   * granted access to (#130) — not the box's real MAC address. */
  readonly id: string;
  readonly gatt?: BluetoothRemoteGATTServer;
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  /**
   * Web Bluetooth's persistent-permissions API (#130): the previously-
   * authorized devices for this origin, without a device picker or a user
   * gesture. Optional because it is not implemented everywhere `bluetooth`
   * itself exists — feature-detect with `typeof navigator.bluetooth
   * ?.getDevices === 'function'` before calling it.
   */
  getDevices?(): Promise<BluetoothDevice[]>;
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}
