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

/** Extra margin (mm) a reading must move past a boundary to change the display. */
const DEADBAND_MM = 3;
/** Extra degrees beyond the tolerance before "level" is taken away again. */
const LEVEL_EXIT_MARGIN_DEG = 0.15;

export interface DisplayWheel {
  /** Lift rounded to whole cm, changed only past the dead band. */
  displayCm: number;
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
    // Level status first: it gates the wheel colors below. Enter at the
    // tolerance, leave only past it by a margin, so the "Your RV is
    // level!" message does not blink.
    const maxTilt = Math.max(Math.abs(result.rollDeg), Math.abs(result.pitchDeg));
    if (!initialized) {
      level = result.isLevel;
    } else if (level) {
      level = maxTilt < settings.toleranceDeg + LEVEL_EXIT_MARGIN_DEG;
    } else {
      level = result.isLevel;
    }

    for (const id of WHEEL_IDS) {
      const liftMm = result.wheels[id].liftCm * 10;
      const fresh: DisplayWheel = {
        displayCm: Math.round(liftMm / 10),
        stepMm: recommendStep(liftMm, settings.rampStepHeightsMm),
        severity: liftSeverity(liftMm / 10, settings, level),
      };
      if (!initialized) {
        wheels[id] = fresh;
        continue;
      }
      const prev = wheels[id];

      // Whole-cm figure: keep the shown value while the reading stays
      // within half a cm plus the dead band of it.
      const displayCm =
        Math.abs(liftMm - prev.displayCm * 10) <= 5 + DEADBAND_MM
          ? prev.displayCm
          : fresh.displayCm;

      // Ramp step: switch only when the candidate is clearly closer than
      // the currently shown step (0 = "no step" competes too).
      const stepMm =
        Math.abs(liftMm - fresh.stepMm) + DEADBAND_MM < Math.abs(liftMm - prev.stepMm)
          ? fresh.stepMm
          : prev.stepMm;

      // Severity: change color only once the reading is past the boundary
      // by the dead band; liftSeverity at (lift ∓ dead band) agreeing with
      // the fresh value means we are clearly on the new side.
      const towardPrev = fresh.severity !== prev.severity ? DEADBAND_MM : 0;
      const severity =
        liftSeverity((liftMm - towardPrev) / 10, settings, level) === fresh.severity &&
        liftSeverity((liftMm + towardPrev) / 10, settings, level) === fresh.severity
          ? fresh.severity
          : prev.severity;

      wheels[id] = { displayCm, stepMm, severity };
    }

    initialized = true;
    return { rollDeg: result.rollDeg, pitchDeg: result.pitchDeg, isLevel: level, wheels };
  };
}
