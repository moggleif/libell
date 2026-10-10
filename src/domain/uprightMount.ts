/**
 * A box that must stand upright (#304) — pure, no browser APIs.
 *
 * The Xparkle RVS01 (R49) only measures correctly standing up. Lying on
 * its back it reads about 90° of pitch, and there turning it about its own
 * axis moves both angles — found on hardware (#273) — so no zero taken
 * there holds. Its own zero (#290) would hide that, since it makes the box
 * read 0° at rest however it lies, so Libell refuses to zero a box that
 * reads as lying down.
 *
 * The one way past that refusal is a second, deliberate tap: the way back
 * for a box that already stands upright but was zeroed lying down earlier,
 * and so now reads about a quarter turn. That recovery happens in Libell,
 * never in the vendor app.
 */
import type { Calibration } from './settings';

/** Past this on either axis the box is not standing upright — the same
 * 45° the external pose overlay enters "extreme" at (`pose.ts`). */
export const UPRIGHT_LIMIT_DEG = 45;

/** How long after a refusal a second tap zeroes the box anyway. */
export const ZERO_CONFIRM_WINDOW_MS = 30_000;

/** True when the box's own reading says it stands upright, a few degrees
 * of mounting or parking tilt included. */
export function isStandingUpright(reading: Calibration): boolean {
  return (
    Math.abs(reading.pitchDeg) <= UPRIGHT_LIMIT_DEG &&
    Math.abs(reading.rollDeg) <= UPRIGHT_LIMIT_DEG
  );
}

/**
 * Whether "Set vehicle level" may zero the box now: yes when it stands
 * upright, or when there is no reading to judge by (not being connected is
 * reported on its own); otherwise only as a second tap within
 * `ZERO_CONFIRM_WINDOW_MS` of the refusal.
 */
export function mayZeroUprightBox(
  reading: Calibration | null,
  lastRefusedAt: number | null,
  now: number,
): boolean {
  if (!reading || isStandingUpright(reading)) return true;
  return lastRefusedAt !== null && now - lastRefusedAt <= ZERO_CONFIRM_WINDOW_MS;
}
