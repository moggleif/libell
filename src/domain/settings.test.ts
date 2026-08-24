import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  formatLength,
  formatStepHeightsList,
  parseStepHeightsList,
  parseSettings,
} from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = {
      vehicleType: 'caravan' as const,
      wheelbaseMm: 3500,
      trackWidthFrontMm: 2000,
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [20, 50, 80],
      toleranceMm: 15,
      stabilityMm: 5,
      displayUnit: 'cm' as const,
      soundOnLevel: true,
      theme: 'light' as const,
    };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('migrates legacy cm values (wheelbase, track widths) to mm', () => {
    const result = parseSettings({ wheelbaseCm: 350, trackWidthCm: 200 });
    expect(result.wheelbaseMm).toBe(3500);
    expect(result.trackWidthFrontMm).toBe(2000);
    expect(result.trackWidthRearMm).toBe(2000);
    const perAxle = parseSettings({ trackWidthFrontCm: 190, trackWidthRearCm: 165 });
    expect(perAxle.trackWidthFrontMm).toBe(1900);
    expect(perAxle.trackWidthRearMm).toBe(1650);
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
      wheelbaseMm: -10,
      trackWidthFrontMm: 'wide',
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [60],
      toleranceMm: NaN,
    });
    expect(result).toEqual({
      vehicleType: DEFAULT_SETTINGS.vehicleType,
      wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm,
      trackWidthFrontMm: DEFAULT_SETTINGS.trackWidthFrontMm,
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [60],
      toleranceMm: DEFAULT_SETTINGS.toleranceMm,
      stabilityMm: DEFAULT_SETTINGS.stabilityMm,
      displayUnit: 'mm',
      soundOnLevel: false,
      theme: 'system',
    });
  });

  it('drops a legacy degree-based tolerance in favor of the mm default', () => {
    expect(parseSettings({ toleranceDeg: 0.5 }).toleranceMm).toBe(DEFAULT_SETTINGS.toleranceMm);
  });

  it('accepts stability 0 (hysteresis off) but not negative values', () => {
    expect(parseSettings({ stabilityMm: 0 }).stabilityMm).toBe(0);
    expect(parseSettings({ stabilityMm: -2 }).stabilityMm).toBe(DEFAULT_SETTINGS.stabilityMm);
  });

  it('validates display unit and sound preference', () => {
    expect(parseSettings({ displayUnit: 'cm' }).displayUnit).toBe('cm');
    expect(parseSettings({ displayUnit: 'inches' }).displayUnit).toBe('mm');
    expect(parseSettings({ soundOnLevel: true }).soundOnLevel).toBe(true);
    expect(parseSettings({ soundOnLevel: 'yes' }).soundOnLevel).toBe(false);
  });

  it('validates the vehicle type, defaulting to motorhome', () => {
    expect(parseSettings({ vehicleType: 'caravan' }).vehicleType).toBe('caravan');
    expect(parseSettings({ vehicleType: 'motorhome' }).vehicleType).toBe('motorhome');
    expect(parseSettings({ vehicleType: 'boat' }).vehicleType).toBe('motorhome');
    expect(parseSettings({}).vehicleType).toBe('motorhome');
  });

  it('validates the theme choice, defaulting to following the phone', () => {
    expect(parseSettings({}).theme).toBe('system');
    expect(parseSettings({ theme: 'light' }).theme).toBe('light');
    expect(parseSettings({ theme: 'dark' }).theme).toBe('dark');
    expect(parseSettings({ theme: 'sepia' }).theme).toBe('system');
  });
});

describe('formatLength', () => {
  it('formats mm and cm with sensible precision', () => {
    expect(formatLength(63, 'mm')).toBe('63 mm');
    expect(formatLength(63, 'cm')).toBe('6.3 cm');
    expect(formatLength(40, 'cm')).toBe('4 cm');
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
