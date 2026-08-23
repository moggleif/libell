/**
 * Flip calibration (issue #50) — pure math, no browser APIs.
 *
 * Take reading A with the phone on any reasonably flat spot, rotate the
 * phone half a turn (180°) in place, take reading B. The rotation flips
 * the sign of the surface's contribution but keeps the phone's own bias
 * in the device frame:
 *
 *   A = surface + bias        B = −surface + bias
 *
 * so `bias = (A + B) / 2` and `surface = (A − B) / 2` — the surface tilt
 * cancels exactly, and no known-level surface is needed.
 */
import type { Calibration } from './settings';

/** A bias beyond this is a moved phone or a mis-capture, not case tilt. */
const MAX_BIAS_DEG = 15;

export interface FlipResult {
  /** The phone's own bias — what gets stored as the calibration. */
  bias: Calibration;
  /** The surface's tilt, for display ("your table leans 1.2°"). */
  surface: Calibration;
  /** False when the captures disagree implausibly (phone moved). */
  consistent: boolean;
}

export function flipCalibration(a: Calibration, b: Calibration): FlipResult {
  const bias: Calibration = {
    rollDeg: (a.rollDeg + b.rollDeg) / 2,
    pitchDeg: (a.pitchDeg + b.pitchDeg) / 2,
  };
  const surface: Calibration = {
    rollDeg: (a.rollDeg - b.rollDeg) / 2,
    pitchDeg: (a.pitchDeg - b.pitchDeg) / 2,
  };
  const consistent =
    Math.abs(bias.rollDeg) <= MAX_BIAS_DEG && Math.abs(bias.pitchDeg) <= MAX_BIAS_DEG;
  return { bias, surface, consistent };
}
