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
  recommendStep,
  tiltFromGravity,
  type GravityVector,
  type LiftSeverity,
  type WheelLift,
} from './leveling';
import {
  newAdaptiveDwellPending,
  newLiftPending,
  stabilizeLift,
  stabilizeNumber,
  type AdaptiveDwellPending,
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
  // The one stabilized quantity for the jockey is its signed mm figure;
  // the displayed magnitude and direction are both derived from it below
  // rather than tracked on their own clocks, so — as with the axle wheels
  // and the motorhome screen — the arrow can never point a way the number
  // has already stopped agreeing with (see `createDisplayStabilizer`'s
  // doc comment for the field report this pattern fixed).
  let jockeyShownSignedMm = 0;
  const jockeyPending: AdaptiveDwellPending = newAdaptiveDwellPending();

  return (result, settings, nowMs) => {
    const deadbandMm = settings.stabilityMm;
    const dirOf = (mm: number): JockeyDirection =>
      Math.abs(mm) <= settings.toleranceMm ? 'ok' : mm > 0 ? 'up' : 'down';

    if (!initialized) {
      initialized = true;
      for (const side of ['left', 'right'] as const) {
        const liftMm = result.axle[side].liftMm;
        const severity: LiftSeverity =
          liftMm <= settings.toleranceMm
            ? 'none'
            : Math.abs(liftMm - result.axle[side].stepMm) <= settings.toleranceMm
              ? 'small'
              : 'large';
        axle[side] = { displayMm: Math.round(liftMm), stepMm: result.axle[side].stepMm, severity };
      }
      jockeyShownSignedMm = result.jockeyMm;
    } else {
      axle.left = stabilizeLift(axle.left, pending.left, result.axle.left.liftMm, settings, nowMs);
      axle.right = stabilizeLift(
        axle.right,
        pending.right,
        result.axle.right.liftMm,
        settings,
        nowMs,
      );

      // Signed jockey figure: same adaptive dead-band + dwell as a wheel's
      // mm figure — a sustained crank in one direction shouldn't lag any
      // more than driving up a ramp does.
      jockeyShownSignedMm = stabilizeNumber(
        jockeyShownSignedMm,
        jockeyPending,
        result.jockeyMm,
        deadbandMm,
        settings.dwellRestMs,
        settings.dwellMotionMs,
        nowMs,
      );
    }

    const jockeyDirection = dirOf(jockeyShownSignedMm);
    return {
      rollDeg: result.rollDeg,
      pitchDeg: result.pitchDeg,
      // One source of truth: level exactly when everything shows green/ok.
      isLevel:
        axle.left.severity === 'none' && axle.right.severity === 'none' && jockeyDirection === 'ok',
      axle: { left: axle.left, right: axle.right },
      jockey: { displayMm: Math.round(Math.abs(jockeyShownSignedMm)), direction: jockeyDirection },
    };
  };
}
