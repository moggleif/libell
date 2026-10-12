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
// The EasyLevel box's own installation offset (#131, ADR 0014): where the
// permanently-mounted enclosure physically sits, exactly the same concept
// as VEHICLE_CALIBRATION_KEY above but for a different sensor source — its
// own distinctly-named key so it can never be read as, or overwrite, the
// phone's vehicle zero, and switching sensors never mixes the two.
/**
 * An external source's installation offset is keyed by the source id
 * (#263, ADR 0016) rather than named after one device: `libell
 * .installCalibration.easylevel`, `...xparkle`, and so on. ADR 0014
 * committed to the rule — a second source's value is its own, never
 * written into another's — and left the shape to whoever built a second
 * source; this is that shape.
 */
const INSTALL_CALIBRATION_KEY_PREFIX = 'libell.installCalibration.';

/**
 * Where #131 stored the EasyLevel box's installation offset before #263.
 * Read once by `migrateLegacyInstallCalibration` and then left alone —
 * see that function for why it is copied rather than moved.
 */
const LEGACY_EASYLEVEL_CALIBRATION_KEY = 'libell.easyLevelInstallCalibration';

/** Set once the legacy copy above has been done, so it never runs twice
 * and can never resurrect a value the user has since cleared. */
const INSTALL_CALIBRATION_MIGRATED_KEY = 'libell.installCalibration.migrated';

function installCalibrationKey(source: SensorSource): string {
  return `${INSTALL_CALIBRATION_KEY_PREFIX}${source}`;
}
// Set once the vehicle measurements (wheelbase, track widths) have been
// saved (#364): the ⚠ Setup lamp's own condition. Any other save also
// writes STORAGE_KEY, so its mere presence can't say this — the wizard's
// Language step used to put the lamp out before the measurements step.
const MEASUREMENTS_SAVED_KEY = 'libell.measurementsSaved';
/** Set on the first start that knows MEASUREMENTS_SAVED_KEY, so the
 * one-off carry-over for existing users never runs twice. */
const MEASUREMENTS_MIGRATED_KEY = 'libell.measurementsSaved.migrated';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';
// Distinct from ONBOARDED_KEY (design review, follow-up): that one means
// "the wizard has been dismissed at least once, either way" and gates the
// auto-launch on first load — an early ✕ sets it too, same as reaching
// the end. This one means "actually stepped through to the end" (whatever
// individual steps were skipped along the way) and is what "Show
// introduction" checks to decide whether it still reads as an unfinished
// first-run task (green) or a plain re-launch (secondary).
const ONBOARDING_DONE_KEY = 'libell.onboardingDone';
// The wizard's box path finished with no box connected (#365): the user
// chose a box, so until one connects (or they calibrate the phone after
// all) the amber lamp asks for the box instead of ⚠ Calibrate.
const BOX_PENDING_KEY = 'libell.boxPending';
// Separate keys from the calibration ones above (#122, ADR 0013): a
// preset is never stored in the same field as either calibration layer.
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

/** True once the vehicle measurements have been saved (#364). */
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
 * Carries existing users over to MEASUREMENTS_SAVED_KEY (#364): before it
 * existed, stored settings were the lamp's whole condition, so anyone who
 * already has them keeps an unlit lamp. Runs once ever — on the very
 * first start too, where nothing is stored yet — so a wizard that saves
 * the language and reloads can never be mistaken for an older install.
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

/** A stored calibration plus when it was captured (#87) — null for
 * values saved before timestamps existed; they stay valid. */
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

/** The vehicle zero (#83): the phone's normal spot, validated like the
 * sensor calibration — corrupt values read as null; beyond 15° stays,
 * since the user may zero anyway (#411). */
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
 * An external source's installation offset (#131/R34, ADR 0014, keyed per
 * source by #263): the mechanism is identical to the phone's vehicle zero
 * above (capture with the vehicle verified level, read back up to
 * `MAX_TILT_DEG` since a zero may be taken anyway above 15°, #425), but each source
 * gets its own key, so clearing or redoing one never touches — and is
 * never touched by — another source's, or the phone's own
 * `libell.vehicleCalibration`.
 *
 * That independence is not a nicety: an installation offset describes
 * where one particular box is bolted into one particular vehicle, so
 * letting two sources share a value would produce confidently wrong
 * guidance rather than an obvious failure.
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
 * Copy #131's EasyLevel installation offset to its per-source key (#263).
 * Runs once, guarded by its own marker key, and only when the new key is
 * empty — so it can never overwrite a newer value, and can never bring
 * back one the user has cleared since.
 *
 * **Copied, not moved.** The legacy key is left exactly as it was, so a
 * build rolled back to before #263 still finds the user's offset instead
 * of asking them to re-level. The cost is that an offset recaptured after
 * this migration would not be seen by such a rollback — it would find the
 * older value, which is "the keys as it left them", and is a far better
 * failure than a rolled-back build silently using no offset at all. A few
 * stale bytes in `localStorage` are cheap; making somebody re-level their
 * motorhome is not.
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
    // Storage unavailable (private mode, quota): the user keeps whatever
    // the legacy key holds and is asked to set the offset again at worst.
    // Never fatal, and never half-migrated — the marker is written last.
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

/** Clears a stored language override (the "Automatic" choice, screen-cleanup
 * follow-up) — back to detecting from the browser's own language on every load. */
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

/** True once the wizard has actually been stepped through to the end —
 * see `ONBOARDING_DONE_KEY` above for how this differs from
 * `hasSeenOnboarding`. */
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

/** True while the wizard's box path was finished without a box connected
 * (#365) — see `BOX_PENDING_KEY`. */
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

/** Saved target presets (#122): validated on every read, same discipline
 * as settings and calibration — one corrupt entry never breaks startup. */
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
 * The active target id — "Normal" (`null`) unless a preset was
 * explicitly selected. Validated against the current preset list so a
 * preset deleted elsewhere (or corrupt storage) can never leave the app
 * targeting a nonexistent preset.
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

/** `null` (Normal) removes the key entirely — Normal is never a stored
 * value, so it can never be corrupted or lost (#122). */
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
