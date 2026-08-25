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
import { recommendStep, WHEEL_IDS } from './leveling';
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
}

export function newLiftPending(): LiftPending {
  return { displaySince: null, stepSince: null };
}

/**
 * Stabilize one wheel's displayed lift/step against the previous shown
 * state — the dead-band + dwell core used by the caravan, whose single
 * ramped wheel needs no plan (the step is simply the closest one).
 *
 * Severity is deliberately NOT a third independently-clocked layer here
 * either (see the `createDisplayStabilizer` doc comment for the field
 * report this fixed on the motorhome screen): it is derived below from
 * the mm figure and step *this call is about to return*, so the color
 * can never name a state those two numbers don't.
 */
export function stabilizeLift(
  prev: DisplayWheel,
  pend: LiftPending,
  liftMm: number,
  settings: LevelSettings,
  nowMs: number,
): DisplayWheel {
  const deadbandMm = settings.stabilityMm;
  const freshDisplayMm = Math.round(liftMm);
  const freshStepMm = recommendStep(liftMm, settings.rampStepHeightsMm);

  // Whole-mm figure: the reading must sit half a mm plus the dead
  // band away from the shown value, and stay there for the dwell.
  const wantsDisplay = Math.abs(liftMm - prev.displayMm) > 0.5 + deadbandMm;
  let displayMm = prev.displayMm;
  if (!wantsDisplay) {
    pend.displaySince = null;
  } else {
    pend.displaySince ??= nowMs;
    if (nowMs - pend.displaySince >= VALUE_DWELL_MS) {
      displayMm = freshDisplayMm;
      pend.displaySince = null;
    }
  }

  // Ramp step: the candidate must be clearly closer than the shown
  // step (0 = "no step" competes too), sustained for the dwell.
  const wantsStep = Math.abs(liftMm - freshStepMm) + deadbandMm < Math.abs(liftMm - prev.stepMm);
  let stepMm = prev.stepMm;
  if (!wantsStep) {
    pend.stepSince = null;
  } else {
    pend.stepSince ??= nowMs;
    if (nowMs - pend.stepSince >= VALUE_DWELL_MS) {
      stepMm = freshStepMm;
      pend.stepSince = null;
    }
  }

  // Severity: the same green/orange/red call `liftSeverity` makes, but
  // against the shown step instead of recomputing its own — so it always
  // describes exactly the mm figure and step above, never a fresher or
  // staler reading of either.
  const severity: LiftSeverity =
    displayMm <= settings.toleranceMm
      ? 'none'
      : Math.abs(displayMm - stepMm) <= settings.toleranceMm
        ? 'small'
        : 'large';

  return { displayMm, stepMm, severity };
}

/**
 * Creates a stateful stabilizer for the motorhome screen: feed it every
 * LevelingResult with a monotonic timestamp (`performance.now()` in the
 * app, hand-stepped in tests) and render what it returns. State is
 * per-instance, so tests and the app each own their history.
 *
 * Two stabilized layers, each with its own dead band + dwell against the
 * raw reading:
 * - each wheel's mm figure;
 * - the ramp plan (which wheels get steps): a fresh optimum replaces the
 *   shown plan only when it is *clearly* better under the current lifts —
 *   clearly more level, level with fewer ramps, or (all else equal)
 *   clearly better for the drain — sustained for the value dwell.
 *
 * A wheel's severity (color/glyph) is deliberately NOT a third stabilized
 * layer with its own clock: earlier this module derived it straight from
 * the live lift and a *not-yet-adopted* candidate plan, on a longer dwell
 * than the mm figure and the shown plan used. That let the three ship on
 * different schedules, so a screen could — correctly per each layer's own
 * rule — show a wheel's mm figure and plan already caught up to a big
 * tilt while its color/text still reflected the old one (e.g. "0 mm" next
 * to a red "no ramp reaches this wheel"), self-contradictory even though
 * no single layer was wrong in isolation (field report, screenshot v1.0.0
 * CR180). Severity is instead recomputed every tick as a pure function of
 * *this tick's* shown plan and displayed mm — the same two numbers the
 * diagram renders — so it can never name a state the numbers don't.
 */
export function createDisplayStabilizer(): (
  result: LevelingResult,
  settings: LevelSettings,
  nowMs: number,
) => DisplayResult {
  let initialized = false;
  const displayMm = {} as Record<WheelId, number>;
  const mmSince = {} as Record<WheelId, number | null>;
  let shownSteps = {} as Record<WheelId, number>;
  let planSince: number | null = null;

  return (result, settings, nowMs) => {
    const deadbandMm = settings.stabilityMm;
    const lifts = {} as Record<WheelId, number>;
    for (const id of WHEEL_IDS) lifts[id] = result.wheels[id].liftMm;

    // The best plan for the current (live) reading — used only to decide
    // *whether* to adopt a new shown plan, never to render directly.
    const fresh = planRamps(lifts, settings);

    if (!initialized) {
      initialized = true;
      shownSteps = { ...fresh.steps };
      for (const id of WHEEL_IDS) {
        displayMm[id] = Math.round(lifts[id]);
        mmSince[id] = null;
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
      }
    }

    // Severity, one wheel-card's worth of mm + step + color, computed
    // together from the two layers just settled above — see the doc
    // comment: this is what keeps them from ever contradicting.
    const shown = evaluateSteps(shownSteps, displayMm, settings);
    const wheels = {} as Record<WheelId, DisplayWheel>;
    for (const id of WHEEL_IDS) {
      wheels[id] = {
        displayMm: displayMm[id],
        stepMm: shownSteps[id],
        severity: plannedSeverity(shownSteps[id], shown.deficits[id], displayMm[id], settings),
      };
    }
    // Level exactly when every wheel shows green — one source of truth.
    const isLevel = WHEEL_IDS.every((id) => wheels[id].severity === 'none');
    return {
      rollDeg: result.rollDeg,
      pitchDeg: result.pitchDeg,
      isLevel,
      wheels,
      // Same shown plan + displayed mm the wheel cards above come from, so
      // the status line's magnitude wording (#125) can never disagree.
      maxDeficitMm: shown.maxDeficitMm,
    };
  };
}
