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
