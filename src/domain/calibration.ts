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

/**
 * Two-layer calibration (#83, ADR 0010): the sensor offset (the phone's
 * own bias) and the vehicle zero (the tilt of the phone's normal spot,
 * captured with the vehicle verified level) are stored separately and
 * summed into the single offset the leveling math subtracts.
 */
export function combineCalibrations(
  sensor: Calibration | null,
  vehicle: Calibration | null,
): Calibration | null {
  if (!sensor) return vehicle;
  if (!vehicle) return sensor;
  return {
    rollDeg: sensor.rollDeg + vehicle.rollDeg,
    pitchDeg: sensor.pitchDeg + vehicle.pitchDeg,
  };
}

/**
 * The vehicle zero is stored sensor-corrected — the raw reading minus
 * the sensor calibration at capture time — so it is pure placement tilt
 * and survives a later sensor recalibration or clear.
 */
export function vehicleZeroFromReading(raw: Calibration, sensor: Calibration | null): Calibration {
  return {
    rollDeg: raw.rollDeg - (sensor?.rollDeg ?? 0),
    pitchDeg: raw.pitchDeg - (sensor?.pitchDeg ?? 0),
  };
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
