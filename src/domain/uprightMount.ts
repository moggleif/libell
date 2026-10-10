/**
 * A box that must stand upright (#304) — pure, no browser APIs.
 *
 * The Xparkle RVS01 (R49) only measures correctly standing up. Lying on
 * its back it reads about 90° of pitch, and there turning it about its own
 * axis moves both angles — found on hardware (#273) — so no zero taken
 * there holds. Libell never blocks anything on this: it shows the user,
 * live, whether the box stands, and says how to fix it when it does not.
 */
import type { Calibration } from './settings';

/** Past this on either axis the box is not standing upright — the same
 * 45° the external pose overlay enters "extreme" at (`pose.ts`). */
export const UPRIGHT_LIMIT_DEG = 45;

/** True when the box's reading says it stands upright, a few degrees of
 * mounting or parking tilt included. */
export function isStandingUpright(reading: Calibration): boolean {
  return (
    Math.abs(reading.pitchDeg) <= UPRIGHT_LIMIT_DEG &&
    Math.abs(reading.rollDeg) <= UPRIGHT_LIMIT_DEG
  );
}
