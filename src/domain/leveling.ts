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
  /** The lift expressed in leveling blocks, rounded to nearest. */
  blocks: number;
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

/** Wheel positions in the vehicle plane: x = right, y = front. */
function wheelPositions(settings: LevelSettings): Record<WheelId, { x: number; y: number }> {
  const halfTrack = settings.trackWidthCm / 2;
  const halfBase = settings.wheelbaseCm / 2;
  return {
    frontLeft: { x: -halfTrack, y: halfBase },
    frontRight: { x: halfTrack, y: halfBase },
    rearLeft: { x: -halfTrack, y: -halfBase },
    rearRight: { x: halfTrack, y: -halfBase },
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
    wheels[id] = { liftCm, blocks: Math.round(liftCm / settings.blockHeightCm) };
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

export type LiftSeverity = 'none' | 'small' | 'large';

/**
 * Classify a lift for the diagram colors. "Large" means roughly a stack of
 * blocks (≥ 2), so the threshold keeps meaning when block height changes.
 */
export function liftSeverity(liftCm: number, settings: LevelSettings): LiftSeverity {
  if (liftCm < settings.blockHeightCm / 2) return 'none';
  return liftCm < settings.blockHeightCm * 2 ? 'small' : 'large';
}
