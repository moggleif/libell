/**
 * Leveling math — pure TypeScript, no browser APIs.
 *
 * Input is the gravity vector in device coordinates with the phone lying
 * flat inside the vehicle, top edge toward the front (x = right, y = front,
 * z = out of the screen; flat means gz > 0). From that the vehicle's roll
 * and pitch follow, and per wheel the height difference to the highest
 * wheel — which is the reference, because blocks only go under wheels.
 */
import type { LevelSettings } from './settings';

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
  /** How much this wheel must be raised, in cm (≥ 0). */
  liftCm: number;
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
  /** True when |roll| and |pitch| are both within the tolerance. */
  isLevel: boolean;
}

const RAD_TO_DEG = 180 / Math.PI;

/** Wheel positions in the vehicle plane: x = right, y = front. Each axle
 * has its own track width — many RVs are narrower over one axle. */
function wheelPositions(settings: LevelSettings): Record<WheelId, { x: number; y: number }> {
  const halfFront = settings.trackWidthFrontCm / 2;
  const halfRear = settings.trackWidthRearCm / 2;
  const halfBase = settings.wheelbaseCm / 2;
  return {
    frontLeft: { x: -halfFront, y: halfBase },
    frontRight: { x: halfFront, y: halfBase },
    rearLeft: { x: -halfRear, y: -halfBase },
    rearRight: { x: halfRear, y: -halfBase },
  };
}

export function computeLeveling(gravity: GravityVector, settings: LevelSettings): LevelingResult {
  const roll = Math.atan2(gravity.x, gravity.z);
  const pitch = Math.atan2(gravity.y, gravity.z);

  const positions = wheelPositions(settings);
  const heights = WHEEL_IDS.map((id) => {
    const { x, y } = positions[id];
    return { id, z: x * Math.tan(roll) + y * Math.tan(pitch) };
  });
  const highest = Math.max(...heights.map((h) => h.z));

  const wheels = {} as Record<WheelId, WheelLift>;
  for (const { id, z } of heights) {
    const liftCm = highest - z;
    wheels[id] = { liftCm, stepMm: recommendStep(liftCm * 10, settings.rampStepHeightsMm) };
  }

  const rollDeg = roll * RAD_TO_DEG;
  const pitchDeg = pitch * RAD_TO_DEG;
  return {
    rollDeg,
    pitchDeg,
    wheels,
    isLevel:
      Math.abs(rollDeg) < settings.toleranceDeg && Math.abs(pitchDeg) < settings.toleranceDeg,
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

export type LiftSeverity = 'none' | 'small' | 'large';

/**
 * Classify a lift for the diagram colors: green (none) when no step is
 * needed, red (large) when even the tallest available step cannot reach
 * the required lift, orange (small) in between.
 */
export function liftSeverity(liftCm: number, settings: LevelSettings): LiftSeverity {
  const stepsMm = settings.rampStepHeightsMm;
  const minMm = stepsMm[0] ?? Infinity;
  const maxMm = stepsMm[stepsMm.length - 1] ?? Infinity;
  const liftMm = liftCm * 10;
  if (liftMm < minMm / 2) return 'none';
  return liftMm <= maxMm ? 'small' : 'large';
}
