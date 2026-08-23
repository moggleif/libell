import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { loadSettings, saveSettings, type KeyValueStorage } from './settingsStore';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

describe('settingsStore', () => {
  it('round-trips settings through storage', () => {
    const storage = memoryStorage();
    const settings = {
      wheelbaseCm: 320,
      trackWidthFrontCm: 190,
      trackWidthRearCm: 165,
      blockHeightsCm: [3, 6],
      toleranceDeg: 0.8,
    };
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the stored JSON is corrupt', () => {
    const storage = memoryStorage({ 'levelmate.settings': '{not json' });
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when storage is unavailable', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, null)).not.toThrow();
  });
});
