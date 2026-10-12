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

/**
 * What capturing a calibration or zero answered (#411): null when it was
 * stored, an error text when nothing could be read, or a warning when the
 * reading looks too tilted to be level — then nothing is stored until the
 * user chooses to go ahead anyway ("Varning är rätt. Aldrig stopp.").
 */
export type CaptureResult = null | string | { warning: string };

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

/**
 * The mean of several readings, axis by axis, or null for none. A box
 * that streams raw, unsmoothed samples (EasyLevel) is zeroed from a short
 * run of them rather than one: its own app says to press OK a few times
 * until the value settles.
 */
export function averageReadings(readings: readonly Calibration[]): Calibration | null {
  if (readings.length === 0) return null;
  let roll = 0;
  let pitch = 0;
  for (const reading of readings) {
    roll += reading.rollDeg;
    pitch += reading.pitchDeg;
  }
  return { rollDeg: roll / readings.length, pitchDeg: pitch / readings.length };
}
