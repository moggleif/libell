import { describe, expect, it } from 'vitest';
import {
  countingChoice,
  isCountingOn,
  migrateLegacyCountingOff,
  setCountingOn,
} from './countingStore';
import type { KeyValueStorage } from './keyValueStorage';

function memoryStorage(seed: Record<string, string> = {}): KeyValueStorage & {
  entries(): Record<string, string>;
} {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    entries: () => Object.fromEntries(data),
  };
}

const blocked: KeyValueStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {},
  removeItem: () => {},
};

describe('countingStore (#674, #699)', () => {
  it('has no choice until one is made, and counts nothing meanwhile', () => {
    const storage = memoryStorage();
    expect(countingChoice(storage)).toBeNull();
    expect(isCountingOn(storage)).toBe(false);
  });

  it('stores "count" and "don’t count" as made, and either can be changed', () => {
    const storage = memoryStorage();
    setCountingOn(true, storage);
    expect(countingChoice(storage)).toBe('on');
    expect(isCountingOn(storage)).toBe(true);
    expect(storage.entries()).toEqual({ 'libell.counting': 'on' });
    setCountingOn(false, storage);
    expect(countingChoice(storage)).toBe('off');
    expect(isCountingOn(storage)).toBe(false);
    expect(storage.entries()).toEqual({ 'libell.counting': 'off' });
  });

  it('reads anything else stored as no choice', () => {
    expect(countingChoice(memoryStorage({ 'libell.counting': 'yes' }))).toBeNull();
  });

  it('counts nothing and has no choice when storage is blocked', () => {
    expect(countingChoice(blocked)).toBeNull();
    expect(isCountingOn(blocked)).toBe(false);
  });
});

describe('migrateLegacyCountingOff (#699)', () => {
  it('keeps an earlier "switched off" as the choice "don’t count"', () => {
    const storage = memoryStorage({ 'libell.countingOff': '1' });
    migrateLegacyCountingOff(storage);
    expect(storage.entries()).toEqual({ 'libell.counting': 'off' });
    expect(countingChoice(storage)).toBe('off');
  });

  it('leaves counting that was on by default unchosen, so the user is asked', () => {
    const storage = memoryStorage();
    migrateLegacyCountingOff(storage);
    expect(storage.entries()).toEqual({});
  });

  it('never overwrites a choice already made', () => {
    const storage = memoryStorage({ 'libell.countingOff': '1', 'libell.counting': 'on' });
    migrateLegacyCountingOff(storage);
    expect(storage.entries()).toEqual({ 'libell.counting': 'on' });
  });
});
