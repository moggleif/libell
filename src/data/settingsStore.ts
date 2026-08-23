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

const STORAGE_KEY = 'libell.settings';
const CALIBRATION_KEY = 'libell.calibration';
const LANGUAGE_KEY = 'libell.language';

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

export function loadCalibration(
  storage: KeyValueStorage | null = defaultStorage(),
): Calibration | null {
  try {
    const raw = storage?.getItem(CALIBRATION_KEY);
    return raw === null || raw === undefined ? null : parseCalibration(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCalibration(
  calibration: Calibration,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
  } catch {
    // Same graceful degradation as saveSettings.
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

export function clearCalibration(storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(CALIBRATION_KEY);
  } catch {
    // Nothing to do — the in-memory state is cleared by the caller.
  }
}
