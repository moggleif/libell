import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  formatBlockHeightsList,
  parseBlockHeightsList,
  parseSettings,
} from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = {
      wheelbaseCm: 350,
      trackWidthFrontCm: 200,
      trackWidthRearCm: 170,
      blockHeightsCm: [2, 5, 8],
      toleranceDeg: 1,
    };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('migrates a legacy single trackWidthCm to both axles', () => {
    const result = parseSettings({ wheelbaseCm: 350, trackWidthCm: 200 });
    expect(result.trackWidthFrontCm).toBe(200);
    expect(result.trackWidthRearCm).toBe(200);
  });

  it('migrates a legacy single blockHeightCm to a one-step list', () => {
    expect(parseSettings({ blockHeightCm: 5 }).blockHeightsCm).toEqual([5]);
  });

  it('sorts, dedupes and cleans the step height list', () => {
    const result = parseSettings({ blockHeightsCm: [6, 2, 2, -1, NaN, 4] });
    expect(result.blockHeightsCm).toEqual([2, 4, 6]);
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
      blockHeightsCm: [6],
      toleranceDeg: NaN,
    });
    expect(result).toEqual({
      wheelbaseCm: DEFAULT_SETTINGS.wheelbaseCm,
      trackWidthFrontCm: DEFAULT_SETTINGS.trackWidthFrontCm,
      trackWidthRearCm: 170,
      blockHeightsCm: [6],
      toleranceDeg: DEFAULT_SETTINGS.toleranceDeg,
    });
  });
});

describe('parseBlockHeightsList', () => {
  it('parses semicolon-separated cm values', () => {
    expect(parseBlockHeightsList('2; 4; 6')).toEqual([2, 4, 6]);
  });

  it('accepts decimal commas and drops invalid entries', () => {
    expect(parseBlockHeightsList(' 4,5 ; junk; -2; 2 ')).toEqual([2, 4.5]);
    expect(parseBlockHeightsList('')).toEqual([]);
  });

  it('round-trips through the display format', () => {
    expect(formatBlockHeightsList(parseBlockHeightsList('6;2;4'))).toBe('2; 4; 6');
  });
});
