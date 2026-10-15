import { describe, expect, it } from 'vitest';
import { matchRampModel, numberedSteps, rampHeights, rampLabel, RAMP_MODELS } from './ramps';
import { DEFAULT_SETTINGS } from './settings';

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
  });
});

describe('rampHeights (#600)', () => {
  it('keeps every step of a staircase and only the tallest of a wedge', () => {
    expect(rampHeights([40, 80, 120], false)).toEqual([40, 80, 120]);
    expect(rampHeights([40, 120, 80], true)).toEqual([120]);
    expect(rampHeights([], true)).toEqual([]);
  });
});
