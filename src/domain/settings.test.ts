import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = { wheelbaseCm: 350, trackWidthCm: 200, blockHeightCm: 5, toleranceDeg: 1 };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('falls back to defaults for missing input', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces corrupt fields individually and keeps the valid ones', () => {
    const result = parseSettings({
      wheelbaseCm: -10,
      trackWidthCm: 'wide',
      blockHeightCm: 6,
      toleranceDeg: NaN,
    });
    expect(result).toEqual({
      wheelbaseCm: DEFAULT_SETTINGS.wheelbaseCm,
      trackWidthCm: DEFAULT_SETTINGS.trackWidthCm,
      blockHeightCm: 6,
      toleranceDeg: DEFAULT_SETTINGS.toleranceDeg,
    });
  });
});
