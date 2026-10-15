/**
 * Persistence for `LevelSettings` and the app's small first-run and preset
 * flags. Everything read from storage goes through `parseSettings`, so an
 * outdated or hand-edited value can never break startup. The calibration
 * layers live in `calibrationStore.ts`.
 */
import type { LevelSettings } from '../domain/settings';
import { parseSettings } from '../domain/settingsParsing';
import { parseHitchPitch } from '../domain/hitchHeight';
import {
  parseActiveTargetId,
  parseTargetPresets,
  type TargetPreset,
} from '../domain/targetPresets';
import {
  defaultStorage,
  guarded,
  migrateOnce,
  readFlag,
  readJson,
  removeItem,
  writeFlag,
  writeItem,
  writeJson,
  type MaybeStorage,
} from './keyValueStorage';

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
// A caravan's saved hitch height, as a pitch from the zero (#598).
const HITCH_PITCH_KEY = 'libell.hitchPitch';

export function loadSettings(storage: MaybeStorage = defaultStorage()): LevelSettings {
  return parseSettings(readJson<unknown>(storage, STORAGE_KEY, (value) => value, undefined));
}

export function saveSettings(
  settings: LevelSettings,
  storage: MaybeStorage = defaultStorage(),
): void {
  writeJson(storage, STORAGE_KEY, settings);
}

/** By presence, not '1': the only flag read that way since #364. */
export function hasStoredMeasurements(storage: MaybeStorage = defaultStorage()): boolean {
  return guarded(() => storage?.getItem(MEASUREMENTS_SAVED_KEY) != null, false);
}

export function markMeasurementsSaved(storage: MaybeStorage = defaultStorage()): void {
  writeFlag(storage, MEASUREMENTS_SAVED_KEY, true);
}

/**
 * Carries existing users over to MEASUREMENTS_SAVED_KEY: anyone with stored
 * settings keeps an unlit lamp. Runs once ever — on the very first start too,
 * where nothing is stored yet — so a wizard that saves the language and
 * reloads can never be mistaken for an older install.
 */
export function migrateMeasurementsSaved(storage: MaybeStorage = defaultStorage()): void {
  migrateOnce(storage, MEASUREMENTS_MIGRATED_KEY, (store) => {
    if (store.getItem(STORAGE_KEY) !== null) store.setItem(MEASUREMENTS_SAVED_KEY, '1');
  });
}

/** Unknown: the caller validates it; null when storage is blocked. */
export function loadLanguage(storage: MaybeStorage = defaultStorage()): unknown {
  return guarded<unknown>(() => storage?.getItem(LANGUAGE_KEY), null);
}

/** Blocked storage is non-fatal: auto-detection covers the next start. */
export function saveLanguage(lang: string, storage: MaybeStorage = defaultStorage()): void {
  writeItem(storage, LANGUAGE_KEY, lang);
}

/** The "Automatic" choice: back to detecting the browser's language on every
 * load. */
export function clearLanguage(storage: MaybeStorage = defaultStorage()): void {
  removeItem(storage, LANGUAGE_KEY);
}

/** Blocked storage reads as seen, so the wizard never loops. */
export function hasSeenOnboarding(storage: MaybeStorage = defaultStorage()): boolean {
  return readFlag(storage, ONBOARDED_KEY, true);
}

export function markOnboardingSeen(storage: MaybeStorage = defaultStorage()): void {
  writeFlag(storage, ONBOARDED_KEY, true);
}

/** See `ONBOARDING_DONE_KEY` for how this differs from `hasSeenOnboarding`.
 * Blocked storage reads as done: the plain look, not a false nag. */
export function hasDoneOnboarding(storage: MaybeStorage = defaultStorage()): boolean {
  return readFlag(storage, ONBOARDING_DONE_KEY, true);
}

export function markOnboardingDone(storage: MaybeStorage = defaultStorage()): void {
  writeFlag(storage, ONBOARDING_DONE_KEY, true);
}

/** Blocked storage reads as not pending: the ordinary phone lamp. */
export function isBoxPending(storage: MaybeStorage = defaultStorage()): boolean {
  return readFlag(storage, BOX_PENDING_KEY, false);
}

export function setBoxPending(pending: boolean, storage: MaybeStorage = defaultStorage()): void {
  writeFlag(storage, BOX_PENDING_KEY, pending);
}

/** Validated on every read: one corrupt entry never breaks startup. */
export function loadTargetPresets(storage: MaybeStorage = defaultStorage()): TargetPreset[] {
  return readJson(storage, TARGET_PRESETS_KEY, parseTargetPresets, []);
}

export function saveTargetPresets(
  presets: TargetPreset[],
  storage: MaybeStorage = defaultStorage(),
): void {
  writeJson(storage, TARGET_PRESETS_KEY, presets);
}

/**
 * "Normal" (`null`) unless a preset was explicitly selected. Validated against
 * the current presets, so a deleted preset or corrupt storage can never leave
 * the app targeting a nonexistent one.
 */
export function loadActiveTargetId(
  presets: TargetPreset[],
  storage: MaybeStorage = defaultStorage(),
): string | null {
  return readJson(storage, ACTIVE_TARGET_KEY, (value) => parseActiveTargetId(value, presets), null);
}

/** `null` (Normal) removes the key: Normal is never a stored value, so it can
 * never be corrupted or lost. */
export function saveActiveTargetId(
  id: string | null,
  storage: MaybeStorage = defaultStorage(),
): void {
  if (id === null) removeItem(storage, ACTIVE_TARGET_KEY);
  else writeJson(storage, ACTIVE_TARGET_KEY, id);
}

/** Null when none is saved or the stored value is corrupt. */
export function loadHitchPitch(storage: MaybeStorage = defaultStorage()): number | null {
  return readJson(storage, HITCH_PITCH_KEY, parseHitchPitch, null);
}

export function saveHitchPitch(pitchDeg: number, storage: MaybeStorage = defaultStorage()): void {
  writeJson(storage, HITCH_PITCH_KEY, pitchDeg);
}
