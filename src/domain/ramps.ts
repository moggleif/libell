/**
 * Catalog of ready-made leveling ramps sold by Swedish camping shops
 * (Camping4u, Campingvaruhuset, GetCamping, Kama Fritid, Biltema …),
 * with their step heights in mm. Picking one in Settings fills the ramp
 * step list; the chips still allow fine-tuning afterwards. Pure data —
 * product names are proper nouns and are not translated.
 */

export interface RampModel {
  name: string;
  /** Step heights in mm, ascending. */
  stepsMm: number[];
}

export const RAMP_MODELS: RampModel[] = [
  { name: 'Thule Levelers', stepsMm: [44, 78, 112] },
  { name: 'Fiamma Level Up', stepsMm: [40, 70, 100] },
  { name: 'Fiamma Level Up Premium', stepsMm: [60, 120, 170] },
  { name: 'Milenco Triple Level', stepsMm: [40, 80, 120] },
  { name: 'Milenco Trident Level', stepsMm: [40, 110, 170] },
  { name: 'Milenco Quattro Level', stepsMm: [40, 80, 120, 160] },
  { name: 'Milenco Quattro 3 Level', stepsMm: [40, 90, 130, 178] },
  { name: 'Froli trappkil XL', stepsMm: [65, 115] },
  { name: 'Froli kompaktkil', stepsMm: [50, 100, 150] },
  { name: 'Biltema nivåkloss', stepsMm: [40, 70, 100] },
  { name: 'Biltema byggbar nivåkloss', stepsMm: [25, 50, 75, 100, 125] },
];

/** Display label: "Thule Levelers (44/78/112 mm)". */
export function rampLabel(model: RampModel): string {
  return `${model.name} (${model.stepsMm.join('/')} mm)`;
}

/**
 * The catalog model matching a step list exactly, or null for a custom
 * set. `preferName` breaks ties when two models share the same steps
 * (e.g. Fiamma Level Up and Biltema nivåkloss are both 40/70/100).
 */
export function matchRampModel(stepsMm: number[], preferName?: string): RampModel | null {
  const sorted = [...stepsMm].sort((a, b) => a - b);
  const matches = RAMP_MODELS.filter(
    (model) =>
      model.stepsMm.length === sorted.length && model.stepsMm.every((mm, i) => mm === sorted[i]),
  );
  return matches.find((model) => model.name === preferName) ?? matches[0] ?? null;
}
