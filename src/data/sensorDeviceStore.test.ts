import { describe, expect, it } from 'vitest';
import {
  clearRememberedDeviceId,
  loadRememberedDeviceId,
  migrateLegacyRememberedDeviceId,
  saveRememberedDeviceId,
} from './sensorDeviceStore';
import type { KeyValueStorage } from './settingsStore';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const LEGACY_KEY = 'libell.easyLevelDeviceId';
const EASYLEVEL_KEY = 'libell.sensorDevice.easylevel';

describe('sensorDeviceStore (#130, per source since #263)', () => {
  it('is null before anything is remembered', () => {
    expect(loadRememberedDeviceId('easylevel', memoryStorage())).toBeNull();
  });

  it('round-trips a remembered device id', () => {
    const storage = memoryStorage();
    saveRememberedDeviceId('easylevel', 'device-abc-123', storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBe('device-abc-123');
  });

  it('clears the remembered device id', () => {
    const storage = memoryStorage();
    saveRememberedDeviceId('easylevel', 'device-abc-123', storage);
    clearRememberedDeviceId('easylevel', storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBeNull();
  });

  it('treats an empty stored string as nothing remembered', () => {
    const storage = memoryStorage({ [EASYLEVEL_KEY]: '' });
    expect(loadRememberedDeviceId('easylevel', storage)).toBeNull();
  });

  it('degrades gracefully when storage is unavailable', () => {
    expect(loadRememberedDeviceId('easylevel', null)).toBeNull();
    expect(() => saveRememberedDeviceId('easylevel', 'device-abc-123', null)).not.toThrow();
    expect(() => clearRememberedDeviceId('easylevel', null)).not.toThrow();
    expect(() => migrateLegacyRememberedDeviceId(null)).not.toThrow();
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
    expect(loadRememberedDeviceId('easylevel', throwing)).toBeNull();
    expect(() => saveRememberedDeviceId('easylevel', 'device-abc-123', throwing)).not.toThrow();
    expect(() => clearRememberedDeviceId('easylevel', throwing)).not.toThrow();
    expect(() => migrateLegacyRememberedDeviceId(throwing)).not.toThrow();
  });
});

describe('one device per source (#263)', () => {
  it('keeps each source’s remembered device completely separate', () => {
    // Reconnecting to the wrong box is not a recoverable mistake: it would
    // feed readings from a device mounted somewhere else entirely.
    const storage = memoryStorage();
    saveRememberedDeviceId('easylevel', 'easylevel-box', storage);
    saveRememberedDeviceId('phone' as never, 'other-source-device', storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBe('easylevel-box');
    clearRememberedDeviceId('phone' as never, storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBe('easylevel-box');
  });
});

describe('migrating #130’s device id to its per-source key (#263)', () => {
  it('carries a remembered box over, so nobody has to re-pair', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: 'device-abc-123' });
    migrateLegacyRememberedDeviceId(storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBe('device-abc-123');
  });

  it('leaves the legacy key in place, so a rolled-back build still finds it', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: 'device-abc-123' });
    migrateLegacyRememberedDeviceId(storage);
    expect(storage.getItem(LEGACY_KEY)).toBe('device-abc-123');
  });

  it('never runs twice, and never resurrects a device the user has forgotten', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: 'device-abc-123' });
    migrateLegacyRememberedDeviceId(storage);
    clearRememberedDeviceId('easylevel', storage);
    migrateLegacyRememberedDeviceId(storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBeNull();
  });

  it('never overwrites a device already remembered under the new key', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: 'old-box', [EASYLEVEL_KEY]: 'current-box' });
    migrateLegacyRememberedDeviceId(storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBe('current-box');
  });

  it('is a no-op on a fresh install with nothing stored', () => {
    const storage = memoryStorage();
    migrateLegacyRememberedDeviceId(storage);
    expect(loadRememberedDeviceId('easylevel', storage)).toBeNull();
  });

  it('ignores an empty legacy value rather than remembering an empty id', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: '' });
    migrateLegacyRememberedDeviceId(storage);
    expect(storage.getItem(EASYLEVEL_KEY)).toBeNull();
  });
});
