/**
 * Display hysteresis — pure TypeScript, no browser APIs.
 *
 * The smoothed sensor still jitters a little, and when a wheel's lift sits
 * exactly on a boundary (a cm rounding edge, the midpoint between two ramp
 * steps, a severity threshold, the level tolerance) the raw display would
 * flap several times a second. This module keeps the previous displayed
 * value until the underlying reading moves past the boundary by a dead
 * band, like a thermostat.
 */
import type { LevelingResult, LiftSeverity, WheelId } from './leveling';
import { liftSeverity, recommendStep, WHEEL_IDS } from './leveling';
import type { LevelSettings } from './settings';

export interface DisplayWheel {
  /** Lift rounded to whole mm, changed only past the dead band. */
  displayMm: number;
  /** Recommended ramp step (mm, 0 = none), changed only when clearly better. */
  stepMm: number;
  severity: LiftSeverity;
}

export interface DisplayResult {
  rollDeg: number;
  pitchDeg: number;
  isLevel: boolean;
  wheels: Record<WheelId, DisplayWheel>;
}

/**
 * Creates a stateful stabilizer: feed it every LevelingResult and render
 * what it returns. State is per-instance, so tests and the app each own
 * their history.
 */
export function createDisplayStabilizer(): (
  result: LevelingResult,
  settings: LevelSettings,
) => DisplayResult {
  const wheels = {} as Record<WheelId, DisplayWheel>;
  let initialized = false;
  let level = false;

  return (result, settings) => {
    // The dead band is the user-facing "Stability" setting.
    const deadbandMm = settings.stabilityMm;

    // Level status: a symmetric Schmitt band around the tolerance. Enter
    // level only clearly below it, leave only clearly above it — jitter
    // sitting exactly on the boundary can never flip the state (and with
    // it the message, the overlay and the vibration).
    const maxLiftMm = Math.max(...WHEEL_IDS.map((id) => result.wheels[id].liftMm));
    if (!initialized) {
      level = result.isLevel;
    } else if (level) {
      level = maxLiftMm <= settings.toleranceMm + deadbandMm;
    } else if (maxLiftMm <= Math.max(0, settings.toleranceMm - deadbandMm)) {
      level = true;
    }

    for (const id of WHEEL_IDS) {
      const liftMm = result.wheels[id].liftMm;
      const fresh: DisplayWheel = {
        displayMm: Math.round(liftMm),
        stepMm: recommendStep(liftMm, settings.rampStepHeightsMm),
        severity: liftSeverity(liftMm, settings),
      };
      if (!initialized) {
        wheels[id] = fresh;
        continue;
      }
      const prev = wheels[id];

      // Whole-mm figure: keep the shown value while the reading stays
      // within half a mm plus the dead band of it.
      const displayMm =
        Math.abs(liftMm - prev.displayMm) <= 0.5 + deadbandMm ? prev.displayMm : fresh.displayMm;

      // Ramp step: switch only when the candidate is clearly closer than
      // the currently shown step (0 = "no step" competes too).
      const stepMm =
        Math.abs(liftMm - fresh.stepMm) + deadbandMm < Math.abs(liftMm - prev.stepMm)
          ? fresh.stepMm
          : prev.stepMm;

      // Severity: change color only once the reading is past the boundary
      // by the dead band; liftSeverity at (lift ∓ dead band) agreeing with
      // the fresh value means we are clearly on the new side.
      const towardPrev = fresh.severity !== prev.severity ? deadbandMm : 0;
      const severity =
        liftSeverity(liftMm - towardPrev, settings) === fresh.severity &&
        liftSeverity(liftMm + towardPrev, settings) === fresh.severity
          ? fresh.severity
          : prev.severity;

      wheels[id] = { displayMm, stepMm, severity };
    }

    initialized = true;
    return { rollDeg: result.rollDeg, pitchDeg: result.pitchDeg, isLevel: level, wheels };
  };
}
