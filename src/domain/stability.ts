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
 * - a dwell time (`dwellRestMs`): even a clear change is adopted only
 *   after it has held continuously for a moment, so a single noise spike
 *   can never flip anything. Jitter that oscillates across a boundary
 *   keeps resetting the dwell clock and the display stays frozen.
 *
 * A wheel's live mm figure additionally gets an *adaptive* dwell
 * (`stabilizeNumber`, #183): once a change has just been adopted, a
 * further change in the *same direction* — the shape of a continuous,
 * deliberate motion like driving up a ramp — only needs the much shorter
 * `dwellMotionMs`, instead of the full `dwellRestMs` on every intermediate
 * step. A first change, or one reversing direction, always pays the full
 * rest dwell, so this never weakens the noise guard above — jitter
 * doesn't hold a consistent direction for two changes in a row. The ramp
 * plan/step (a discrete recommendation, not a live readout) intentionally
 * keeps the fixed `dwellRestMs` throughout: it would be confusing for the
 * recommended step to change while mid-climb.
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

/** Dead-band + dwell bookkeeping for one adaptively-dwelled numeric figure
 * (a wheel's mm lift, or the caravan jockey's signed mm) — see the module
 * doc comment. */
export interface AdaptiveDwellPending {
  /** When the current pending change first crossed the dead band. */
  since: number | null;
  /** Direction (+1/-1) of the most recently *adopted* change; 0 before any. */
  lastDirection: -1 | 0 | 1;
  /** When that change was adopted — how "fresh" the motion streak is. */
  lastAdoptedAtMs: number | null;
}

export function newAdaptiveDwellPending(): AdaptiveDwellPending {
  return { since: null, lastDirection: 0, lastAdoptedAtMs: null };
}

/**
 * Dead-band + adaptive-dwell adoption of one whole-mm figure — the shared
 * core behind a wheel's `displayMm` on both screens, and the caravan
 * jockey's signed mm. See the module doc comment for the adaptive rule.
 */
export function stabilizeNumber(
  prevShown: number,
  pending: AdaptiveDwellPending,
  rawValue: number,
  deadbandMm: number,
  dwellRestMs: number,
  dwellMotionMs: number,
  nowMs: number,
): number {
  const wants = Math.abs(rawValue - prevShown) > 0.5 + deadbandMm;
  if (!wants) {
    pending.since = null;
    return prevShown;
  }
  pending.since ??= nowMs;
  const direction: -1 | 1 = rawValue > prevShown ? 1 : -1;
  const stillMoving =
    pending.lastDirection === direction &&
    pending.lastAdoptedAtMs !== null &&
    nowMs - pending.lastAdoptedAtMs <= dwellRestMs;
  const dwellMs = stillMoving ? Math.min(dwellMotionMs, dwellRestMs) : dwellRestMs;
  if (nowMs - pending.since < dwellMs) return prevShown;
  pending.since = null;
  pending.lastDirection = direction;
  pending.lastAdoptedAtMs = nowMs;
  return Math.round(rawValue);
}

export interface LiftPending {
  display: AdaptiveDwellPending;
  stepSince: number | null;
}

export function newLiftPending(): LiftPending {
  return { display: newAdaptiveDwellPending(), stepSince: null };
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
  const freshStepMm = recommendStep(liftMm, settings.rampStepHeightsMm);

  const displayMm = stabilizeNumber(
    prev.displayMm,
    pend.display,
    liftMm,
    deadbandMm,
    settings.dwellRestMs,
    settings.dwellMotionMs,
    nowMs,
  );

  // Ramp step: the candidate must be clearly closer than the shown step
  // (0 = "no step" competes too), sustained for the (fixed) rest dwell.
  const wantsStep = Math.abs(liftMm - freshStepMm) + deadbandMm < Math.abs(liftMm - prev.stepMm);
  let stepMm = prev.stepMm;
  if (!wantsStep) {
    pend.stepSince = null;
  } else {
    pend.stepSince ??= nowMs;
    if (nowMs - pend.stepSince >= settings.dwellRestMs) {
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
  const mmPending = {} as Record<WheelId, AdaptiveDwellPending>;
  for (const id of WHEEL_IDS) mmPending[id] = newAdaptiveDwellPending();
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
      for (const id of WHEEL_IDS) displayMm[id] = Math.round(lifts[id]);
    } else {
      // Plan adoption: compare the fresh optimum against what the shown
      // plan would achieve under the *current* lifts. Fixed rest dwell,
      // not adaptive — see the module doc comment.
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
          if (nowMs - planSince >= settings.dwellRestMs) {
            shownSteps = { ...fresh.steps };
            planSince = null;
          }
        }
      }

      for (const id of WHEEL_IDS) {
        displayMm[id] = stabilizeNumber(
          displayMm[id],
          mmPending[id],
          lifts[id],
          deadbandMm,
          settings.dwellRestMs,
          settings.dwellMotionMs,
          nowMs,
        );
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
