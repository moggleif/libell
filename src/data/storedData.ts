/**
 * Everything Libell keeps on the phone, gathered from the stores (#678): the
 * stored-data view lists it, and "Delete all Libell data" removes it. A new
 * key must be listed by its store, or `storedData.test.ts` fails.
 */
import { calibrationStoredKeys } from './calibrationStore';
import { guarded, type KeyValueStorage } from './keyValueStorage';
import { sensorDeviceStoredKeys } from './sensorDeviceStore';
import { sessionStoredKeys } from './sessionKeys';
import { settingsStoredKeys } from './settingsStore';
import { LIBELL_PREFIX, type StoredKey } from './storedKeys';
import { vehicleStoredKeys } from './vehicleStore';

/** `Storage` as the browser has it: the view must find keys no store knows. */
export interface EnumerableStorage extends KeyValueStorage {
  readonly length: number;
  key(index: number): string | null;
}

/** One value as it is stored, with what it holds. */
export interface StoredEntry extends Omit<StoredKey, 'session'> {
  value: string;
  session: boolean;
}

export function storedKeyCatalogue(): StoredKey[] {
  return [
    ...settingsStoredKeys(),
    ...vehicleStoredKeys(),
    ...calibrationStoredKeys(),
    ...sensorDeviceStoredKeys(),
    ...sessionStoredKeys(),
  ];
}

function defaultSession(): EnumerableStorage | null {
  return guarded(() => (typeof sessionStorage === 'undefined' ? null : sessionStorage), null);
}

function defaultLocal(): EnumerableStorage | null {
  return guarded(() => (typeof localStorage === 'undefined' ? null : localStorage), null);
}

/** The libell.* keys in `storage`, in its own order; none when blocked. */
function libellKeys(storage: EnumerableStorage | null): string[] {
  return guarded(() => {
    if (!storage) return [];
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(LIBELL_PREFIX)) keys.push(key);
    }
    return keys;
  }, []);
}

/** Every libell.* value, local storage first; a key no store knows reads as
 * `other`, so nothing stored is ever hidden. */
export function readStoredData(
  local: EnumerableStorage | null = defaultLocal(),
  session: EnumerableStorage | null = defaultSession(),
): StoredEntry[] {
  const known = new Map(storedKeyCatalogue().map((entry) => [entry.key, entry]));
  const read = (storage: EnumerableStorage | null, inSession: boolean): StoredEntry[] =>
    libellKeys(storage).flatMap((key) => {
      const value = guarded(() => storage?.getItem(key) ?? null, null);
      if (value === null) return [];
      const entry = known.get(key) ?? { key, kind: 'other' as const };
      return [{ ...entry, value, session: inSession }];
    });
  return [...read(local, false), ...read(session, true)];
}

/** Removes every libell.* key, known to a store or not, and nothing else:
 * other sites' data and the app's offline cache stay. */
export function deleteAllStoredData(
  local: EnumerableStorage | null = defaultLocal(),
  session: EnumerableStorage | null = defaultSession(),
): void {
  for (const storage of [local, session]) {
    // Gathered first: removing while walking shifts the indexes.
    for (const key of libellKeys(storage)) guarded(() => storage?.removeItem(key), undefined);
  }
}

/** How the box password shows, in the raw view and in plain words. */
export const MASK = '••••';

/** A stored value with the box password hidden at any depth, for the raw
 * view. A value that is not JSON has no password field and stays as it is. */
export function maskSecrets(value: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return value;
  }
  return JSON.stringify(parsed, (key, item: unknown) =>
    key === 'password' && typeof item === 'string' ? MASK : item,
  );
}
