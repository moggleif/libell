/**
 * Display hysteresis — pure TypeScript, no browser APIs.
 *
 * The smoothed sensor still jitters a little, and when a wheel's lift sits
 * exactly on a boundary (a cm rounding edge, the midpoint between two ramp
 * steps, a severity threshold, the level tolerance) the raw display would
 * flap several times a second. Two mechanisms keep the screen calm:
 *
 * - a dead band (the user's "Stability" setting): a displayed value only
 *   changes once the reading is clearly past the boundary, like a
 *   thermostat;
 * - a dwell time: even a clear change is adopted only after it has held
 *   continuously for a moment, so a single noise spike can never flip
 *   anything. Jitter that oscillates across a boundary keeps resetting
 *   the dwell clock and the display stays frozen.
 *
 * The level status is derived from the displayed wheel severities — level
 * exactly when every wheel shows green — so the status text, the overlay
 * and the wheel colors can never contradict each other.
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

/** A changed mm figure or ramp step must hold this long before it shows. */
export const VALUE_DWELL_MS = 600;
/** A changed color (and with it the level status) must hold this long. */
export const STATE_DWELL_MS = 1500;

interface PendingChanges {
  displaySince: number | null;
  stepSince: number | null;
  severitySince: number | null;
}

/**
 * Creates a stateful stabilizer: feed it every LevelingResult with a
 * monotonic timestamp (`performance.now()` in the app, hand-stepped in
 * tests) and render what it returns. State is per-instance, so tests and
 * the app each own their history.
 */
export function createDisplayStabilizer(): (
  result: LevelingResult,
  settings: LevelSettings,
  nowMs: number,
) => DisplayResult {
  const wheels = {} as Record<WheelId, DisplayWheel>;
  const pending = {} as Record<WheelId, PendingChanges>;
  let initialized = false;

  return (result, settings, nowMs) => {
    // The dead band is the user-facing "Stability" setting.
    const deadbandMm = settings.stabilityMm;

    for (const id of WHEEL_IDS) {
      const liftMm = result.wheels[id].liftMm;
      const fresh: DisplayWheel = {
        displayMm: Math.round(liftMm),
        stepMm: recommendStep(liftMm, settings.rampStepHeightsMm),
        severity: liftSeverity(liftMm, settings),
      };
      if (!initialized) {
        wheels[id] = fresh;
        pending[id] = { displaySince: null, stepSince: null, severitySince: null };
        continue;
      }
      const prev = wheels[id];
      const pend = pending[id];

      // Whole-mm figure: the reading must sit half a mm plus the dead
      // band away from the shown value, and stay there for the dwell.
      const wantsDisplay = Math.abs(liftMm - prev.displayMm) > 0.5 + deadbandMm;
      let displayMm = prev.displayMm;
      if (!wantsDisplay) {
        pend.displaySince = null;
      } else {
        pend.displaySince ??= nowMs;
        if (nowMs - pend.displaySince >= VALUE_DWELL_MS) {
          displayMm = fresh.displayMm;
          pend.displaySince = null;
        }
      }

      // Ramp step: the candidate must be clearly closer than the shown
      // step (0 = "no step" competes too), sustained for the dwell.
      const wantsStep =
        Math.abs(liftMm - fresh.stepMm) + deadbandMm < Math.abs(liftMm - prev.stepMm);
      let stepMm = prev.stepMm;
      if (!wantsStep) {
        pend.stepSince = null;
      } else {
        pend.stepSince ??= nowMs;
        if (nowMs - pend.stepSince >= VALUE_DWELL_MS) {
          stepMm = fresh.stepMm;
          pend.stepSince = null;
        }
      }

      // Severity: the reading must be past the color boundary by the dead
      // band in both directions (clearly on the new side), and hold there
      // for the state dwell before the color — and the level status that
      // is derived from it — may change.
      const wantsSeverity =
        fresh.severity !== prev.severity &&
        liftSeverity(liftMm - deadbandMm, settings) === fresh.severity &&
        liftSeverity(liftMm + deadbandMm, settings) === fresh.severity;
      let severity = prev.severity;
      if (!wantsSeverity) {
        pend.severitySince = null;
      } else {
        pend.severitySince ??= nowMs;
        if (nowMs - pend.severitySince >= STATE_DWELL_MS) {
          severity = fresh.severity;
          pend.severitySince = null;
        }
      }

      wheels[id] = { displayMm, stepMm, severity };
    }

    initialized = true;
    // Level exactly when every wheel shows green — one source of truth.
    const isLevel = WHEEL_IDS.every((id) => wheels[id].severity === 'none');
    return { rollDeg: result.rollDeg, pitchDeg: result.pitchDeg, isLevel, wheels };
  };
}
