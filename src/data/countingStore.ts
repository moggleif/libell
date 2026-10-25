/**
 * The one choice anonymous counting keeps (#674, #699): "on" or "off",
 * stored only once the user has made it; until then nothing is counted.
 * Kept apart from `libell.settings`, so resetting the settings never undoes
 * the choice.
 */
import {
  defaultStorage,
  guarded,
  readFlag,
  removeItem,
  writeItem,
  type MaybeStorage,
} from './keyValueStorage';
import type { StoredKey } from './storedKeys';

const COUNTING_KEY = 'libell.counting';
/** #674's off switch, from before counting was a choice. */
const LEGACY_COUNTING_OFF_KEY = 'libell.countingOff';

export type CountingChoiceValue = 'on' | 'off';

/** Null until chosen; blocked storage reads as not chosen. */
export function countingChoice(
  storage: MaybeStorage = defaultStorage(),
): CountingChoiceValue | null {
  const value = guarded(() => storage?.getItem(COUNTING_KEY) ?? null, null);
  return value === 'on' || value === 'off' ? value : null;
}

/** Only a stored "on" counts: a choice we cannot read is never assumed on. */
export function isCountingOn(storage: MaybeStorage = defaultStorage()): boolean {
  return countingChoice(storage) === 'on';
}

export function setCountingOn(on: boolean, storage: MaybeStorage = defaultStorage()): void {
  writeItem(storage, COUNTING_KEY, on ? 'on' : 'off');
}

/** Someone who switched counting off under #674 has chosen; someone who
 * left it on by default has not, and is asked. */
export function migrateLegacyCountingOff(storage: MaybeStorage = defaultStorage()): void {
  if (!readFlag(storage, LEGACY_COUNTING_OFF_KEY, false)) return;
  if (countingChoice(storage) === null) setCountingOn(false, storage);
  removeItem(storage, LEGACY_COUNTING_OFF_KEY);
}

/** The legacy key too, so "Delete all" never leaves it behind. */
export function countingStoredKeys(): StoredKey[] {
  return [
    { key: COUNTING_KEY, kind: 'counting' },
    { key: LEGACY_COUNTING_OFF_KEY, kind: 'counting' },
  ];
}
