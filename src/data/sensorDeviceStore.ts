/**
 * Remembers the last-connected device per external sensor source (#130,
 * keyed per source by #263), so the app can try a silent reconnect on open
 * instead of re-running the pairing dance every time.
 *
 * Deliberately its own small store, not a field on `LevelSettings`: this is
 * connection *state* (a device identity, opaque and browser-assigned), not
 * a user preference — closer in shape to the calibration stores in
 * `settingsStore.ts` than to anything in the settings form.
 *
 * The stored value is Web Bluetooth's own `BluetoothDevice.id` — not the
 * box's real MAC address, and meaningless outside `navigator.bluetooth
 * .getDevices()` on the same browser profile that originally paired it. It
 * is only ever used to look the same device back up in that list; see
 * `src/sensor/easyLevelSensor.ts`'s `reconnect()`.
 *
 * Keyed by `SensorSource` (ADR 0016) rather than named after one device,
 * for the same reason the installation offsets are: two boxes are two
 * devices, and reconnecting to the wrong one is not a recoverable mistake.
 */
import type { SensorSource } from '../domain/settings';
import type { KeyValueStorage } from './settingsStore';

const DEVICE_KEY_PREFIX = 'libell.sensorDevice.';

/** Where #130 stored the EasyLevel box's device id before #263. Read once
 * by `migrateLegacyRememberedDeviceId`, then left alone — see there. */
const LEGACY_EASYLEVEL_DEVICE_KEY = 'libell.easyLevelDeviceId';

/** Set once that copy has been done, so it never runs twice and can never
 * resurrect a device the user has since disconnected and forgotten. */
const DEVICE_MIGRATED_KEY = 'libell.sensorDevice.migrated';

function deviceKey(source: SensorSource): string {
  return `${DEVICE_KEY_PREFIX}${source}`;
}

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Access can throw when storage is disabled (e.g. private mode).
    return null;
  }
}

/** The remembered device's Web Bluetooth id for this source, or null if
 * none was ever saved. */
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
    // Storage full or unavailable — the app keeps working; the next open
    // simply has nothing to auto-reconnect to, same as never having paired.
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
 * Copy #130's remembered EasyLevel device id to its per-source key (#263).
 * Runs once, guarded by its own marker, and only when the new key is empty
 * — so it never overwrites a newer pairing and never brings back one the
 * user has since cleared.
 *
 * **Copied, not moved**, for the same reason as the installation offset in
 * `settingsStore.ts`: a build rolled back to before #263 still finds the
 * box the user paired, instead of showing a device picker they have no
 * reason to expect. See `migrateLegacyInstallCalibration` for the full
 * reasoning and the accepted cost.
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
    // Storage unavailable: at worst the user picks their box from the
    // system picker once more. The marker is written last, so a failure
    // here leaves the migration to be retried rather than half-done.
  }
}
