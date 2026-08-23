/**
 * Vehicle parameters used by the leveling math. Pure module — no browser
 * APIs — so it is shared between the domain tests and the localStorage
 * store in `src/data/settingsStore.ts`.
 */

export interface LevelSettings {
  /** Distance between front and rear axle, in cm. */
  wheelbaseCm: number;
  /** Distance between the front wheels, in cm. */
  trackWidthFrontCm: number;
  /** Distance between the rear wheels, in cm — may differ from the front. */
  trackWidthRearCm: number;
  /**
   * The step heights of the leveling ramp, in mm, sorted ascending. A ramp
   * is a staircase — the wheel rests on one of these heights, so the app
   * recommends the step closest to the required lift.
   */
  rampStepHeightsMm: number[];
  /** Max |roll| and |pitch| still considered level, in degrees. */
  toleranceDeg: number;
}

export const DEFAULT_SETTINGS: LevelSettings = {
  wheelbaseCm: 400,
  trackWidthFrontCm: 180,
  trackWidthRearCm: 180,
  rampStepHeightsMm: [40],
  toleranceDeg: 0.5,
};

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeHeights(values: number[]): number[] {
  const cleaned = values.filter((v) => Number.isFinite(v) && v > 0);
  return [...new Set(cleaned)].sort((a, b) => a - b);
}

/**
 * Parse the settings-form text for available step heights: mm values
 * separated by semicolons (commas tolerated as a decimal or list
 * separator), e.g. "20; 45; 60". Invalid entries are dropped.
 */
export function parseStepHeightsList(text: string): number[] {
  const items = text.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed === '') return [];
    // Accept a decimal comma ("4,5") but also plain comma-separated lists.
    if (trimmed.includes(',') && !/^\d+,\d+$/.test(trimmed)) {
      return trimmed.split(',').map((p) => Number.parseFloat(p.trim().replace(',', '.')));
    }
    return [Number.parseFloat(trimmed.replace(',', '.'))];
  });
  return normalizeHeights(items);
}

/** Format the step heights back into the form's "20; 40; 60" notation. */
export function formatStepHeightsList(heights: number[]): string {
  return heights.join('; ');
}

/**
 * Turn untrusted input (localStorage JSON, hand-edited or from an older
 * version) into a usable `LevelSettings`. Each field falls back to its
 * default independently, so one bad value never breaks startup. Legacy
 * values are migrated: a single `trackWidthCm` seeds both axles, and step
 * heights stored in cm (`blockHeightsCm` list or single `blockHeightCm`)
 * are converted to mm.
 */
export function parseSettings(value: unknown): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const legacyTrack = positiveNumber(raw.trackWidthCm, NaN);
  const trackFallback = Number.isNaN(legacyTrack) ? undefined : legacyTrack;

  let heights = Array.isArray(raw.rampStepHeightsMm)
    ? normalizeHeights(raw.rampStepHeightsMm.filter((v): v is number => typeof v === 'number'))
    : [];
  if (heights.length === 0 && Array.isArray(raw.blockHeightsCm)) {
    heights = normalizeHeights(
      raw.blockHeightsCm.filter((v): v is number => typeof v === 'number').map((v) => v * 10),
    );
  }
  if (heights.length === 0) {
    const legacyBlockCm = positiveNumber(raw.blockHeightCm, NaN);
    heights = Number.isNaN(legacyBlockCm)
      ? DEFAULT_SETTINGS.rampStepHeightsMm
      : [legacyBlockCm * 10];
  }

  return {
    wheelbaseCm: positiveNumber(raw.wheelbaseCm, DEFAULT_SETTINGS.wheelbaseCm),
    trackWidthFrontCm: positiveNumber(
      raw.trackWidthFrontCm,
      trackFallback ?? DEFAULT_SETTINGS.trackWidthFrontCm,
    ),
    trackWidthRearCm: positiveNumber(
      raw.trackWidthRearCm,
      trackFallback ?? DEFAULT_SETTINGS.trackWidthRearCm,
    ),
    rampStepHeightsMm: heights,
    toleranceDeg: positiveNumber(raw.toleranceDeg, DEFAULT_SETTINGS.toleranceDeg),
  };
}
