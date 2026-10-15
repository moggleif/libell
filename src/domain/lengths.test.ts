import { describe, expect, it } from 'vitest';
import {
  defaultUnitForLocale,
  formatLength,
  formatLengthValue,
  inchEighths,
  mmToUnit,
  unitToMm,
} from './lengths';

describe('unitToMm (was settingsFields fromUnit, #519)', () => {
  it('turns cm into mm and leaves mm as it is', () => {
    expect(unitToMm(4.4, 'cm')).toBeCloseTo(44);
    expect(unitToMm(44, 'mm')).toBe(44);
  });
});

describe('mmToUnit (#519)', () => {
  it('turns mm into cm and leaves mm as it is', () => {
    expect(mmToUnit(44, 'cm')).toBeCloseTo(4.4);
    expect(mmToUnit(44, 'mm')).toBe(44);
  });

  it('is undone by unitToMm', () => {
    expect(unitToMm(mmToUnit(63, 'cm'), 'cm')).toBeCloseTo(63);
  });
});

describe('inches (#627)', () => {
  it('writes a length in reduced eighths with the unit', () => {
    expect(formatLength(35, 'in')).toBe('1 ⅜ in');
    expect(formatLength(25, 'in')).toBe('1 in');
    expect(formatLength(3, 'in')).toBe('⅛ in');
    expect(formatLength(0, 'in')).toBe('0 in');
    expect(formatLength(12.7, 'in')).toBe('½ in');
    expect(formatLength(19, 'in')).toBe('¾ in');
  });

  it('rounds to the nearest eighth at the edges', () => {
    // ⅛″ is 3.175 mm: just under half of it rounds down, just over rounds up.
    expect(formatLengthValue(1.5, 'in')).toBe('0');
    expect(formatLengthValue(1.6, 'in')).toBe('⅛');
    // 49.8 mm is 1.96″, nearer 2″ than 1 ⅞″: up to the whole inch.
    expect(formatLengthValue(49.8, 'in')).toBe('2');
    expect(formatLengthValue(47.6, 'in')).toBe('1 ⅞');
  });

  it('stores a typed inch value as the nearest whole mm', () => {
    expect(unitToMm(60.5, 'in')).toBe(1537);
    expect(unitToMm(1, 'in')).toBe(25);
  });

  it('shows every whole mm in inches that come back to the same mm', () => {
    for (let mm = 0; mm <= 20000; mm += 1) {
      expect(unitToMm(mmToUnit(mm, 'in'), 'in')).toBe(mm);
    }
  });

  it('splits a length into whole inches and eighths', () => {
    expect(inchEighths(35)).toEqual({ whole: 1, eighths: 3 });
    expect(inchEighths(50.8)).toEqual({ whole: 2, eighths: 0 });
  });
});

describe('defaultUnitForLocale (#627)', () => {
  it('starts the inch regions in inches', () => {
    expect(defaultUnitForLocale('en-US')).toBe('in');
    expect(defaultUnitForLocale('en-LR')).toBe('in');
    expect(defaultUnitForLocale('my-MM')).toBe('in');
    expect(defaultUnitForLocale('es-Latn-US')).toBe('in');
  });

  it('starts everything else in mm, as before', () => {
    expect(defaultUnitForLocale('en-GB')).toBe('mm');
    expect(defaultUnitForLocale('sv-SE')).toBe('mm');
    expect(defaultUnitForLocale('en')).toBe('mm');
    expect(defaultUnitForLocale(undefined)).toBe('mm');
    expect(defaultUnitForLocale('not a locale!')).toBe('mm');
  });
});
