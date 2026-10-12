/**
 * Persistence for `LevelSettings` and the app's small first-run and preset
 * flags. Everything read from storage goes through `parseSettings`, so an
 * outdated or hand-edited value can never break startup. The calibration
 * layers live in `calibrationStore.ts`.
 */
import { parseSettings, type LevelSettings } from '../domain/settings';
import {
  parseActiveTargetId,
  parseTargetPresets,
  type TargetPreset,
} from '../domain/targetPresets';
import { defaultStorage, type KeyValueStorage } from './keyValueStorage';

const STORAGE_KEY = 'libell.settings';
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
