/**
 * Continuous audio leveling guidance while approaching level, so the driver
 * can watch the ramps instead of the screen. The completion chime (R16) owns the
 * "reached level" moment.
 *
 * The input is the STABILIZED distance from level, in mm
 * (`EngineTick.maxCorrectionMm`), never a raw sensor reading — the
 * stabilizer's hysteresis is what keeps this module's dead band meaningful
 * (R25, R27).
 *
 * Two independent things come out of one tick:
 * - pulse rate / pitch: a function of the current distance only, so it never
 *   lags;
 * - direction (improving / worsening): needs its own hysteresis so sensor
 *   noise or a stabilizer bounce never flips it. A candidate is judged against
 *   the best (closest-to-level) point since the last committed direction, and
 *   must clear the Stability dead band *and* hold for a dwell — the same shape
 *   `stability.ts` uses for the display.
 */
import type { LevelSettings } from './settings';

export type GuidanceDirection = 'improving' | 'worsening' | 'steady';

export interface GuidanceState {
  /** Null while level or not yet reading — the R16 chime owns "reached". */
  pulseIntervalMs: number | null;
  pitchHz: number | null;
  /** Trend of the stabilized distance since the last committed direction. */
  direction: GuidanceDirection;
}

/** Fastest pulse: reached right at the tolerance boundary (still not level). */
export const MIN_PULSE_INTERVAL_MS = 180;
/** Slowest pulse: reached at/beyond GUIDANCE_RANGE_MM past the tolerance. */
export const MAX_PULSE_INTERVAL_MS = 900;
/** Lowest pulse pitch, at/beyond GUIDANCE_RANGE_MM past the tolerance. */
export const MIN_PITCH_HZ = 440;
/** Highest pulse pitch, right at the tolerance boundary. */
export const MAX_PITCH_HZ = 880;
/** Distance beyond the tolerance that maps to the slowest/lowest pulse. */
export const GUIDANCE_RANGE_MM = 120;
/** A direction change must hold this long before it is adopted, so a
 * "getting closer / wrong way" change reads as deliberate. */
export const DIRECTION_DWELL_MS = 800;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** 0 (at/beyond GUIDANCE_RANGE_MM past tolerance) .. 1 (at the tolerance). */
function progressOf(distanceMm: number, toleranceMm: number): number {
  const beyond = Math.max(0, distanceMm - toleranceMm);
  return clamp01(1 - beyond / GUIDANCE_RANGE_MM);
}

/**
 * Feed it every stabilized distance-from-level (mm) with a monotonic
 * timestamp; it returns what to play.
 */
export function createAudioGuidance(): (
  distanceMm: number,
  isLevel: boolean,
  settings: LevelSettings,
  nowMs: number,
) => GuidanceState {
  // The best distance since the last committed direction: the reference a
  // reversal is judged against, so a long improving streak doesn't leave a
  // stale, far-away anchor behind.
  let extremeMm: number | null = null;
  let direction: GuidanceDirection = 'steady';
  let pendingDirection: GuidanceDirection | null = null;
  let pendingSince: number | null = null;

  return (distanceMm, isLevel, settings, nowMs) => {
    if (isLevel) {
      // The next departure tracks direction fresh, like a cold start.
      extremeMm = distanceMm;
      direction = 'steady';
      pendingDirection = null;
      pendingSince = null;
      return { pulseIntervalMs: null, pitchHz: null, direction };
    }

    const deadbandMm = settings.stabilityMm;
    extremeMm ??= distanceMm;
    if (direction === 'improving' && distanceMm < extremeMm) extremeMm = distanceMm;
    if (direction === 'worsening' && distanceMm > extremeMm) extremeMm = distanceMm;

    const delta = distanceMm - extremeMm;
    let candidate = direction;
    if (delta > deadbandMm) candidate = 'worsening';
    else if (delta < -deadbandMm) candidate = 'improving';

    if (candidate === direction) {
      pendingDirection = null;
      pendingSince = null;
    } else if (candidate !== pendingDirection) {
      pendingDirection = candidate;
      pendingSince = nowMs;
    } else if (pendingSince !== null && nowMs - pendingSince >= DIRECTION_DWELL_MS) {
      direction = candidate;
      extremeMm = distanceMm;
      pendingDirection = null;
      pendingSince = null;
    }

    const progress = progressOf(distanceMm, settings.toleranceMm);
    return {
      pulseIntervalMs: Math.round(
        MAX_PULSE_INTERVAL_MS - progress * (MAX_PULSE_INTERVAL_MS - MIN_PULSE_INTERVAL_MS),
      ),
      pitchHz: Math.round(MIN_PITCH_HZ + progress * (MAX_PITCH_HZ - MIN_PITCH_HZ)),
      direction,
    };
  };
}
