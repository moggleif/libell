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
 *
 * The motorhome screen shows a ramp *plan* (which wheels get the owned
 * ramps — ADR 0011), so its stabilizer guards the plan as a whole; the
 * caravan reuses the per-wheel `stabilizeLift` core.
 */
import type { LevelingResult, LiftSeverity, WheelId } from './leveling';
import { liftSeverity, recommendStep, WHEEL_IDS } from './leveling';
import { evaluateSteps, plannedSeverity, planRamps, type RampPlan } from './rampPlan';
import type { LevelSettings } from './settings';

export interface DisplayWheel {
  /** Lift rounded to whole mm, changed only past the dead band. */
  displayMm: number;
  /** Planned ramp step (mm, 0 = none), changed only when clearly better. */
  stepMm: number;
  severity: LiftSeverity;
}

export interface DisplayResult {
  rollDeg: number;
  pitchDeg: number;
  isLevel: boolean;
  wheels: Record<WheelId, DisplayWheel>;
  /** How un-level the *shown* plan leaves the vehicle (mm, ≥ 0) — the same
   * stabilized plan the wheel steps/severities come from, so the status
   * line's magnitude wording (#125) can never disagree with the diagram. */
  maxDeficitMm: number;
}

/** A changed mm figure or ramp step must hold this long before it shows. */
export const VALUE_DWELL_MS = 600;
/** A changed color (and with it the level status) must hold this long. */
export const STATE_DWELL_MS = 1500;

export interface LiftPending {
  displaySince: number | null;
  stepSince: number | null;
  severitySince: number | null;
}

export function newLiftPending(): LiftPending {
  return { displaySince: null, stepSince: null, severitySince: null };
}

/**
 * Stabilize one wheel's displayed lift/step/severity against the previous
 * shown state — the dead-band + dwell core used by the caravan, whose
 * single ramped wheel needs no plan (the step is simply the closest one).
 */
export function stabilizeLift(
  prev: DisplayWheel,
  pend: LiftPending,
  liftMm: number,
  settings: LevelSettings,
  nowMs: number,
): DisplayWheel {
  const deadbandMm = settings.stabilityMm;
  const fresh: DisplayWheel = {
    displayMm: Math.round(liftMm),
    stepMm: recommendStep(liftMm, settings.rampStepHeightsMm),
    severity: liftSeverity(liftMm, settings),
  };

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
  const wantsStep = Math.abs(liftMm - fresh.stepMm) + deadbandMm < Math.abs(liftMm - prev.stepMm);
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

  return { displayMm, stepMm, severity };
}

/**
 * Creates a stateful stabilizer for the motorhome screen: feed it every
 * LevelingResult with a monotonic timestamp (`performance.now()` in the
 * app, hand-stepped in tests) and render what it returns. State is
 * per-instance, so tests and the app each own their history.
 *
 * Three stabilized layers:
 * - each wheel's mm figure: dead band + dwell on the raw lift, as before;
 * - the ramp plan (which wheels get steps): a fresh optimum replaces the
 *   shown plan only when it is *clearly* better under the current lifts —
 *   clearly more level, level with fewer ramps, or (all else equal)
 *   clearly better for the drain — sustained for the value dwell;
 * - each wheel's color: the fresh plan's verdict, adopted only when the
 *   dead-band-shifted readings agree on it and it holds for the state
 *   dwell — so the level status cannot flap at a boundary.
 */
