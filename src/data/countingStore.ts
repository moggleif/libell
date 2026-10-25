/**
 * The one choice anonymous counting keeps (#674): off is stored as a flag,
 * on stores nothing. Kept apart from `libell.settings`, so resetting the
 * settings never turns counting back on.
 */
import { defaultStorage, readFlag, writeFlag, type MaybeStorage } from './keyValueStorage';

const COUNTING_OFF_KEY = 'libell.countingOff';

/** Blocked storage reads as off: a choice we cannot read is never assumed on. */
export function isCountingOn(storage: MaybeStorage = defaultStorage()): boolean {
  return !readFlag(storage, COUNTING_OFF_KEY, true);
}

export function setCountingOn(on: boolean, storage: MaybeStorage = defaultStorage()): void {
  writeFlag(storage, COUNTING_OFF_KEY, !on);
}
