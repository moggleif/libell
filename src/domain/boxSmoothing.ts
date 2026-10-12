/**
 * Smoothing for a Sensorbox reading.
 *
 * The phone streams dozens of samples a second and smooths them as they
 * arrive (`sensor/orientation.ts`). A box delivers far fewer — the Xparkle
 * is polled twice a second — and unsmoothed, so the level screen would jump
 * once per sample and show every flicker of the box's last digit (#457).
 * This low-pass runs on every rendered frame instead of every sample, so the
 * shown value glides between two readings, and it is time-based, so the
 * result does not depend on the frame rate.
 */
import type { GravityVector } from './leveling';

/** How quickly a box reading is followed: about two thirds of a change is
 * shown after this long. One Xparkle poll interval. */
export const BOX_SMOOTHING_TIME_CONSTANT_MS = 500;

export interface GravityLowPass {
  /** The smoothed reading at `nowMs`, given the box's latest one. */
  (reading: GravityVector, nowMs: number): GravityVector;
  /** Forget the history: the next reading passes through unchanged. */
  reset(): void;
}

export function createGravityLowPass(timeConstantMs: number): GravityLowPass {
  let smoothed: GravityVector | null = null;
  let lastAt = 0;

  const smooth = (reading: GravityVector, nowMs: number): GravityVector => {
    if (smoothed === null) {
      smoothed = reading;
      lastAt = nowMs;
      return smoothed;
    }
    const elapsedMs = nowMs - lastAt;
    if (elapsedMs <= 0) return smoothed;
    lastAt = nowMs;
    const alpha = 1 - Math.exp(-elapsedMs / timeConstantMs);
    smoothed = {
      x: smoothed.x + alpha * (reading.x - smoothed.x),
      y: smoothed.y + alpha * (reading.y - smoothed.y),
      z: smoothed.z + alpha * (reading.z - smoothed.z),
    };
    return smoothed;
  };
  smooth.reset = () => {
    smoothed = null;
  };
  return smooth;
}
