import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deleteAllStoredData,
  maskSecrets,
  readStoredData,
  storedKeyCatalogue,
  type EnumerableStorage,
} from './storedData';

/** A Storage-shaped map, enumerable like the browser's. */
function memoryStorage(initial: Record<string, string> = {}): EnumerableStorage & {
  dump(): Record<string, string>;
} {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (index) => [...map.keys()][index] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    dump: () => Object.fromEntries(map),
  };
}

const SRC = join(import.meta.dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'messages' ? [] : sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

/** Every `'libell.…'` literal in the app's source: a key, or a key prefix
 * ending in a dot. */
function keyLiteralsInSource(): string[] {
  const found = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    for (const match of readFileSync(file, 'utf8').matchAll(/['"`](libell\.[\w.]*)['"`]/g)) {
      if (match[1]) found.add(match[1]);
    }
  }
  return [...found];
}

describe('the stored-data catalogue (#678)', () => {
  it('covers every libell.* key the source writes, so a new key fails here first', () => {
    const catalogue = storedKeyCatalogue().map((entry) => entry.key);
    const literals = keyLiteralsInSource();
    expect(literals.length).toBeGreaterThan(20);
    const missing = literals.filter((literal) =>
      literal.endsWith('.')
        ? !catalogue.some((key) => key.startsWith(literal))
        : !catalogue.includes(literal),
    );
    expect(missing).toEqual([]);
  });

  it('names each key once', () => {
    const keys = storedKeyCatalogue().map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('expands the per-box keys for every source', () => {
    const keys = storedKeyCatalogue().map((entry) => entry.key);
    expect(keys).toContain('libell.installCalibration.xparkle');
    expect(keys).toContain('libell.zeroTrim.phone');
    expect(keys).toContain('libell.sensorDevice.easylevel');
  });

  it('keeps the reload mark in session storage only', () => {
    const session = storedKeyCatalogue().filter((entry) => entry.session);
    expect(session.map((entry) => entry.key)).toEqual(['libell.reopenSettings']);
  });
});

describe('readStoredData', () => {
  it('lists every libell.* value with its kind, and nothing else', () => {
    const local = memoryStorage({
      'libell.settings': '{}',
      'libell.sensorDevice.xparkle': 'abc',
      'libell.somethingOld': 'x',
      'other.site': 'keep',
    });
    const session = memoryStorage({ 'libell.reopenSettings': 'general' });
    const entries = readStoredData(local, session);
    expect(entries).toEqual([
      { key: 'libell.settings', kind: 'settings', value: '{}', session: false },
      {
        key: 'libell.sensorDevice.xparkle',
        kind: 'rememberedBox',
        source: 'xparkle',
        value: 'abc',
        session: false,
      },
      { key: 'libell.somethingOld', kind: 'other', value: 'x', session: false },
      { key: 'libell.reopenSettings', kind: 'note', value: 'general', session: true },
    ]);
  });

  it('reads nothing, without throwing, when storage is missing or blocked', () => {
    const blocked = {
      get length(): number {
        throw new Error('blocked');
      },
    } as unknown as EnumerableStorage;
    expect(readStoredData(null, null)).toEqual([]);
    expect(readStoredData(blocked, blocked)).toEqual([]);
  });
});

describe('deleteAllStoredData', () => {
  it('removes every libell.* key, catalogued or not, in both storages', () => {
    const all = Object.fromEntries(storedKeyCatalogue().map((entry) => [entry.key, '1']));
    const local = memoryStorage({ ...all, 'libell.unknown': '1', 'other.site': 'keep' });
    const session = memoryStorage({ 'libell.reopenSettings': 'general', 'x.y': 'keep' });
    deleteAllStoredData(local, session);
    expect(local.dump()).toEqual({ 'other.site': 'keep' });
    expect(session.dump()).toEqual({ 'x.y': 'keep' });
  });

  it('stays quiet when storage is blocked', () => {
    const blocked = {
      get length(): number {
        throw new Error('blocked');
      },
    } as unknown as EnumerableStorage;
    expect(() => deleteAllStoredData(blocked, null)).not.toThrow();
  });
});

describe('maskSecrets', () => {
  it('hides the box password wherever it is nested', () => {
    const settings = JSON.stringify({
      wheelbaseMm: 3800,
      sensorDevices: { xparkle: { password: '1234', axisMapping: null } },
    });
    expect(maskSecrets(settings)).toBe(
      JSON.stringify({
        wheelbaseMm: 3800,
        sensorDevices: { xparkle: { password: '••••', axisMapping: null } },
      }),
    );
    const vehicles = JSON.stringify({
      vehicles: [{ fields: { sensorDevices: { xparkle: { password: '9876' } } } }],
    });
    expect(maskSecrets(vehicles)).not.toContain('9876');
  });

  it('leaves values that are not JSON as they are', () => {
    expect(maskSecrets('sv')).toBe('sv');
    expect(maskSecrets('{broken')).toBe('{broken');
  });
});
