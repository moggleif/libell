/**
 * Remembers the last-connected device per external sensor source, so the app
 * can try a silent reconnect on open instead of re-running pairing.
 *
 * Its own store, not a field on `LevelSettings`: this is connection state (an
 * opaque, browser-assigned device identity), not a user preference.
 *
 * The stored value is Web Bluetooth's `BluetoothDevice.id` — not the box's MAC
 * address, and meaningless outside `navigator.bluetooth.getDevices()` on the
 * browser profile that paired it.
 *
 * Keyed by `SensorSource` (ADR 0016): two boxes are two devices, and
 * reconnecting to the wrong one is not a recoverable mistake.
 */
import type { SensorSource } from '../domain/settings';
import { defaultStorage, type KeyValueStorage } from './keyValueStorage';

const DEVICE_KEY_PREFIX = 'libell.sensorDevice.';

/** The EasyLevel device id's pre-per-source key; read only by the migration. */
const LEGACY_EASYLEVEL_DEVICE_KEY = 'libell.easyLevelDeviceId';

/** Marks the migration done, so it can never resurrect a device the user has
 * since disconnected and forgotten. */
const DEVICE_MIGRATED_KEY = 'libell.sensorDevice.migrated';

function deviceKey(source: SensorSource): string {
  return `${DEVICE_KEY_PREFIX}${source}`;
}

export function loadRememberedDeviceId(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): string | null {
  try {
    const raw = storage?.getItem(deviceKey(source));
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveRememberedDeviceId(
  source: SensorSource,
  id: string,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(deviceKey(source), id);
  } catch {
    // Storage full or unavailable: the next open just has nothing to
    // auto-reconnect to.
  }
}

export function clearRememberedDeviceId(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(deviceKey(source));
  } catch {
    // Nothing to do.
  }
}

/**
 * Copy the legacy EasyLevel device id to its per-source key. Runs once, and
 * only when the new key is empty, so it never overwrites a newer pairing.
 *
 * Copied, not moved, so a rolled-back build still finds the paired box; see
 * `migrateLegacyInstallCalibration` for the reasoning and accepted cost.
 */
export function migrateLegacyRememberedDeviceId(
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    if (storage === null) return;
    if (storage.getItem(DEVICE_MIGRATED_KEY) !== null) return;
    const legacy = storage.getItem(LEGACY_EASYLEVEL_DEVICE_KEY);
    const target = deviceKey('easylevel');
    if (typeof legacy === 'string' && legacy.length > 0 && storage.getItem(target) === null) {
      storage.setItem(target, legacy);
    }
    storage.setItem(DEVICE_MIGRATED_KEY, '1');
  } catch {
    // The marker is written last, so a failure leaves the migration to be
    // retried rather than half-done.
  }
}
