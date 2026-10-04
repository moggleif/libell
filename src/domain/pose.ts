/**
 * Phone pose detection (issue #51) — pure, no browser APIs.
 *
 * The leveling math assumes the phone lies flat. When the user picks the
 * phone up (total tilt beyond ~25°) the readings are meaningless, so the
 * UI must pause and say so instead of showing wrong guidance. A Schmitt
 * band (enter > 25°, exit < 20°) keeps the overlay from flickering at
 * the boundary; even the steepest realistic ramp pose stays far below
 * both thresholds.
 */
import type { GravityVector } from './leveling';

const ENTER_NOT_FLAT_DEG = 25;
const EXIT_NOT_FLAT_DEG = 20;
const RAD_TO_DEG = 180 / Math.PI;

export type Pose = 'flat' | 'not-flat';

/** Total tilt: the angle between gravity and the screen normal. */
export function totalTiltDeg(gravity: GravityVector): number {
  const len = Math.hypot(gravity.x, gravity.y, gravity.z);
  if (len === 0) return 90;
  return Math.acos(Math.min(1, Math.max(-1, gravity.z / len))) * RAD_TO_DEG;
}

/** Stateful detector with hysteresis; feed it every reading. */
export function createPoseDetector(): (gravity: GravityVector) => Pose {
  let pose: Pose = 'flat';
  return (gravity) => {
    const tilt = totalTiltDeg(gravity);
    if (pose === 'flat' && tilt > ENTER_NOT_FLAT_DEG) pose = 'not-flat';
    else if (pose === 'not-flat' && tilt < EXIT_NOT_FLAT_DEG) pose = 'flat';
    return pose;
  };
}

/**
 * A permanently-mounted external sensor (#285) is never "picked up", so the
 * phone's 25° pose rule does not apply to it. The one mount that still
 * produces confident wrong guidance is fully upside-down (R43): its face
 * points down, so gravity's z component is negative.
 */
export function isUpsideDown(gravity: GravityVector): boolean {
  return gravity.z < 0;
}

const ENTER_EXTREME_DEG = 45;
const EXIT_EXTREME_DEG = 40;

export type ExternalPose = 'ok' | 'extreme' | 'upside-down';

/**
 * Pose check for a permanently-mounted external sensor (#285). Far looser
 * than the phone's 25° rule — a vehicle on ramps tilts a mounted box by
 * several degrees — but a box lying on its side, hanging from a wall or
 * face-down reads far beyond that and would give confident wrong guidance.
 * Face-down is reported separately so the overlay can say what to fix;
 * "extreme" has a Schmitt band (enter > 45°, exit < 40°) like the phone's.
 */
export function createExternalPoseDetector(): (gravity: GravityVector) => ExternalPose {
  let extreme = false;
  return (gravity) => {
    if (isUpsideDown(gravity)) {
      extreme = true;
      return 'upside-down';
    }
    const tilt = totalTiltDeg(gravity);
    if (!extreme && tilt > ENTER_EXTREME_DEG) extreme = true;
    else if (extreme && tilt < EXIT_EXTREME_DEG) extreme = false;
    return extreme ? 'extreme' : 'ok';
  };
}
