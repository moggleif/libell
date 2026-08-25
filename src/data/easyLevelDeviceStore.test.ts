import { describe, expect, it } from 'vitest';
import {
  clearRememberedEasyLevelDeviceId,
  loadRememberedEasyLevelDeviceId,
  saveRememberedEasyLevelDeviceId,
} from './easyLevelDeviceStore';
import type { KeyValueStorage } from './settingsStore';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('easyLevelDeviceStore (#130)', () => {
  it('is null before anything is remembered', () => {
    expect(loadRememberedEasyLevelDeviceId(memoryStorage())).toBeNull();
  });

  it('round-trips a remembered device id', () => {
    const storage = memoryStorage();
    saveRememberedEasyLevelDeviceId('device-abc-123', storage);
    expect(loadRememberedEasyLevelDeviceId(storage)).toBe('device-abc-123');
  });

  it('clears the remembered device id', () => {
    const storage = memoryStorage();
    saveRememberedEasyLevelDeviceId('device-abc-123', storage);
    clearRememberedEasyLevelDeviceId(storage);
    expect(loadRememberedEasyLevelDeviceId(storage)).toBeNull();
  });

  it('treats an empty stored string as nothing remembered', () => {
    const storage = memoryStorage({ 'libell.easyLevelDeviceId': '' });
    expect(loadRememberedEasyLevelDeviceId(storage)).toBeNull();
  });

  it('degrades gracefully when storage is unavailable', () => {
    expect(loadRememberedEasyLevelDeviceId(null)).toBeNull();
    expect(() => saveRememberedEasyLevelDeviceId('device-abc-123', null)).not.toThrow();
    expect(() => clearRememberedEasyLevelDeviceId(null)).not.toThrow();
  });

  it('degrades gracefully when storage throws', () => {
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadRememberedEasyLevelDeviceId(throwing)).toBeNull();
    expect(() => saveRememberedEasyLevelDeviceId('device-abc-123', throwing)).not.toThrow();
    expect(() => clearRememberedEasyLevelDeviceId(throwing)).not.toThrow();
  });
});
