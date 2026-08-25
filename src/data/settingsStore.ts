/**
 * Persistence for `LevelSettings` — the only module that touches
 * `localStorage`. Everything read from storage goes through
 * `parseSettings`, so an outdated or hand-edited value can never break
 * startup.
 */
import {
  parseCalibration,
  parseSettings,
  type Calibration,
  type LevelSettings,
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
const EASYLEVEL_CALIBRATION_KEY = 'libell.easyLevelInstallCalibration';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';
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

/** A stored calibration plus when it was captured (#87) — null for
 * values saved before timestamps existed; they stay valid. */
export interface StoredCalibration {
  value: Calibration;
  capturedAt: number | null;
}

function readCalibration(key: string, storage: KeyValueStorage | null): StoredCalibration | null {
  try {
    const raw = storage?.getItem(key);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    const value = parseCalibration(parsed);
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
  return readCalibration(CALIBRATION_KEY, storage)?.value ?? null;
}

export function loadCalibrationInfo(
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(CALIBRATION_KEY, storage);
}

export function saveCalibration(
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
  capturedAt: number = Date.now(),
): void {
  writeCalibration(CALIBRATION_KEY, calibration, capturedAt, storage);
}

/** The vehicle zero (#83): the phone's normal spot, validated like the
 * sensor calibration — corrupt or implausible values read as null. */
export function loadVehicleCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readCalibration(VEHICLE_CALIBRATION_KEY, storage)?.value ?? null;
}

export function loadVehicleCalibrationInfo(
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(VEHICLE_CALIBRATION_KEY, storage);
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
 * The EasyLevel box's installation offset (#131, ADR 0014): the mechanism
 * is identical to the phone's vehicle zero above (capture with the vehicle
 * verified level, validated the same >15° implausible-capture guard via
 * `parseCalibration`), but stored under its own key so it is a completely
 * independent value — clearing or redoing it never touches, and is never
 * touched by, the phone's own `libell.vehicleCalibration`.
 */
export function loadEasyLevelCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  return readCalibration(EASYLEVEL_CALIBRATION_KEY, storage)?.value ?? null;
}

export function loadEasyLevelCalibrationInfo(
  storage: KeyValueStorage | null = defaultStorage(),
): StoredCalibration | null {
  return readCalibration(EASYLEVEL_CALIBRATION_KEY, storage);
}

export function saveEasyLevelCalibration(
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
  capturedAt: number = Date.now(),
): void {
  writeCalibration(EASYLEVEL_CALIBRATION_KEY, calibration, capturedAt, storage);
}

export function clearEasyLevelCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(EASYLEVEL_CALIBRATION_KEY);
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
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
