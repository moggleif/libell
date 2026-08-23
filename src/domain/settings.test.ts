import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  formatStepHeightsList,
  parseStepHeightsList,
  parseSettings,
} from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = {
      wheelbaseCm: 350,
      trackWidthFrontCm: 200,
      trackWidthRearCm: 170,
      rampStepHeightsMm: [20, 50, 80],
      toleranceDeg: 1,
      stabilityMm: 5,
    };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('migrates a legacy single trackWidthCm to both axles', () => {
    const result = parseSettings({ wheelbaseCm: 350, trackWidthCm: 200 });
    expect(result.trackWidthFrontCm).toBe(200);
    expect(result.trackWidthRearCm).toBe(200);
  });

  it('migrates legacy cm step heights to mm', () => {
    expect(parseSettings({ blockHeightCm: 5 }).rampStepHeightsMm).toEqual([50]);
    expect(parseSettings({ blockHeightsCm: [2, 4, 6] }).rampStepHeightsMm).toEqual([20, 40, 60]);
  });

  it('sorts, dedupes and cleans the step height list', () => {
    const result = parseSettings({ rampStepHeightsMm: [60, 20, 20, -1, NaN, 40] });
    expect(result.rampStepHeightsMm).toEqual([20, 40, 60]);
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
      rampStepHeightsMm: [60],
      toleranceDeg: NaN,
    });
    expect(result).toEqual({
      wheelbaseCm: DEFAULT_SETTINGS.wheelbaseCm,
      trackWidthFrontCm: DEFAULT_SETTINGS.trackWidthFrontCm,
      trackWidthRearCm: 170,
      rampStepHeightsMm: [60],
      toleranceDeg: DEFAULT_SETTINGS.toleranceDeg,
      stabilityMm: DEFAULT_SETTINGS.stabilityMm,
    });
  });

  it('accepts stability 0 (hysteresis off) but not negative values', () => {
    expect(parseSettings({ stabilityMm: 0 }).stabilityMm).toBe(0);
    expect(parseSettings({ stabilityMm: -2 }).stabilityMm).toBe(DEFAULT_SETTINGS.stabilityMm);
  });
});

describe('parseStepHeightsList', () => {
  it('parses semicolon-separated mm values', () => {
    expect(parseStepHeightsList('20; 40; 60')).toEqual([20, 40, 60]);
  });

  it('accepts decimal commas and drops invalid entries', () => {
    expect(parseStepHeightsList(' 45,5 ; junk; -2; 20 ')).toEqual([20, 45.5]);
    expect(parseStepHeightsList('')).toEqual([]);
  });

  it('round-trips through the display format', () => {
    expect(formatStepHeightsList(parseStepHeightsList('60;20;40'))).toBe('20; 40; 60');
  });
});
