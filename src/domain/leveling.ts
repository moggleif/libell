/**
 * Leveling math — pure TypeScript, no browser APIs.
 *
 * Input is the gravity vector in device coordinates with the phone lying
 * flat inside the vehicle, top edge toward the front (x = right, y = front,
 * z = out of the screen; flat means gz > 0). From that the vehicle's roll
 * and pitch follow, and per wheel the height difference to the highest
 * wheel — which is the reference, because blocks only go under wheels.
 */
import type { Calibration, LevelSettings } from './settings';

export interface GravityVector {
  x: number;
  y: number;
  z: number;
}

export type WheelId = 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';

export const WHEEL_IDS: readonly WheelId[] = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];

export const WHEEL_LABELS: Record<WheelId, string> = {
  frontLeft: 'Front left',
  frontRight: 'Front right',
  rearLeft: 'Rear left',
  rearRight: 'Rear right',
};

export interface WheelLift {
  /** How much this wheel must be raised, in mm (≥ 0). */
  liftMm: number;
  /**
   * The ramp step closest to the required lift, in mm — 0 when driving
   * onto even the smallest step would overshoot more than staying off.
   */
  stepMm: number;
}

export interface LevelingResult {
  /** Side/side tilt in degrees; negative = right side low. */
  rollDeg: number;
  /** Front/back tilt in degrees; negative = front low. */
  pitchDeg: number;
  wheels: Record<WheelId, WheelLift>;
  /** True when no wheel sits more than the tolerance (mm) below the highest. */
  isLevel: boolean;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Roll/pitch (radians) from the gravity vector, with an optional stored
 * calibration subtracted — shared by the motorhome and caravan math.
 */
export function tiltFromGravity(
  gravity: GravityVector,
  calibration: Calibration | null,
): { roll: number; pitch: number } {
  return {
    roll: Math.atan2(gravity.x, gravity.z) - (calibration ? calibration.rollDeg / RAD_TO_DEG : 0),
    pitch: Math.atan2(gravity.y, gravity.z) - (calibration ? calibration.pitchDeg / RAD_TO_DEG : 0),
  };
}

/** Wheel positions in the vehicle plane (mm): x = right, y = front. Each
 * axle has its own track width — many RVs are narrower over one axle. */
function wheelPositions(settings: LevelSettings): Record<WheelId, { x: number; y: number }> {
  const halfFront = settings.trackWidthFrontMm / 2;
  const halfRear = settings.trackWidthRearMm / 2;
  const halfBase = settings.wheelbaseMm / 2;
  return {
    frontLeft: { x: -halfFront, y: halfBase },
    frontRight: { x: halfFront, y: halfBase },
    rearLeft: { x: -halfRear, y: -halfBase },
    rearRight: { x: halfRear, y: -halfBase },
  };
}

export function computeLeveling(
  gravity: GravityVector,
  settings: LevelSettings,
  calibration: Calibration | null = null,
): LevelingResult {
  const { roll, pitch } = tiltFromGravity(gravity, calibration);

  const positions = wheelPositions(settings);
  const heights = WHEEL_IDS.map((id) => {
    const { x, y } = positions[id];
    return { id, z: x * Math.tan(roll) + y * Math.tan(pitch) };
  });
  const highest = Math.max(...heights.map((h) => h.z));

  const wheels = {} as Record<WheelId, WheelLift>;
  let maxLiftMm = 0;
  for (const { id, z } of heights) {
    const liftMm = highest - z;
    maxLiftMm = Math.max(maxLiftMm, liftMm);
    wheels[id] = { liftMm, stepMm: recommendStep(liftMm, settings.rampStepHeightsMm) };
  }

  return {
    rollDeg: roll * RAD_TO_DEG,
    pitchDeg: pitch * RAD_TO_DEG,
    wheels,
    // Height-based: level when no wheel sits more than the tolerance below
    // the highest one. Wheelbase and track width are inherent in the lifts,
    // so the same tolerance means the same thing on every vehicle.
    isLevel: maxLiftMm <= settings.toleranceMm,
  };
}

/**
 * Pick the available ramp step (mm) closest to the required lift (mm).
 * "No step" (0) is a candidate too, so a lift smaller than half the
 * lowest step recommends staying off the ramp — the generalization of the
 * old round-to-nearest-block behavior. Ties go to the lower step.
 */
export function recommendStep(liftMm: number, stepsMm: number[]): number {
  let best = 0;
  for (const step of stepsMm) {
    if (Math.abs(liftMm - step) < Math.abs(liftMm - best)) best = step;
  }
  return best;
}

/**
 * Wheel display states. 'unserved' — low, but the ramp plan has no ramp
 * left for it (ADR 0011) — is produced only by `plannedSeverity` in
 * `rampPlan.ts`; the per-wheel `liftSeverity` below never returns it.
 */
export type LiftSeverity = 'none' | 'small' | 'large' | 'unserved';

/**
 * Classify a lift for the diagram colors — "is it worth driving up?":
 * green (none) when the wheel is within the tolerance, orange (small)
 * when some ramp step brings it within tolerance, red (large) when even
 * the best available step leaves it outside — not worth driving up with
 * the ramps you have.
 */
export function liftSeverity(liftMm: number, settings: LevelSettings): LiftSeverity {
  if (liftMm <= settings.toleranceMm) return 'none';
  const best = recommendStep(liftMm, settings.rampStepHeightsMm);
  return Math.abs(liftMm - best) <= settings.toleranceMm ? 'small' : 'large';
}
