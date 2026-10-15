/**
 * Persistence for the calibration layers: the phone's own calibration, the
 * vehicle zero, and each external source's installation offset. Corrupt or
 * missing values read as null, so they can never break startup.
 */
import type { SensorSource } from '../domain/settings';
import { MAX_TILT_DEG, parseCalibration, type Calibration } from '../domain/calibration';
import {
  defaultStorage,
  migrateOnce,
  readJson,
  removeItem,
  writeJson,
  type KeyValueStorage,
} from './keyValueStorage';

const CALIBRATION_KEY = 'libell.calibration';
const VEHICLE_CALIBRATION_KEY = 'libell.vehicleCalibration';
/**
 * An external source's installation offset (ADR 0014, 0016): the same concept
 * as the phone's vehicle zero, but keyed per source id so one source's value is
 * never read as, or written into, another's or the phone's.
 */
const INSTALL_CALIBRATION_KEY_PREFIX = 'libell.installCalibration.';

const ZERO_TRIM_KEY_PREFIX = 'libell.zeroTrim.';

/** The EasyLevel offset's pre-per-source key; read only by the migration. */
const LEGACY_EASYLEVEL_CALIBRATION_KEY = 'libell.easyLevelInstallCalibration';

/** Marks the migration done, so it can never resurrect a value the user has
 * since cleared. */
const INSTALL_CALIBRATION_MIGRATED_KEY = 'libell.installCalibration.migrated';

function installCalibrationKey(source: SensorSource): string {
  return `${INSTALL_CALIBRATION_KEY_PREFIX}${source}`;
}

/** `capturedAt` is null for values saved before timestamps existed; they
 * stay valid. */
export interface StoredCalibration {
  value: Calibration;
  capturedAt: number | null;
}

function readCalibration(
  key: string,
  storage: KeyValueStorage | null,
  maxDeg?: number,
): StoredCalibration | null {
  return readJson(storage, key, (parsed) => storedCalibration(parsed, maxDeg), null);
}

function storedCalibration(parsed: unknown, maxDeg?: number): StoredCalibration | null {
  const value = parseCalibration(parsed, maxDeg);
  if (!value) return null;
  const at = (parsed as Record<string, unknown>).capturedAt;
  const capturedAt = typeof at === 'number' && Number.isFinite(at) && at > 0 ? at : null;
  return { value, capturedAt };
}

function writeCalibration(
  key: string,
  calibration: Calibration,
  capturedAt: number,
  storage: KeyValueStorage | null,
): void {
  writeJson(storage, key, { ...calibration, capturedAt });
}

export function loadCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readCalibration(CALIBRATION_KEY, storage, MAX_TILT_DEG)?.value ?? null;
}

export function loadCalibrationInfo(
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(CALIBRATION_KEY, storage, MAX_TILT_DEG);
}

export function saveCalibration(
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
  capturedAt: number = Date.now(),
): void {
  writeCalibration(CALIBRATION_KEY, calibration, capturedAt, storage);
}

/** The vehicle zero: the phone's normal spot. Corrupt values read as null;
 * beyond 15° stays, since the user may zero anyway. */
export function loadVehicleCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readCalibration(VEHICLE_CALIBRATION_KEY, storage, MAX_TILT_DEG)?.value ?? null;
}

export function loadVehicleCalibrationInfo(
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(VEHICLE_CALIBRATION_KEY, storage, MAX_TILT_DEG);
}

export function saveVehicleCalibration(
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
  capturedAt: number = Date.now(),
): void {
  writeCalibration(VEHICLE_CALIBRATION_KEY, calibration, capturedAt, storage);
}

export function clearVehicleCalibration(storage: KeyValueStorage | null = defaultStorage()): void {
  removeItem(storage, VEHICLE_CALIBRATION_KEY);
}

/**
 * An external source's installation offset (R34, ADR 0014): same mechanism as the
 * vehicle zero, but each source has its own key. The offset describes where
 * one box is bolted into one vehicle, so sharing a value between sources
 * would give confidently wrong guidance rather than an obvious failure.
 */
export function loadInstallCalibration(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readCalibration(installCalibrationKey(source), storage, MAX_TILT_DEG)?.value ?? null;
}

export function loadInstallCalibrationInfo(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(installCalibrationKey(source), storage, MAX_TILT_DEG);
}

export function saveInstallCalibration(
  source: SensorSource,
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
  capturedAt: number = Date.now(),
): void {
  writeCalibration(installCalibrationKey(source), calibration, capturedAt, storage);
}

export function clearInstallCalibration(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  removeItem(storage, installCalibrationKey(source));
}

/**
 * Copy the legacy EasyLevel installation offset to its per-source key. Runs
 * once, and only when the new key is empty, so it never overwrites a newer
 * value.
 *
 * **Copied, not moved**, so a rolled-back build still finds the user's offset
 * instead of asking them to re-level. The cost: an offset recaptured later is
 * not seen by such a rollback, which finds the older value — far better than
 * silently using no offset at all.
 */
export function migrateLegacyInstallCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  migrateOnce(storage, INSTALL_CALIBRATION_MIGRATED_KEY, (store) => {
    const legacy = store.getItem(LEGACY_EASYLEVEL_CALIBRATION_KEY);
    const target = installCalibrationKey('easylevel');
    if (legacy !== null && store.getItem(target) === null) store.setItem(target, legacy);
  });
}

export function clearCalibration(storage: KeyValueStorage | null = defaultStorage()): void {
  removeItem(storage, CALIBRATION_KEY);
}

/**
 * A source's fine adjustment of its zero (#596), next to that zero and
 * keyed per source like the installation offsets, so one source's trim is
 * never read as another's. Null when none or corrupt.
 */
function zeroTrimKey(source: SensorSource): string {
  return `${ZERO_TRIM_KEY_PREFIX}${source}`;
}

export function loadZeroTrim(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readJson(
    storage,
    zeroTrimKey(source),
    (parsed) => parseCalibration(parsed, MAX_TILT_DEG),
    null,
  );
}

export function saveZeroTrim(
  source: SensorSource,
  trim: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  writeJson(storage, zeroTrimKey(source), trim);
}

export function clearZeroTrim(
  source: SensorSource,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  removeItem(storage, zeroTrimKey(source));
}
