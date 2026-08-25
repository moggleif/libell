/**
 * EasyLevel BLE box (issue #116) — a second `OrientationSensor`
 * implementation (ADR 0014) alongside the phone sensor and `?demo`.
 * Always opt-in, connected from a menu action (`src/ui/sensorSourceSection.ts`);
 * never replaces the phone sensor automatically.
 *
 * Web Bluetooth transport (GATT connect/subscribe/disconnect) lives in
 * `createWebBluetoothTransport()` below, kept separate from the byte
 * parsing in `easyLevelProtocol.ts` — the same transport/protocol split
 * #119's iOS bridge issue calls for. `createEasyLevelSensor()` accepts an
 * injected `EasyLevelTransport`, so the connect/disconnect/state-machine
 * logic is unit-testable with a fake transport: there is no physical box
 * to test against, and `navigator.bluetooth` does not exist in Vitest/jsdom.
 *
 * Protocol notes (from #116's reverse-engineering — see that issue for
 * the full writeup):
 * - Service `faf52c20-...`; `faf52c21-...` (NOTIFY) carries the raw
 *   accel/gyro payload parsed by `easyLevelProtocol.ts`.
 * - `faf52c22-...` (NOTIFY/READ) carries firmware version, temperature
 *   and calibration bytes whose exact layout beyond byte 7 is NOT fully
 *   decoded (#116/#123 explicitly defer this) — subscribed best-effort
 *   and stored as raw bytes only, never parsed, and never required for
 *   this sensor to function.
 * - No encryption, no WRITE characteristic (confirmed by decompiling the
 *   official apps — see #116).
 */
import type { GravityVector } from '../domain/leveling';
import type { SensorSource } from '../domain/settings';
import type { OrientationSensor, SensorState } from './orientation';
import { parseAccelPacket } from './easyLevelProtocol';

export const EASYLEVEL_SERVICE_UUID = 'faf52c20-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_ACCEL_CHARACTERISTIC_UUID = 'faf52c21-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_STATUS_CHARACTERISTIC_UUID = 'faf52c22-5078-11e9-b475-0800200c9a66';

/** Web Bluetooth is Chrome/Android only — never Safari/iOS. */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** One connected box: subscribe to its notify characteristics, disconnect on request. */
export interface EasyLevelConnection {
  subscribeAccel(onData: (view: DataView) => void): Promise<void>;
  /** Best-effort (#116: layout beyond byte 7 undecoded) — raw bytes only. */
  subscribeStatus(onData: (view: DataView) => void): Promise<void>;
  disconnect(): void;
}

/**
 * Thin seam over Web Bluetooth so the connection/state-machine logic can
 * be unit-tested with a fake transport implementing this same shape.
 */
export interface EasyLevelTransport {
  /**
   * Shows the OS device picker and connects GATT. Must run inside a real
   * user-gesture call stack (a click handler) — `requestDevice` throws
   * otherwise. `onDisconnect` is called if the GATT connection drops
   * later (box powered off, out of range, ...).
   */
  connect(onDisconnect: () => void): Promise<EasyLevelConnection>;
}

/** The real Web Bluetooth transport. Scans by service UUID (#116: more reliable than the `CARATI...` name prefix). */
export function createWebBluetoothTransport(): EasyLevelTransport {
  return {
    async connect(onDisconnect): Promise<EasyLevelConnection> {
      // Only ever called after `isWebBluetoothSupported()` has confirmed
      // `navigator.bluetooth` exists (`start()` below) — the assertion
      // reflects that contract rather than re-checking it here.
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [EASYLEVEL_SERVICE_UUID] }],
      });
      device.addEventListener('gattserverdisconnected', onDisconnect);
      const server = await device.gatt?.connect();
      if (!server) throw new Error('EasyLevel: GATT connect failed');
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
        disconnect: () => device.gatt?.disconnect(),
      };
    },
  };
}

/** `OrientationSensor` plus a couple of EasyLevel-specific extras not part of that shared interface. */
export interface EasyLevelSensor extends OrientationSensor {
  /** Raw `faf52c22-...` bytes, undecoded (#116) — for future diagnostics. */
  getStatusBytes(): Uint8Array | null;
  /** Explicit user disconnect — distinct from an unexpected `gattserverdisconnected`. */
  disconnect(): void;
}

export function createEasyLevelSensor(
  transport: EasyLevelTransport = createWebBluetoothTransport(),
): EasyLevelSensor {
  let state: SensorState = 'idle';
  let gravity: GravityVector | null = null;
  let statusBytes: Uint8Array | null = null;
  let connection: EasyLevelConnection | null = null;

  function onGattDisconnected(): void {
    // Lost, not denied: surfaces distinctly (#116's AC) so the UI can
    // offer reconnection instead of silently freezing on the last value.
    state = 'disconnected';
    gravity = null;
  }

  return {
    async start(): Promise<SensorState> {
      if (state === 'granted') return state;
      if (!isWebBluetoothSupported()) {
        state = 'unsupported';
        return state;
      }
      try {
        connection = await transport.connect(onGattDisconnected);
        await connection.subscribeAccel((view) => {
          gravity = parseAccelPacket(view);
        });
        try {
          // Best-effort only — see the module doc comment. A firmware
          // without this characteristic, or one that rejects the
          // subscription, must never prevent leveling from working.
          await connection.subscribeStatus((view) => {
            statusBytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
          });
        } catch {
          // No status characteristic, or subscribe failed: accel alone
          // is everything this sensor needs.
        }
        state = 'granted';
        return state;
      } catch {
        // Covers a cancelled device picker, a GATT connect failure, or a
        // missing service — all surfaced the same way the phone sensor
        // surfaces a denied permission.
        state = 'denied';
        return state;
      }
    },
    getState: () => state,
    getGravity: () => gravity,
    getSource: (): SensorSource => 'easylevel',
    getStatusBytes: () => statusBytes,
    disconnect(): void {
      connection?.disconnect();
      connection = null;
      state = 'idle';
      gravity = null;
    },
  };
}
