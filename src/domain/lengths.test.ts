import { describe, expect, it } from 'vitest';
import { mmToUnit, unitToMm } from './lengths';

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
