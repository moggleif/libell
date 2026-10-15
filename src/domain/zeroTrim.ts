/**
 * Fine adjustment of the zero (R24, R34, R49; #596): small, signed nudges
 * added to a source's stored zero, for when "level" by the app is not quite
 * level in reality (the shower drains to one side). One tap moves the zero
 * by `ZERO_TRIM_STEP_DEG`, so the app then wants that side higher.
 *
 * The trim has the zero's own shape and sign: the leveling math subtracts
 * zero plus trim from every reading. Positive roll is right side high and
 * positive pitch front high (`leveling.ts`), so "left up" lowers the roll
 * the app calls level, and "front up" raises the pitch.
 */
import type { Calibration } from './calibration';

export type TrimDirection = 'left' | 'right' | 'front' | 'back';

/** About 3–4 mm across a 2 m track. */
export const ZERO_TRIM_STEP_DEG = 0.1;

export const NO_TRIM: Calibration = { rollDeg: 0, pitchDeg: 0 };

const NUDGE: Record<TrimDirection, Calibration> = {
  left: { rollDeg: -ZERO_TRIM_STEP_DEG, pitchDeg: 0 },
  right: { rollDeg: ZERO_TRIM_STEP_DEG, pitchDeg: 0 },
  front: { rollDeg: 0, pitchDeg: ZERO_TRIM_STEP_DEG },
  back: { rollDeg: 0, pitchDeg: -ZERO_TRIM_STEP_DEG },
};

/** Whole steps only, so many taps never drift by float noise. */
function toSteps(deg: number): number {
  return Math.round(deg / ZERO_TRIM_STEP_DEG) * ZERO_TRIM_STEP_DEG;
}

/** One tap: opposite taps cancel, since each axis is one signed sum. */
export function nudgeTrim(trim: Calibration, direction: TrimDirection): Calibration {
  const step = NUDGE[direction];
  return {
    rollDeg: toSteps(trim.rollDeg + step.rollDeg) || 0,
    pitchDeg: toSteps(trim.pitchDeg + step.pitchDeg) || 0,
  };
}

export function isTrimmed(trim: Calibration): boolean {
  return trim.rollDeg !== 0 || trim.pitchDeg !== 0;
}

/** Which side each axis now raises, and by how much: front/back first,
 * then side/side (#510's order); an untouched axis is left out. */
export function trimSummary(trim: Calibration): Array<{ side: TrimDirection; deg: number }> {
  const summary: Array<{ side: TrimDirection; deg: number }> = [];
  if (trim.pitchDeg !== 0) {
    summary.push({ side: trim.pitchDeg > 0 ? 'front' : 'back', deg: Math.abs(trim.pitchDeg) });
  }
  if (trim.rollDeg !== 0) {
    summary.push({ side: trim.rollDeg > 0 ? 'right' : 'left', deg: Math.abs(trim.rollDeg) });
  }
  return summary;
}

/** The zero the leveling math subtracts: the stored zero plus its trim.
 * An untrimmed zero is returned as it is, null included. */
export function trimmedZero(zero: Calibration | null, trim: Calibration): Calibration | null {
  if (!isTrimmed(trim)) return zero;
  return {
    rollDeg: (zero?.rollDeg ?? 0) + trim.rollDeg,
    pitchDeg: (zero?.pitchDeg ?? 0) + trim.pitchDeg,
  };
}
