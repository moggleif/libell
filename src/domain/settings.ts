/**
 * Vehicle parameters used by the leveling math. Pure module — no browser
 * APIs — so it is shared between the domain tests and the localStorage
 * store in `src/data/settingsStore.ts`.
 */

export interface LevelSettings {
  /** Distance between front and rear axle, in cm. */
  wheelbaseCm: number;
  /** Distance between left and right wheels, in cm. */
  trackWidthCm: number;
  /** Height of one leveling block, in cm. */
  blockHeightCm: number;
  /** Max |roll| and |pitch| still considered level, in degrees. */
  toleranceDeg: number;
}

export const DEFAULT_SETTINGS: LevelSettings = {
  wheelbaseCm: 400,
  trackWidthCm: 180,
  blockHeightCm: 4,
  toleranceDeg: 0.5,
};

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Turn untrusted input (localStorage JSON, hand-edited or from an older
 * version) into a usable `LevelSettings`. Each field falls back to its
 * default independently, so one bad value never breaks startup.
 */
export function parseSettings(value: unknown): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return {
    wheelbaseCm: positiveNumber(raw.wheelbaseCm, DEFAULT_SETTINGS.wheelbaseCm),
    trackWidthCm: positiveNumber(raw.trackWidthCm, DEFAULT_SETTINGS.trackWidthCm),
    blockHeightCm: positiveNumber(raw.blockHeightCm, DEFAULT_SETTINGS.blockHeightCm),
    toleranceDeg: positiveNumber(raw.toleranceDeg, DEFAULT_SETTINGS.toleranceDeg),
  };
}
