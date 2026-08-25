/**
 * Remembers the last-connected EasyLevel BLE box (#130), so the app can try
 * a silent reconnect on open instead of re-running the pairing dance every
 * time. Deliberately its own small store, not a field on `LevelSettings`:
 * this is connection *state* (a device identity, opaque and browser-
 * assigned), not a user preference — closer in shape to the calibration
 * stores in `settingsStore.ts` than to anything in the settings form.
 *
 * The stored value is Web Bluetooth's own `BluetoothDevice.id` — not the
 * box's real MAC address, and meaningless outside `navigator.bluetooth
 * .getDevices()` on the same browser profile that originally paired it. It
 * is only ever used to look the same device back up in that list; see
 * `src/sensor/easyLevelSensor.ts`'s `reconnect()`.
 */
import type { KeyValueStorage } from './settingsStore';

const REMEMBERED_DEVICE_KEY = 'libell.easyLevelDeviceId';

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Access can throw when storage is disabled (e.g. private mode).
    return null;
  }
}

/** The remembered device's Web Bluetooth id, or null if none was ever saved. */
export function loadRememberedEasyLevelDeviceId(
  storage: KeyValueStorage | null = defaultStorage(),
): string | null {
  try {
    const raw = storage?.getItem(REMEMBERED_DEVICE_KEY);
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveRememberedEasyLevelDeviceId(
  id: string,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(REMEMBERED_DEVICE_KEY, id);
  } catch {
    // Storage full or unavailable — the app keeps working; the next open
    // simply has nothing to auto-reconnect to, same as never having paired.
  }
}

export function clearRememberedEasyLevelDeviceId(
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(REMEMBERED_DEVICE_KEY);
  } catch {
    // Nothing to do.
  }
}
