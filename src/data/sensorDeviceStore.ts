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
import { SENSOR_SOURCES, type SensorSource } from '../domain/settings';
import {
  defaultStorage,
  guarded,
  migrateOnce,
  removeItem,
  writeItem,
  type KeyValueStorage,
} from './keyValueStorage';
import { perSource, type StoredKey } from './storedKeys';

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
  return guarded(() => {
    const raw = storage?.getItem(deviceKey(source));
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  }, null);
}

export function saveRememberedDeviceId(
  source: SensorSource,
  id: string,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  // Storage full or unavailable: the next open just has nothing to
  // auto-reconnect to.
  writeItem(storage, deviceKey(source), id);
}

export function clearRememberedDeviceId(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  removeItem(storage, deviceKey(source));
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
  migrateOnce(storage, DEVICE_MIGRATED_KEY, (store) => {
    const legacy = store.getItem(LEGACY_EASYLEVEL_DEVICE_KEY);
    const target = deviceKey('easylevel');
    if (typeof legacy === 'string' && legacy.length > 0 && store.getItem(target) === null) {
      store.setItem(target, legacy);
    }
  });
}

/** Each box's remembered device (#599): the box belongs to its vehicle. */
export function rememberedDeviceKeys(): string[] {
  return SENSOR_SOURCES.map(deviceKey);
}

/** Every key this store writes (#678). */
export function sensorDeviceStoredKeys(): StoredKey[] {
  return [
    ...perSource(SENSOR_SOURCES, deviceKey, 'rememberedBox'),
    { key: LEGACY_EASYLEVEL_DEVICE_KEY, kind: 'legacy', source: 'easylevel' },
    { key: DEVICE_MIGRATED_KEY, kind: 'note' },
  ];
}