export function createDisplayStabilizer(): (
  result: LevelingResult,
  settings: LevelSettings,
  nowMs: number,
) => DisplayResult {
  let initialized = false;
  const displayMm = {} as Record<WheelId, number>;
  const severity = {} as Record<WheelId, LiftSeverity>;
  const mmSince = {} as Record<WheelId, number | null>;
  const severitySince = {} as Record<WheelId, number | null>;
  let shownSteps = {} as Record<WheelId, number>;
  let planSince: number | null = null;

  return (result, settings, nowMs) => {
    const deadbandMm = settings.stabilityMm;
    const lifts = {} as Record<WheelId, number>;
    for (const id of WHEEL_IDS) lifts[id] = result.wheels[id].liftMm;

    // The best plan for the current reading, and for the reading shifted
    // by the dead band toward/away from level (the reference wheel stays
    // the reference) — the severity boundary guard.
    const fresh = planRamps(lifts, settings);
    const shiftedPlan = (deltaMm: number): { plan: RampPlan; lifts: Record<WheelId, number> } => {
      const shifted = {} as Record<WheelId, number>;
      for (const id of WHEEL_IDS)
        shifted[id] = lifts[id] > 0 ? Math.max(0, lifts[id] + deltaMm) : 0;
      return { plan: planRamps(shifted, settings), lifts: shifted };
    };
    const severityOf = (
      { plan, lifts: at }: { plan: RampPlan; lifts: Record<WheelId, number> },
      id: WheelId,
    ) => plannedSeverity(plan.steps[id], plan.deficits[id], at[id], settings);

    if (!initialized) {
      initialized = true;
      shownSteps = { ...fresh.steps };
      for (const id of WHEEL_IDS) {
        displayMm[id] = Math.round(lifts[id]);
        severity[id] = severityOf({ plan: fresh, lifts }, id);
        mmSince[id] = null;
        severitySince[id] = null;
      }
    } else {
      // Plan adoption: compare the fresh optimum against what the shown
      // plan would achieve under the *current* lifts.
      if (WHEEL_IDS.every((id) => fresh.steps[id] === shownSteps[id])) {
        planSince = null;
      } else {
        const current = evaluateSteps(shownSteps, lifts, settings);
        const clearlyLevel = (plan: RampPlan) =>
          plan.maxDeficitMm <= settings.toleranceMm - deadbandMm;
        const wantsPlan =
          fresh.maxDeficitMm + deadbandMm < current.maxDeficitMm ||
          (clearlyLevel(fresh) && fresh.rampsUsed < current.rampsUsed) ||
          (clearlyLevel(fresh) &&
            clearlyLevel(current) &&
            fresh.rampsUsed === current.rampsUsed &&
            fresh.drainScoreMm > current.drainScoreMm + deadbandMm);
        if (!wantsPlan) {
          planSince = null;
        } else {
          planSince ??= nowMs;
          if (nowMs - planSince >= VALUE_DWELL_MS) {
            shownSteps = { ...fresh.steps };
            planSince = null;
          }
        }
      }

      const lo = shiftedPlan(-deadbandMm);
      const hi = shiftedPlan(deadbandMm);
      for (const id of WHEEL_IDS) {
        // Whole-mm figure: clearly past the shown value, sustained.
        const wantsMm = Math.abs(lifts[id] - displayMm[id]) > 0.5 + deadbandMm;
        if (!wantsMm) {
          mmSince[id] = null;
        } else {
          mmSince[id] ??= nowMs;
          if (nowMs - mmSince[id]! >= VALUE_DWELL_MS) {
            displayMm[id] = Math.round(lifts[id]);
            mmSince[id] = null;
          }
        }

        // Color: what the fresh plan says about this wheel — but only
        // when a dead band's worth of tilt either way says the same.
        const candidate = severityOf({ plan: fresh, lifts }, id);
        const wantsSeverity =
          candidate !== severity[id] &&
          severityOf(lo, id) === candidate &&
          severityOf(hi, id) === candidate;
        if (!wantsSeverity) {
          severitySince[id] = null;
        } else {
          severitySince[id] ??= nowMs;
          if (nowMs - severitySince[id]! >= STATE_DWELL_MS) {
            severity[id] = candidate;
            severitySince[id] = null;
          }
        }
      }
    }

    const wheels = {} as Record<WheelId, DisplayWheel>;
    for (const id of WHEEL_IDS) {
      wheels[id] = { displayMm: displayMm[id], stepMm: shownSteps[id], severity: severity[id] };
    }
    // Level exactly when every wheel shows green — one source of truth.
    const isLevel = WHEEL_IDS.every((id) => severity[id] === 'none');
    // What the *shown* plan (not necessarily `fresh`, mid-adoption) leaves
    // un-level under the current lifts — the same plan the steps/severities
    // above come from.
    const maxDeficitMm = evaluateSteps(shownSteps, lifts, settings).maxDeficitMm;
    return { rollDeg: result.rollDeg, pitchDeg: result.pitchDeg, isLevel, wheels, maxDeficitMm };
  };
}
