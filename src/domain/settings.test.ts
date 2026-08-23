import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = {
      wheelbaseCm: 350,
      trackWidthFrontCm: 200,
      trackWidthRearCm: 170,
      blockHeightCm: 5,
      toleranceDeg: 1,
    };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('migrates a legacy single trackWidthCm to both axles', () => {
    const result = parseSettings({ wheelbaseCm: 350, trackWidthCm: 200 });
    expect(result.trackWidthFrontCm).toBe(200);
    expect(result.trackWidthRearCm).toBe(200);
  });

  it('falls back to defaults for missing input', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces corrupt fields individually and keeps the valid ones', () => {
    const result = parseSettings({
      wheelbaseCm: -10,
      trackWidthFrontCm: 'wide',
      trackWidthRearCm: 170,
      blockHeightCm: 6,
      toleranceDeg: NaN,
    });
    expect(result).toEqual({
      wheelbaseCm: DEFAULT_SETTINGS.wheelbaseCm,
      trackWidthFrontCm: DEFAULT_SETTINGS.trackWidthFrontCm,
      trackWidthRearCm: 170,
      blockHeightCm: 6,
      toleranceDeg: DEFAULT_SETTINGS.toleranceDeg,
    });
  });
});
