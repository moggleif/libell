/**
 * Caravan leveling math (ADR 0008).
 *
 * A caravan has one axle plus a jockey wheel on the drawbar, and levels
 * in two independent moves: side/side with a ramp under the low axle
 * wheel, front/back by cranking the jockey wheel — which, unlike ramps,
 * adjusts in both directions. The axle is therefore the reference plane:
 * roll drives the ramp recommendation, pitch drives a signed jockey
 * correction. Settings mapping: `trackWidthRearMm` is the axle track,
 * `wheelbaseMm` the distance from the axle to the jockey wheel.
 */
import type { LevelSettings } from './settings';
import type { Calibration } from './calibration';
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
  let shown: ShownCaravan | null = null;
  return (result, settings, nowMs) => {
    if (shown === null) shown = initialCaravan(result, settings);
    else settleCaravan(shown, result, settings, nowMs);
    return caravanDisplay(result, shown, settings);
  };
}

/**
 * What the caravan screen currently shows. The one stabilized quantity for
 * the jockey is its signed mm figure; the displayed magnitude and direction
 * are both derived from it rather than tracked on their own clocks, so the
 * arrow can never point a way the number no longer agrees with (see
 * `createDisplayStabilizer`).
 */
interface ShownCaravan {
  axle: { left: DisplayWheel; right: DisplayWheel };
  pending: { left: LiftPending; right: LiftPending };
  jockeySignedMm: number;
  jockeyPending: AdaptiveDwellPending;
}

const AXLE_SIDES = ['left', 'right'] as const;

function initialCaravan(result: CaravanLevelingResult, settings: LevelSettings): ShownCaravan {
  return {
    axle: {
      left: firstAxleWheel(result.axle.left, settings),
      right: firstAxleWheel(result.axle.right, settings),
    },
    pending: { left: newLiftPending(), right: newLiftPending() },
    jockeySignedMm: result.jockeyMm,
    jockeyPending: newAdaptiveDwellPending(),
  };
}

function firstAxleWheel(wheel: WheelLift, settings: LevelSettings): DisplayWheel {
  const severity: LiftSeverity =
    wheel.liftMm <= settings.toleranceMm
      ? 'none'
      : Math.abs(wheel.liftMm - wheel.stepMm) <= settings.toleranceMm
        ? 'small'
        : 'large';
  return { displayMm: Math.round(wheel.liftMm), stepMm: wheel.stepMm, severity };
}

function settleCaravan(
  shown: ShownCaravan,
  result: CaravanLevelingResult,
  settings: LevelSettings,
  nowMs: number,
): void {
  for (const side of AXLE_SIDES) {
    const liftMm = result.axle[side].liftMm;
    shown.axle[side] = stabilizeLift(
      shown.axle[side],
      shown.pending[side],
      liftMm,
      settings,
      nowMs,
    );
  }
  // Signed jockey figure: same adaptive dead-band + dwell as a wheel's mm
  // figure — a sustained crank in one direction shouldn't lag any more than
  // driving up a ramp does.
  shown.jockeySignedMm = stabilizeNumber(
    shown.jockeySignedMm,
    shown.jockeyPending,
    result.jockeyMm,
    settings.stabilityMm,
    settings.dwellRestMs,
    settings.dwellMotionMs,
    nowMs,
  );
}

function jockeyDirectionOf(signedMm: number, settings: LevelSettings): JockeyDirection {
  if (Math.abs(signedMm) <= settings.toleranceMm) return 'ok';
  return signedMm > 0 ? 'up' : 'down';
}

function caravanDisplay(
  result: CaravanLevelingResult,
  shown: ShownCaravan,
  settings: LevelSettings,
): CaravanDisplayResult {
  const { left, right } = shown.axle;
  const direction = jockeyDirectionOf(shown.jockeySignedMm, settings);
  return {
    rollDeg: result.rollDeg,
    pitchDeg: result.pitchDeg,
    // One source of truth: level exactly when everything shows green/ok.
    isLevel: left.severity === 'none' && right.severity === 'none' && direction === 'ok',
    axle: { left, right },
    jockey: { displayMm: Math.round(Math.abs(shown.jockeySignedMm)), direction },
  };
}
