/**
 * Continuous audio leveling guidance (#121) — pure TypeScript, no browser
 * APIs (ADR 0002). A completion chime (R16) already announces "reached
 * level"; this maps ongoing distance-from-level to a guidance signal a
 * thin Web Audio adapter can play while approaching, so the driver can
 * watch the ramps instead of the screen.
 *
 * The input is the STABILIZED distance from level, in mm — the same
 * number both vehicle engines already derive from their stabilizer
 * (`stability.ts`'s `DisplayResult` for a motorhome, the caravan's
 * stabilized axle/jockey result) and report as `EngineTick.maxCorrectionMm`
 * in `main.ts`. Never fed a raw sensor reading — that hysteresis is what
 * keeps this module's own dead band meaningful (R25, R27).
 *
 * Two independent things come out of one tick:
 * - pulse rate / pitch: purely a function of the *current* distance, so it
 *   never lags — it just tracks whatever the stabilized display already
 *   shows;
 * - direction (improving / worsening): needs its own hysteresis on top,
 *   per the issue's requirement that sensor noise or a stabilizer bounce
 *   must never flip it. A candidate direction is judged against the best
 *   (closest-to-level) point reached since the last committed direction —
 *   not a stale start — and must clear the Stability dead band *and* hold
 *   for a dwell before it is adopted, exactly the dead-band-plus-dwell
 *   shape `stability.ts` uses for the display itself.
 */
import type { LevelSettings } from './settings';

export type GuidanceDirection = 'improving' | 'worsening' | 'steady';

export interface GuidanceState {
  /** Milliseconds between pulses; null while level or not yet reading —
   * nothing to pulse, the R16 chime owns the "reached" moment. */
  pulseIntervalMs: number | null;
  /** Oscillator pitch for the pulse, in Hz; null alongside pulseIntervalMs. */
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
/** A direction change must hold this long before it is adopted — the same
 * dead-band-plus-dwell shape as stability.ts's STATE_DWELL_MS, sized so a
 * distinct "getting closer / wrong way" cadence reads as deliberate. */
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
 * Creates a stateful guidance tracker: feed it every stabilized
 * distance-from-level (mm) with a monotonic timestamp, and it returns what
 * to play. State is per-instance, like `createStillnessDetector` and
 * `createDisplayStabilizer` — the app owns one instance per level screen,
 * tests own their own.
 */
export function createAudioGuidance(): (
  distanceMm: number,
  isLevel: boolean,
  settings: LevelSettings,
  nowMs: number,
) => GuidanceState {
  // The best (closest-to-level) distance reached since the last committed
  // direction — the reference a reversal is judged against, so a long
  // improving streak doesn't leave a stale, far-away anchor behind.
  let extremeMm: number | null = null;
  let direction: GuidanceDirection = 'steady';
  let pendingDirection: GuidanceDirection | null = null;
  let pendingSince: number | null = null;

  return (distanceMm, isLevel, settings, nowMs) => {
    if (isLevel) {
      // The chime owns "reached" — no continuous pulsing while level, and
      // the next departure tracks direction fresh, like a cold start.
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
