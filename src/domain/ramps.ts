/**
 * Catalog of ready-made leveling ramps sold by camping shops and DIY
 * stores (Camping4u, Campingvaruhuset, GetCamping, Kama Fritid, Biltema,
 * Jula …), with their step heights in mm. New models are added only with
 * step heights from a product page, noted beside the entry (#601), or
 * by Morgan's explicit decision, noted the same way (#686). Picking one in Settings fills the ramp
 * step list; the chips still allow fine-tuning afterwards. Pure data —
 * product names are proper nouns and are not translated.
 */

import type { LevelSettings } from './settings';

export interface RampModel {
  name: string;
  /** Step heights in mm, ascending; a stepless wedge's maximum alone. */
  stepsMm: number[];
  /** Driven up to any height up to its maximum (#600). */
  stepless?: boolean;
  /** One movable step, set on the kloss before driving up (#687, R57). */
  adjustable?: boolean;
}

export const RAMP_MODELS: RampModel[] = [
  { name: 'Thule Levelers', stepsMm: [44, 78, 112] },
  { name: 'Fiamma Level Up', stepsMm: [40, 70, 100] },
  // "drei Stufen auf 7, 13, und 17 cm Höhe" (reimo.com, art. 912397, "Fiamma
  // Level Up Premium"); was 60/120/170 with no source (#601).
  { name: 'Fiamma Level Up Premium', stepsMm: [70, 130, 170] },
  { name: 'Milenco Triple Level', stepsMm: [40, 80, 120] },
  { name: 'Milenco Trident Level', stepsMm: [40, 110, 170] },
  { name: 'Milenco Quattro Level', stepsMm: [40, 80, 120, 160] },
  { name: 'Milenco Quattro 3 Level', stepsMm: [40, 90, 130, 178] },
  { name: 'Froli trappkil XL', stepsMm: [65, 115] },
  { name: 'Froli kompaktkil', stepsMm: [50, 100, 150] },
  { name: 'Biltema nivåkloss', stepsMm: [40, 70, 100] },
  { name: 'Biltema byggbar nivåkloss', stepsMm: [25, 50, 75, 100, 125] },
  // #601: each step list below is quoted from a shop's product page.
  // "3 niveaux : H 4,5 cm - H 8 cm - H 11 cm" (camping-car-plus.com, art. 11640).
  { name: 'Brunner Equalizer XL', stepsMm: [45, 80, 110] },
  // "3 Levels at: 4cm, 7cm, 10cm" (jacksonsleisure.com, Fiamma Jumbo Levelling Ramps).
  { name: 'Fiamma Jumbo', stepsMm: [40, 70, 100] },
  // "tre höjdnivåer: 4 cm, 7 cm och 10 cm" (jula.se, art. 001691).
  { name: 'Hamron nivåklossar', stepsMm: [40, 70, 100] },
  // "Användbar i tre olika höjder (40, 70 och 100mm)" (bygghemma.se, bauhaus.se).
  { name: 'Briv nivåklossar', stepsMm: [40, 70, 100] },
  // "3 verschiedene Höhen in einer Rampe: 10 / 7 / 4 cm" (kaufland.at, product 539657967).
  { name: 'TrutzHolm Auffahrkeil 5 t', stepsMm: [40, 70, 100] },
  // "9 nivåer, upp till 18 cm höjd" (fortaltsbutiken.se, art. C16-47); no
  // source gives each position's height, so 2 cm per step is Morgan's
  // decision (2026-10-22, #686), not a quote.
  {
    name: 'Lippert LEVEL9',
    stepsMm: [20, 40, 60, 80, 100, 120, 140, 160, 180],
    adjustable: true,
  },
  // "Precise leveling at any increment between 1/2” and 4”"
  // (andersenhitches.com/products/camper-leveler): 4″ is 101.6 mm, rounded
  // down so the plan never counts on height the wedge lacks.
  { name: 'Andersen Camper Leveler', stepsMm: [101], stepless: true },
];

/** The steps the wheel cards number: none on a stepless wedge, which is
 * driven up by height instead. */
export function numberedSteps(ramp: Pick<LevelSettings, 'rampStepHeightsMm' | 'rampStepless'>) {
  return ramp.rampStepless ? [] : ramp.rampStepHeightsMm;
}

/** The heights a ramp keeps: a stepless wedge only its maximum, the
 * tallest of `stepsMm`; a staircase every step (#600). */
export function rampHeights(stepsMm: number[], stepless: boolean): number[] {
  return stepless && stepsMm.length > 0 ? [Math.max(...stepsMm)] : stepsMm;
}

/** Display label: "Thule Levelers (44/78/112 mm)". */
export function rampLabel(model: RampModel): string {
  return `${model.name} (${model.stepsMm.join('/')} mm)`;
}

/**
 * The catalog model matching a step list exactly, or null for a custom
 * set; a stepless wedge matches only a stepless model. `preferName` breaks
 * ties when two models share the same steps (e.g. Fiamma Level Up and
 * Biltema nivåkloss are both 40/70/100).
 */
export function matchRampModel(
  stepsMm: number[],
  preferName?: string,
  stepless = false,
): RampModel | null {
  const sorted = [...stepsMm].sort((a, b) => a - b);
  const matches = RAMP_MODELS.filter(
    (model) =>
      (model.stepless ?? false) === stepless &&
      model.stepsMm.length === sorted.length &&
      model.stepsMm.every((mm, i) => mm === sorted[i]),
  );
  return matches.find((model) => model.name === preferName) ?? matches[0] ?? null;
}

/** Klossar set before driving up (#687): a catalog model marked
 * adjustable, or a set with its exact steps, which shows its name too. */
export function isAdjustableRamp(
  ramp: Pick<LevelSettings, 'rampStepHeightsMm' | 'rampStepless'>,
): boolean {
  return matchRampModel(ramp.rampStepHeightsMm, undefined, ramp.rampStepless)?.adjustable ?? false;
}

/** How far the largest lift must fall for the vehicle to have driven up
 * onto the klossar: half the smallest step (#687). */
export function driveUpDropMm(ramp: Pick<LevelSettings, 'rampStepHeightsMm'>): number {
  return Math.min(...ramp.rampStepHeightsMm) / 2;
}
