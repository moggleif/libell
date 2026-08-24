/**
 * Caravan leveling math — pure TypeScript, no browser APIs (ADR 0008).
 *
 * A caravan has one axle plus a jockey wheel on the drawbar, and levels
 * in two independent moves: side/side with a ramp under the low axle
 * wheel, front/back by cranking the jockey wheel — which, unlike ramps,
 * adjusts in both directions. The axle is therefore the reference plane:
 * roll drives the ramp recommendation, pitch drives a signed jockey
 * correction. Settings mapping: `trackWidthRearMm` is the axle track,
 * `wheelbaseMm` the distance from the axle to the jockey wheel.
 */
import type { Calibration, LevelSettings } from './settings';
import {
  liftSeverity,
  recommendStep,
  tiltFromGravity,
  type GravityVector,
  type WheelLift,
} from './leveling';
import {
  newLiftPending,
  stabilizeLift,
  STATE_DWELL_MS,
  VALUE_DWELL_MS,
  type DisplayWheel,
  type LiftPending,
} from './stability';

const RAD_TO_DEG = 180 / Math.PI;

export interface CaravanLevelingResult {
  /** Side/side tilt in degrees; negative = right side low. */
  rollDeg: number;
  /** Front/back tilt in degrees; negative = front (jockey) low. */
  pitchDeg: number;
  /** The axle pair — one wheel always has lift 0 (the reference side). */
  axle: { left: WheelLift; right: WheelLift };
  /** Signed jockey correction in mm: > 0 = crank up, < 0 = crank down. */
  jockeyMm: number;
  /** True when the axle lift and the jockey correction are both within tolerance. */
  isLevel: boolean;
}

export function computeCaravanLeveling(
  gravity: GravityVector,
  settings: LevelSettings,
  calibration: Calibration | null = null,
): CaravanLevelingResult {
  const { roll, pitch } = tiltFromGravity(gravity, calibration);

  // Axle wheels at x = ±track/2 (same convention as the motorhome math:
  // negative roll = right side low). The higher wheel is the reference.
  const half = settings.trackWidthRearMm / 2;
  const zLeft = -half * Math.tan(roll);
  const zRight = half * Math.tan(roll);
  const high = Math.max(zLeft, zRight);
  const lift = (z: number): WheelLift => ({
    liftMm: high - z,
    stepMm: recommendStep(high - z, settings.rampStepHeightsMm),
  });

  // Jockey wheel forward of the axle: front low (negative pitch) means
  // crank up — the correction is how far the coupling must move.
  const jockeyMm = -settings.wheelbaseMm * Math.tan(pitch);

  return {
    rollDeg: roll * RAD_TO_DEG,
    pitchDeg: pitch * RAD_TO_DEG,
    axle: { left: lift(zLeft), right: lift(zRight) },
    jockeyMm,
    isLevel:
      Math.abs(high - Math.min(zLeft, zRight)) <= settings.toleranceMm &&
      Math.abs(jockeyMm) <= settings.toleranceMm,
  };
}

export type JockeyDirection = 'ok' | 'up' | 'down';

export interface CaravanDisplayResult {
  rollDeg: number;
  pitchDeg: number;
  isLevel: boolean;
  axle: { left: DisplayWheel; right: DisplayWheel };
  jockey: { displayMm: number; direction: JockeyDirection };
}

/**
 * Display hysteresis for the caravan screen: the axle wheels reuse the
 * shared lift stabilizer; the jockey gets the same dead-band + dwell
 * treatment on its magnitude and its direction state.
 */
export function createCaravanStabilizer(): (
  result: CaravanLevelingResult,
  settings: LevelSettings,
  nowMs: number,
) => CaravanDisplayResult {
  let initialized = false;
  const axle = {} as { left: DisplayWheel; right: DisplayWheel };
  const pending: { left: LiftPending; right: LiftPending } = {
    left: newLiftPending(),
    right: newLiftPending(),
  };
  let jockeyShownMm = 0;
  let jockeyDirection: JockeyDirection = 'ok';
  let jockeyMmSince: number | null = null;
  let jockeyDirSince: number | null = null;

  return (result, settings, nowMs) => {
    const deadbandMm = settings.stabilityMm;
    const dirOf = (mm: number): JockeyDirection =>
      Math.abs(mm) <= settings.toleranceMm ? 'ok' : mm > 0 ? 'up' : 'down';
    const freshMm = Math.round(Math.abs(result.jockeyMm));
    const freshDir = dirOf(result.jockeyMm);

    if (!initialized) {
      initialized = true;
      for (const side of ['left', 'right'] as const) {
        const liftMm = result.axle[side].liftMm;
        axle[side] = {
          displayMm: Math.round(liftMm),
          stepMm: result.axle[side].stepMm,
          severity: liftSeverity(liftMm, settings),
        };
      }
      jockeyShownMm = freshMm;
      jockeyDirection = freshDir;
    } else {
      axle.left = stabilizeLift(axle.left, pending.left, result.axle.left.liftMm, settings, nowMs);
      axle.right = stabilizeLift(
        axle.right,
        pending.right,
        result.axle.right.liftMm,
        settings,
        nowMs,
      );

      // Jockey magnitude: like the wheel mm figure — clearly past the shown
      // value, sustained for the value dwell.
      const wantsMm = Math.abs(Math.abs(result.jockeyMm) - jockeyShownMm) > 0.5 + deadbandMm;
      if (!wantsMm) {
        jockeyMmSince = null;
      } else {
        jockeyMmSince ??= nowMs;
        if (nowMs - jockeyMmSince >= VALUE_DWELL_MS) {
          jockeyShownMm = freshMm;
          jockeyMmSince = null;
        }
      }

      // Jockey direction: clearly past the tolerance boundary by the dead
      // band in both directions, held for the state dwell.
      const magnitude = Math.abs(result.jockeyMm);
      const sign = Math.sign(result.jockeyMm);
      const wantsDir =
        freshDir !== jockeyDirection &&
        dirOf(sign * (magnitude - deadbandMm)) === freshDir &&
        dirOf(sign * (magnitude + deadbandMm)) === freshDir;
      if (!wantsDir) {
        jockeyDirSince = null;
      } else {
        jockeyDirSince ??= nowMs;
        if (nowMs - jockeyDirSince >= STATE_DWELL_MS) {
          jockeyDirection = freshDir;
          jockeyDirSince = null;
        }
      }
    }

    return {
      rollDeg: result.rollDeg,
      pitchDeg: result.pitchDeg,
      // One source of truth: level exactly when everything shows green/ok.
      isLevel:
        axle.left.severity === 'none' && axle.right.severity === 'none' && jockeyDirection === 'ok',
      axle: { left: axle.left, right: axle.right },
      jockey: { displayMm: jockeyShownMm, direction: jockeyDirection },
    };
  };
}
