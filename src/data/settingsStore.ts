/**
 * Persistence for `LevelSettings` — the only module that touches
 * `localStorage`. Everything read from storage goes through
 * `parseSettings`, so an outdated or hand-edited value can never break
 * startup.
 */
import {
  MAX_TILT_DEG,
  parseCalibration,
  parseSettings,
  type Calibration,
  type LevelSettings,
  type SensorSource,
} from '../domain/settings';
import {
  parseActiveTargetId,
  parseTargetPresets,
  type TargetPreset,
} from '../domain/targetPresets';

const STORAGE_KEY = 'libell.settings';
const CALIBRATION_KEY = 'libell.calibration';
const VEHICLE_CALIBRATION_KEY = 'libell.vehicleCalibration';
/**
 * An external source's installation offset (ADR 0014, 0016): the same concept
 * as the phone's vehicle zero, but keyed per source id so one source's value is
 * never read as, or written into, another's or the phone's.
 */
const INSTALL_CALIBRATION_KEY_PREFIX = 'libell.installCalibration.';

/** The EasyLevel offset's pre-per-source key; read only by the migration. */
const LEGACY_EASYLEVEL_CALIBRATION_KEY = 'libell.easyLevelInstallCalibration';

/** Marks the migration done, so it can never resurrect a value the user has
 * since cleared. */
const INSTALL_CALIBRATION_MIGRATED_KEY = 'libell.installCalibration.migrated';

function installCalibrationKey(source: SensorSource): string {
  return `${INSTALL_CALIBRATION_KEY_PREFIX}${source}`;
}
// Set once the vehicle measurements have been saved: the ⚠ Setup lamp's
// condition. Any other save also writes STORAGE_KEY, so its presence can't
// say this.
const MEASUREMENTS_SAVED_KEY = 'libell.measurementsSaved';
/** Guards the one-off carry-over of existing users to MEASUREMENTS_SAVED_KEY. */
const MEASUREMENTS_MIGRATED_KEY = 'libell.measurementsSaved.migrated';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';
// Distinct from ONBOARDED_KEY, which means "dismissed at least once" (an
// early ✕ sets it too) and gates the auto-launch. This one means "stepped
// through to the end" and decides whether "Show introduction" reads as an
// unfinished first-run task or a plain re-launch.
const ONBOARDING_DONE_KEY = 'libell.onboardingDone';
// The wizard's box path finished with no box connected: until one connects
// (or the phone is calibrated after all) the amber lamp asks for the box
// instead of ⚠ Calibrate.
const BOX_PENDING_KEY = 'libell.boxPending';
// Separate from the calibration keys (ADR 0013): a preset is never stored in
// the same field as either calibration layer.
const TARGET_PRESETS_KEY = 'libell.targetPresets';
const ACTIVE_TARGET_KEY = 'libell.activeTarget';

/** The subset of `Storage` the store needs; injectable for tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Access can throw when storage is disabled (e.g. private mode).
    return null;
  }
}

export function loadSettings(storage: KeyValueStorage | null = defaultStorage()): LevelSettings {
  let parsed: unknown;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    parsed = raw === null || raw === undefined ? undefined : JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  return parseSettings(parsed);
}

export function saveSettings(
  settings: LevelSettings,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable — the app keeps working with the
    // in-memory value; it just won't survive a restart.
  }
}

/** True once the user has saved vehicle settings at least once. */
export function hasStoredSettings(storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

export function hasStoredMeasurements(storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(MEASUREMENTS_SAVED_KEY) != null;
  } catch {
    return false;
  }
}

export function markMeasurementsSaved(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.setItem(MEASUREMENTS_SAVED_KEY, '1');
  } catch {
    // Same graceful degradation as saveSettings.
  }
}

/**
 * Carries existing users over to MEASUREMENTS_SAVED_KEY: anyone with stored
 * settings keeps an unlit lamp. Runs once ever — on the very first start too,
 * where nothing is stored yet — so a wizard that saves the language and
 * reloads can never be mistaken for an older install.
 */
export function migrateMeasurementsSaved(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    if (storage === null) return;
    if (storage.getItem(MEASUREMENTS_MIGRATED_KEY) !== null) return;
    if (storage.getItem(STORAGE_KEY) !== null) storage.setItem(MEASUREMENTS_SAVED_KEY, '1');
    storage.setItem(MEASUREMENTS_MIGRATED_KEY, '1');
  } catch {
    // Storage unavailable: nothing is saved either way.
  }
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
  try {
    const raw = storage?.getItem(key);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    const value = parseCalibration(parsed, maxDeg);
    if (!value) return null;
    const at = (parsed as Record<string, unknown>).capturedAt;
    const capturedAt = typeof at === 'number' && Number.isFinite(at) && at > 0 ? at : null;
    return { value, capturedAt };
  } catch {
    return null;
  }
}

