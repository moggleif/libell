/**
 * Hitch height memory for a caravan (#598): the drawbar's pitch while the
 * caravan still sits on the tow ball, saved so the jockey wheel can be
 * cranked back to it before hitching up again.
 *
 * Only pitch is kept: side tilt does not matter for hitching. The pitch is
 * stored relative to the active zero, like a target (ADR 0013), so redoing
 * or clearing the zero never moves it. Going back to it is the ordinary
 * caravan math (`computeCaravanLeveling`) with the saved pitch as one more
 * offset: the jockey correction toward it is the same signed figure as
 * toward level, never a second copy of that math.
 */
import { combineCalibrations, type Calibration } from './calibration';
import type { CaravanDisplayResult } from './caravan';

/** The pitch to save from a raw reading: how far it is from the zero. */
export function hitchPitchFromReading(reading: Calibration, zero: Calibration | null): number {
  return reading.pitchDeg - (zero?.pitchDeg ?? 0);
}

/** What "done" means while going back to the hitch height: the zero with
 * the saved pitch on top, and no side tilt of its own. */
export function hitchCalibration(zero: Calibration | null, pitchDeg: number): Calibration | null {
  return combineCalibrations(zero, { rollDeg: 0, pitchDeg });
}

/**
 * The caravan screen while going back to the hitch height: only the jockey
 * wheel has something to do. The axle wheels read as done, so no ramp is
 * asked for, and "done" means the jockey is within tolerance.
 */
export function hitchDisplay(result: CaravanDisplayResult): CaravanDisplayResult {
  const done = { displayMm: 0, stepMm: 0, severity: 'none' as const };
  return {
    ...result,
    axle: { left: done, right: done },
    isLevel: result.jockey.direction === 'ok',
  };
}

/** A drawbar this steep is no caravan on a tow ball: a corrupt value. */
const MAX_HITCH_PITCH_DEG = 45;

/** A stored hitch pitch, or null when absent or not a plausible angle. */
export function parseHitchPitch(value: unknown): number | null {
  return typeof value === 'number' && Math.abs(value) <= MAX_HITCH_PITCH_DEG ? value : null;
}
