/** The subset of `Storage` the stores need; injectable for tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Access can throw when storage is disabled (e.g. private mode).
    return null;
  }
}

/** A store's storage, or null where the browser has none. */
export type MaybeStorage = KeyValueStorage | null;

/**
 * Every store access goes through here: blocked or full storage (private
 * mode, quota) must never break the app, so a throw gives `fallback`. The
 * in-memory value keeps working until a restart.
 */
export function guarded<T>(access: () => T, fallback: T): T {
  try {
    return access();
  } catch {
    return fallback;
  }
}

/** A '1' flag; `whenBlocked` is the answer when storage throws. */
export function readFlag(storage: MaybeStorage, key: string, whenBlocked: boolean): boolean {
  return guarded(() => storage?.getItem(key) === '1', whenBlocked);
}

/** Sets a '1' flag, or removes it. */
export function writeFlag(storage: MaybeStorage, key: string, on: boolean): void {
  if (on) writeItem(storage, key, '1');
  else removeItem(storage, key);
}

export function writeItem(storage: MaybeStorage, key: string, value: string): void {
  guarded(() => storage?.setItem(key, value), undefined);
}

export function removeItem(storage: MaybeStorage, key: string): void {
  guarded(() => storage?.removeItem(key), undefined);
}

/** A stored JSON value through `parse`; missing, corrupt or blocked gives
 * `fallback`. */
export function readJson<T>(
  storage: MaybeStorage,
  key: string,
  parse: (value: unknown) => T,
  fallback: T,
): T {
  return guarded(() => {
    const raw = storage?.getItem(key);
    return raw === null || raw === undefined ? fallback : parse(JSON.parse(raw));
  }, fallback);
}

export function writeJson(storage: MaybeStorage, key: string, value: unknown): void {
  guarded(() => storage?.setItem(key, JSON.stringify(value)), undefined);
}

/**
 * A one-off migration: runs `copy` unless `markerKey` says it already ran,
 * then writes the marker last, so a failure leaves it to retry rather than
 * half-done, and it can never resurrect a value the user has since cleared.
 */
export function migrateOnce(
  storage: MaybeStorage,
  markerKey: string,
  copy: (storage: KeyValueStorage) => void,
): void {
  guarded(() => {
    if (storage === null || storage.getItem(markerKey) !== null) return;
    copy(storage);
    storage.setItem(markerKey, '1');
  }, undefined);
}
