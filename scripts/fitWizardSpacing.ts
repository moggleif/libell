/// <reference lib="dom" />
/**
 * The guide's calibration step tightens its card's spacing on short screens
 * so the step fits, and that has to hold in every appearance (#572): a rule
 * keyed on one appearance must not quietly override it.
 */

/** The card's gap as drawn, and as Classic would draw it on the same page. */
export interface CalibrationGap {
  own: string;
  classic: string;
}

/**
 * Runs in the page (`page.evaluate`), hence the DOM types above. Classic is the appearance with no
 * `data-appearance` attribute, so dropping it for one measurement shows
 * Classic's spacing without a second page load. Null on a step without
 * the calibration card.
 */
export function measureCalibrationGap(): CalibrationGap | null {
  const card = document.querySelector('.onboarding .calibration-card');
  if (!card) return null;
  const root = document.documentElement;
  const appearance = root.dataset.appearance;
  const own = getComputedStyle(card).rowGap;
  delete root.dataset.appearance;
  const classic = getComputedStyle(card).rowGap;
  if (appearance !== undefined) root.dataset.appearance = appearance;
  return { own, classic };
}

/** What is wrong with the measured spacing, or null when nothing is. */
export function calibrationGapProblem(gap: CalibrationGap | null): string | null {
  if (gap === null || gap.own === gap.classic) return null;
  return `the calibration card's gap is ${gap.own}, but ${gap.classic} in Classic`;
}
