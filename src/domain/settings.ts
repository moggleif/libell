/**
 * Vehicle parameters used by the leveling math. Pure module — no browser
 * APIs — so it is shared between the domain tests and the localStorage
 * store in `src/data/settingsStore.ts`.
 */

export interface LevelSettings {
  /** Distance between front and rear axle, in mm. */
  wheelbaseMm: number;
  /** Distance between the front wheels, in mm. */
  trackWidthFrontMm: number;
  /** Distance between the rear wheels, in mm — may differ from the front. */
  trackWidthRearMm: number;
  /**
   * The step heights of the leveling ramp, in mm, sorted ascending. A ramp
   * is a staircase — the wheel rests on one of these heights, so the app
   * recommends the step closest to the required lift.
   */
  rampStepHeightsMm: number[];
  /**
   * Max height a wheel may sit below the highest wheel and still count
   * as level, in mm. Height-based, so wheelbase and track width are
   * inherently accounted for.
   */
  toleranceMm: number;
  /**
   * Display hysteresis dead band in mm: how far a reading must move past
   * a boundary before the shown value changes. 0 disables it.
   */
  stabilityMm: number;
  /** Unit used for displayed lengths; storage and math stay mm. */
  displayUnit: 'mm' | 'cm';
  /** Play a chime when the vehicle reaches level (opt-in). */
  soundOnLevel: boolean;
  /** Color theme: follow the phone, or force light/dark. */
  theme: ThemeSetting;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export const DEFAULT_SETTINGS: LevelSettings = {
  wheelbaseMm: 4000,
  trackWidthFrontMm: 1800,
  trackWidthRearMm: 1800,
  rampStepHeightsMm: [40],
  toleranceMm: 20,
  stabilityMm: 3,
  displayUnit: 'mm',
  soundOnLevel: false,
  theme: 'system',
};

/**
 * Phone calibration: the roll/pitch the sensor reports when the phone lies
 * on a surface known to be level (a case, a slightly warped table). Stored
 * separately from the vehicle settings and subtracted from every reading.
 */
export interface Calibration {
  rollDeg: number;
  pitchDeg: number;
}

/** Offsets beyond this are a mis-tap, not a phone bias. */
const MAX_CALIBRATION_DEG = 15;

/** Validate a stored calibration; null when missing or corrupt. */
export function parseCalibration(value: unknown): Calibration | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const rollDeg = raw.rollDeg;
  const pitchDeg = raw.pitchDeg;
  if (
    typeof rollDeg !== 'number' ||
    typeof pitchDeg !== 'number' ||
    !Number.isFinite(rollDeg) ||
    !Number.isFinite(pitchDeg) ||
    Math.abs(rollDeg) > MAX_CALIBRATION_DEG ||
    Math.abs(pitchDeg) > MAX_CALIBRATION_DEG
  ) {
    return null;
  }
  return { rollDeg, pitchDeg };
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
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
 * values are migrated: everything once stored in cm (wheelbase, track
 * widths — including a single `trackWidthCm` for both axles — and step
 * heights) is converted to mm.
 */
export function parseSettings(value: unknown): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const cm = (v: unknown) => {
    const n = positiveNumber(v, NaN);
    return Number.isNaN(n) ? undefined : n * 10;
  };
  const legacyTrackMm = cm(raw.trackWidthCm);

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
    wheelbaseMm: positiveNumber(
      raw.wheelbaseMm,
      cm(raw.wheelbaseCm) ?? DEFAULT_SETTINGS.wheelbaseMm,
    ),
    trackWidthFrontMm: positiveNumber(
      raw.trackWidthFrontMm,
      cm(raw.trackWidthFrontCm) ?? legacyTrackMm ?? DEFAULT_SETTINGS.trackWidthFrontMm,
    ),
    trackWidthRearMm: positiveNumber(
      raw.trackWidthRearMm,
      cm(raw.trackWidthRearCm) ?? legacyTrackMm ?? DEFAULT_SETTINGS.trackWidthRearMm,
    ),
    rampStepHeightsMm: heights,
    // A legacy toleranceDeg (degrees) has no unambiguous mm equivalent —
    // it falls back to the default.
    toleranceMm: positiveNumber(raw.toleranceMm, DEFAULT_SETTINGS.toleranceMm),
    stabilityMm: nonNegativeNumber(raw.stabilityMm, DEFAULT_SETTINGS.stabilityMm),
    displayUnit: raw.displayUnit === 'cm' ? 'cm' : 'mm',
    soundOnLevel: raw.soundOnLevel === true,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
  };
}

/** Format a length in the chosen display unit ("63 mm" / "6.3 cm"). */
export function formatLength(mm: number, unit: 'mm' | 'cm'): string {
  if (unit === 'cm') {
    const cm = mm / 10;
    return `${Number.isInteger(cm) ? cm : cm.toFixed(1)} cm`;
  }
  return `${Math.round(mm)} mm`;
}