function writeCalibration(
  key: string,
  calibration: Calibration,
  capturedAt: number,
  storage: KeyValueStorage | null,
): void {
  try {
    storage?.setItem(key, JSON.stringify({ ...calibration, capturedAt }));
  } catch {
    // Same graceful degradation as saveSettings.
  }
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
  try {
    storage?.removeItem(VEHICLE_CALIBRATION_KEY);
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
  }
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
  try {
    storage?.removeItem(installCalibrationKey(source));
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
  }
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
  try {
    if (storage === null) return;
    if (storage.getItem(INSTALL_CALIBRATION_MIGRATED_KEY) !== null) return;
    const legacy = storage.getItem(LEGACY_EASYLEVEL_CALIBRATION_KEY);
    const target = installCalibrationKey('easylevel');
    if (legacy !== null && storage.getItem(target) === null) {
      storage.setItem(target, legacy);
    }
    storage.setItem(INSTALL_CALIBRATION_MIGRATED_KEY, '1');
  } catch {
    // Never half-migrated: the marker is written last.
  }
}

export function loadLanguage(storage: KeyValueStorage | null = defaultStorage()): unknown {
  try {
    return storage?.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLanguage(
  lang: string,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Non-fatal — auto-detection covers the next start.
  }
}

/** The "Automatic" choice: back to detecting the browser's language on every
 * load. */
export function clearLanguage(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(LANGUAGE_KEY);
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
  }
}

export function hasSeenOnboarding(storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true; // Storage unavailable — do not loop the wizard forever.
  }
}

export function markOnboardingSeen(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.setItem(ONBOARDED_KEY, '1');
  } catch {
    // Non-fatal.
  }
}

/** See `ONBOARDING_DONE_KEY` for how this differs from `hasSeenOnboarding`. */
export function hasDoneOnboarding(storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(ONBOARDING_DONE_KEY) === '1';
  } catch {
    return true; // Storage unavailable — default to the "done" look, not a false nag.
  }
}

export function markOnboardingDone(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.setItem(ONBOARDING_DONE_KEY, '1');
  } catch {
    // Non-fatal.
  }
}

export function isBoxPending(storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(BOX_PENDING_KEY) === '1';
  } catch {
    return false; // Storage unavailable — the ordinary phone lamp, not a box nag.
  }
}

export function setBoxPending(
  pending: boolean,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    if (pending) storage?.setItem(BOX_PENDING_KEY, '1');
    else storage?.removeItem(BOX_PENDING_KEY);
  } catch {
    // Non-fatal.
  }
}

export function clearCalibration(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(CALIBRATION_KEY);
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
  }
}

/** Validated on every read: one corrupt entry never breaks startup. */
export function loadTargetPresets(
  storage: KeyValueStorage | null = defaultStorage(),
): TargetPreset[] {
  try {
    const raw = storage?.getItem(TARGET_PRESETS_KEY);
    if (raw === null || raw === undefined) return [];
    return parseTargetPresets(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveTargetPresets(
  presets: TargetPreset[],
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(TARGET_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Same graceful degradation as saveSettings.
  }
}

/**
 * "Normal" (`null`) unless a preset was explicitly selected. Validated against
 * the current presets, so a deleted preset or corrupt storage can never leave
 * the app targeting a nonexistent one.
 */
export function loadActiveTargetId(
  presets: TargetPreset[],
  storage: KeyValueStorage | null = defaultStorage(),
): string | null {
  try {
    const raw = storage?.getItem(ACTIVE_TARGET_KEY);
    if (raw === null || raw === undefined) return null;
    return parseActiveTargetId(JSON.parse(raw), presets);
  } catch {
    return null;
  }
}

/** `null` (Normal) removes the key: Normal is never a stored value, so it can
 * never be corrupted or lost. */
export function saveActiveTargetId(
  id: string | null,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    if (id === null) storage?.removeItem(ACTIVE_TARGET_KEY);
    else storage?.setItem(ACTIVE_TARGET_KEY, JSON.stringify(id));
  } catch {
    // Same graceful degradation as saveSettings.
  }
}
