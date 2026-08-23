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
  /** Height of one leveling block, in cm. */
  blockHeightCm: number;
  /** Max |roll| and |pitch| still considered level, in degrees. */
  toleranceDeg: number;
}

export const DEFAULT_SETTINGS: LevelSettings = {
  wheelbaseCm: 400,
  trackWidthFrontCm: 180,
  trackWidthRearCm: 180,
  blockHeightCm: 4,
  toleranceDeg: 0.5,
};

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Turn untrusted input (localStorage JSON, hand-edited or from an older
 * version) into a usable `LevelSettings`. Each field falls back to its
 * default independently, so one bad value never breaks startup. A single
 * `trackWidthCm` stored by versions that predate per-axle track widths
 * seeds both axles.
 */
export function parseSettings(value: unknown): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const legacyTrack = positiveNumber(raw.trackWidthCm, NaN);
  const trackFallback = Number.isNaN(legacyTrack) ? undefined : legacyTrack;
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
    blockHeightCm: positiveNumber(raw.blockHeightCm, DEFAULT_SETTINGS.blockHeightCm),
    toleranceDeg: positiveNumber(raw.toleranceDeg, DEFAULT_SETTINGS.toleranceDeg),
  };
}
