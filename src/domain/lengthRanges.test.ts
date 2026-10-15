// Lengths read from storage or a shared link are only kept inside a
// plausible range (#541); outside it, that one field falls back to its
// default and the rest is kept.
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, LENGTH_RANGES_MM } from './settings';
import { parseSettings } from './settingsParsing';
import { decodeVehicleGeometry, encodeVehicleGeometry, type VehicleGeometry } from './vehicleShare';
import { numberWithin } from './untrustedValues';

describe('numberWithin', () => {
  const range = { min: 10, max: 20 };

  it('keeps a number inside the range, ends included', () => {
    expect(numberWithin(10, range, 0)).toBe(10);
    expect(numberWithin(15.5, range, 0)).toBe(15.5);
    expect(numberWithin(20, range, 0)).toBe(20);
  });

  it('falls back outside the range and for anything not a finite number', () => {
    for (const value of [9.9, 20.1, 1e308, -1, NaN, Infinity, '15', null, undefined]) {
      expect(numberWithin(value, range, 7)).toBe(7);
    }
  });
});

describe('the length ranges', () => {
  it('are pinned for each field', () => {
    expect(LENGTH_RANGES_MM).toEqual({
      wheelbase: { min: 500, max: 15000 },
      trackWidth: { min: 500, max: 4000 },
      rampStep: { min: 1, max: 500 },
      tolerance: { min: 1, max: 200 },
      stability: { min: 0, max: 50 },
    });
  });

  it('hold every default', () => {
    const d = DEFAULT_SETTINGS;
    const within = (v: number, r: { min: number; max: number }) => v >= r.min && v <= r.max;
    expect(within(d.wheelbaseMm, LENGTH_RANGES_MM.wheelbase)).toBe(true);
    expect(within(d.trackWidthFrontMm, LENGTH_RANGES_MM.trackWidth)).toBe(true);
    expect(within(d.trackWidthRearMm, LENGTH_RANGES_MM.trackWidth)).toBe(true);
    expect(d.rampStepHeightsMm.every((h) => within(h, LENGTH_RANGES_MM.rampStep))).toBe(true);
    expect(within(d.toleranceMm, LENGTH_RANGES_MM.tolerance)).toBe(true);
    expect(within(d.stabilityMm, LENGTH_RANGES_MM.stability)).toBe(true);
  });
});

describe('parseSettings with out-of-range lengths', () => {
  it('falls back per field and keeps the rest', () => {
    const parsed = parseSettings({
      wheelbaseMm: 1e308,
      trackWidthFrontMm: 499,
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [30, 1e308, 60],
      toleranceMm: 201,
      stabilityMm: 51,
    });
    expect(parsed.wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
    expect(parsed.trackWidthFrontMm).toBe(DEFAULT_SETTINGS.trackWidthFrontMm);
    expect(parsed.trackWidthRearMm).toBe(1700);
    expect(parsed.rampStepHeightsMm).toEqual([30, 60]);
    expect(parsed.toleranceMm).toBe(DEFAULT_SETTINGS.toleranceMm);
    expect(parsed.stabilityMm).toBe(DEFAULT_SETTINGS.stabilityMm);
  });

  it('keeps values at the ends of each range unchanged', () => {
    const stored = {
      wheelbaseMm: 15000,
      trackWidthFrontMm: 500,
      trackWidthRearMm: 4000,
      rampStepHeightsMm: [1, 500],
      toleranceMm: 1,
      stabilityMm: 0,
    };
    expect(parseSettings(stored)).toMatchObject(stored);
  });

  it('bounds legacy cm values the same way', () => {
    expect(parseSettings({ wheelbaseCm: 1e306 }).wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
    expect(parseSettings({ wheelbaseCm: 350 }).wheelbaseMm).toBe(3500);
    expect(parseSettings({ blockHeightCm: 1e306 }).rampStepHeightsMm).toEqual(
      DEFAULT_SETTINGS.rampStepHeightsMm,
    );
  });

  it('falls back to the defaults when every stored step height is out of range', () => {
    expect(parseSettings({ rampStepHeightsMm: [0.5, 501] }).rampStepHeightsMm).toEqual(
      DEFAULT_SETTINGS.rampStepHeightsMm,
    );
  });
});

describe('a shared vehicle setup with out-of-range lengths', () => {
  const geometry: VehicleGeometry = {
    vehicleType: 'motorhome',
    rearAxle: 'single',
    wheelbaseMm: 4200,
    trackWidthFrontMm: 1750,
    trackWidthRearMm: 1900,
    rampStepHeightsMm: [30, 60, 90],
    rampStepless: false,
    rampCount: 2,
    drainPosition: 'none',
  };

  it('falls back per field and keeps the rest', () => {
    const link = encodeVehicleGeometry({
      ...geometry,
      wheelbaseMm: 1e308,
      trackWidthRearMm: 4001,
      rampStepHeightsMm: [30, 9999],
    });
    expect(decodeVehicleGeometry(link)).toEqual({
      ...geometry,
      wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm,
      trackWidthRearMm: DEFAULT_SETTINGS.trackWidthRearMm,
      rampStepHeightsMm: [30],
    });
  });

  it('keeps in-range values unchanged', () => {
    expect(decodeVehicleGeometry(encodeVehicleGeometry(geometry))).toEqual(geometry);
  });
});
