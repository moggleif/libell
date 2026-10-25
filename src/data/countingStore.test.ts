import { describe, expect, it } from 'vitest';
import { isCountingOn, setCountingOn } from './countingStore';
import type { KeyValueStorage } from './keyValueStorage';

function memoryStorage(): KeyValueStorage & { keys(): string[] } {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}

describe('countingStore (#674)', () => {
  it('is on from the start and stores nothing while on', () => {
    const storage = memoryStorage();
    expect(isCountingOn(storage)).toBe(true);
    setCountingOn(true, storage);
    expect(storage.keys()).toEqual([]);
  });

  it('remembers off, and on again removes the key', () => {
    const storage = memoryStorage();
    setCountingOn(false, storage);
    expect(isCountingOn(storage)).toBe(false);
    expect(storage.keys()).toEqual(['libell.countingOff']);
    setCountingOn(true, storage);
    expect(isCountingOn(storage)).toBe(true);
    expect(storage.keys()).toEqual([]);
  });

  it('counts nothing when storage is blocked, so off can never be lost', () => {
    const blocked: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(isCountingOn(blocked)).toBe(false);
  });
});
