import { describe, expect, it } from 'vitest';
import { calibrationGapProblem } from './fitWizardSpacing.ts';

describe('calibrationGapProblem (#572)', () => {
  it('passes a step without the calibration card', () => {
    expect(calibrationGapProblem(null)).toBeNull();
  });

  it('passes a card spaced as in Classic', () => {
    expect(calibrationGapProblem({ own: '3px', classic: '3px' })).toBeNull();
  });

  it('names both gaps when the appearance spaces the card differently', () => {
    expect(calibrationGapProblem({ own: '8px', classic: '3px' })).toBe(
      "the calibration card's gap is 8px, but 3px in Classic",
    );
  });
});
