import { describe, expect, it } from 'vitest';
import {
  driveUpDropMm,
  isAdjustableRamp,
  matchRampModel,
  numberedSteps,
  rampHeights,
  rampLabel,
  RAMP_MODELS,
} from './ramps';
import { DEFAULT_SETTINGS, LENGTH_RANGES_MM } from './settings';

describe('ramp catalog', () => {
  it('lists every model with positive, ascending, whole-mm steps', () => {
    for (const model of RAMP_MODELS) {
      expect(model.name.length).toBeGreaterThan(0);
      expect(model.stepsMm.length).toBeGreaterThan(0);
      // A stepless wedge is listed by its maximum height alone.
      if (model.stepless) expect(model.stepsMm).toHaveLength(1);
      for (const [i, mm] of model.stepsMm.entries()) {
        expect(mm).toBeGreaterThan(0);
        expect(Number.isInteger(mm)).toBe(true);
        if (i > 0) expect(mm).toBeGreaterThan(model.stepsMm[i - 1] ?? Infinity);
      }
    }
  });

  it('keeps every step within the plausible ramp-step range (#601)', () => {
    const { min, max } = LENGTH_RANGES_MM.rampStep;
    for (const mm of RAMP_MODELS.flatMap((model) => model.stepsMm)) {
      expect(mm).toBeGreaterThanOrEqual(min);
      expect(mm).toBeLessThanOrEqual(max);
    }
  });

  it('lists the models added with a sourced step list (#601)', () => {
    const steps = (name: string) => RAMP_MODELS.find((m) => m.name === name)?.stepsMm;
    expect(steps('Brunner Equalizer XL')).toEqual([45, 80, 110]);
    expect(steps('Fiamma Level Up Premium')).toEqual([70, 130, 170]);
    expect(steps('Fiamma Jumbo')).toEqual([40, 70, 100]);
    expect(steps('Hamron nivåklossar')).toEqual([40, 70, 100]);
    expect(steps('Briv nivåklossar')).toEqual([40, 70, 100]);
    expect(steps('TrutzHolm Auffahrkeil 5 t')).toEqual([40, 70, 100]);
  });

  it('lists Lippert LEVEL9 with 9 steps of 2 cm (#686)', () => {
    const level9 = RAMP_MODELS.find((m) => m.name === 'Lippert LEVEL9');
    expect(level9?.stepsMm).toEqual([20, 40, 60, 80, 100, 120, 140, 160, 180]);
    expect(level9?.stepless).toBeUndefined();
  });

  it('marks only LEVEL9 adjustable, also as a set with its steps (#687)', () => {
    expect(RAMP_MODELS.filter((m) => m.adjustable).map((m) => m.name)).toEqual(['Lippert LEVEL9']);
    const level9 = [20, 40, 60, 80, 100, 120, 140, 160, 180];
    expect(isAdjustableRamp({ rampStepHeightsMm: level9, rampStepless: false })).toBe(true);
    expect(isAdjustableRamp(DEFAULT_SETTINGS)).toBe(false);
    expect(isAdjustableRamp({ rampStepHeightsMm: [180], rampStepless: true })).toBe(false);
  });

  it('counts half the smallest step as driving up (#687)', () => {
    expect(driveUpDropMm({ rampStepHeightsMm: [20, 40, 60] })).toBe(10);
  });

  it('has unique names', () => {
    const names = RAMP_MODELS.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('labels a model with its steps in mm', () => {
    expect(rampLabel({ name: 'Thule Levelers', stepsMm: [44, 78, 112] })).toBe(
      'Thule Levelers (44/78/112 mm)',
    );
  });

  it('matches the default settings to Thule Levelers', () => {
    expect(matchRampModel(DEFAULT_SETTINGS.rampStepHeightsMm)?.name).toBe('Thule Levelers');
  });

  it('matches regardless of order and returns null for a custom set', () => {
    expect(matchRampModel([112, 44, 78])?.name).toBe('Thule Levelers');
    expect(matchRampModel([40, 70, 100, 130])).toBeNull();
    expect(matchRampModel([])).toBeNull();
  });

  it('matches a stepless wedge only as stepless, by its maximum (#600)', () => {
    const wedge = RAMP_MODELS.find((m) => m.stepless)!;
    expect(matchRampModel(wedge.stepsMm, undefined, true)?.name).toBe(wedge.name);
    expect(matchRampModel(wedge.stepsMm)).toBeNull();
    expect(matchRampModel([44, 78, 112], undefined, true)).toBeNull();
  });

  it('numbers the steps of a staircase, and none of a stepless wedge (#600)', () => {
    expect(numberedSteps({ rampStepHeightsMm: [40, 80], rampStepless: false })).toEqual([40, 80]);
    expect(numberedSteps({ rampStepHeightsMm: [110], rampStepless: true })).toEqual([]);
  });

  it('prefers the already-selected model when two share the same steps', () => {
    // Fiamma Level Up and Biltema nivåkloss are both 40/70/100 mm.
    expect(matchRampModel([40, 70, 100])?.name).toBe('Fiamma Level Up');
    expect(matchRampModel([40, 70, 100], 'Biltema nivåkloss')?.name).toBe('Biltema nivåkloss');
    expect(matchRampModel([40, 70, 100], 'Hamron nivåklossar')?.name).toBe('Hamron nivåklossar');
  });
});

describe('rampHeights (#600)', () => {
  it('keeps every step of a staircase and only the tallest of a wedge', () => {
    expect(rampHeights([40, 80, 120], false)).toEqual([40, 80, 120]);
    expect(rampHeights([40, 120, 80], true)).toEqual([120]);
    expect(rampHeights([], true)).toEqual([]);
  });
});
