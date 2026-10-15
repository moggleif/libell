/**
 * Display hysteresis.
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
 * (`stabilizeNumber`): once a change has just been adopted, a
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
import { rampHeightFor, WHEEL_IDS } from './leveling';
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
   * line's magnitude wording can never disagree with the diagram. */
  maxDeficitMm: number;
}

/** Bookkeeping for one adaptively-dwelled figure — see the module doc. */
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

/** Dead-band + adaptive-dwell adoption of one whole-mm figure; see the module
 * doc for the adaptive rule. */
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
 * Stabilize one wheel's displayed lift/step — the core used by the caravan,
 * whose single ramped wheel needs no plan (the step is simply the closest).
 *
 * Severity is derived from the mm figure and step this call returns, never
 * clocked on its own, so the color can never name a state those two numbers
 * don't (see `createDisplayStabilizer`).
 */
export function stabilizeLift(
  prev: DisplayWheel,
  pend: LiftPending,
  liftMm: number,
  settings: LevelSettings,
  nowMs: number,
): DisplayWheel {
  const deadbandMm = settings.stabilityMm;
  const freshStepMm = rampHeightFor(liftMm, settings);

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
  // A stepless wedge has no step to hold: it follows the shown figure, so a
  // wheel climbing it never shows a stale height (#600).
  if (settings.rampStepless) {
    stepMm = rampHeightFor(displayMm, settings);
  } else if (!wantsStep) {
    pend.stepSince = null;
  } else {
    pend.stepSince ??= nowMs;
    if (nowMs - pend.stepSince >= settings.dwellRestMs) {
      stepMm = freshStepMm;
      pend.stepSince = null;
    }
  }

  // The same call `liftSeverity` makes, but against the shown step, so it
  // describes exactly the mm figure and step above.
  const severity: LiftSeverity =
    displayMm <= settings.toleranceMm
      ? 'none'
      : Math.abs(displayMm - stepMm) <= settings.toleranceMm
        ? 'small'
        : 'large';

  return { displayMm, stepMm, severity };
}

/**
 * Stabilizer for the motorhome screen: feed it every LevelingResult with a
 * monotonic timestamp and render what it returns.
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
 * layer with its own clock. Given its own schedule, a wheel could show its mm
 * figure and plan caught up to a big tilt while its color still reflected
 * the old one (field bug: "0 mm" next to a red "no ramp reaches this
 * wheel"). Severity is recomputed every tick from this tick's shown plan and
 * displayed mm, so it can never name a state the numbers don't.
 */
export function createDisplayStabilizer(): (
  result: LevelingResult,
  settings: LevelSettings,
  nowMs: number,
) => DisplayResult {
  let shown: ShownDisplay | null = null;
  return (result, settings, nowMs) => {
    const lifts = liftsOf(result);
    if (shown === null) shown = initialDisplay(lifts, settings);
    else settleDisplay(shown, lifts, settings, nowMs);
    return displayResult(result, shown, settings);
  };
}

/** What the motorhome screen currently shows, plus the dwell bookkeeping. */
interface ShownDisplay {
  displayMm: Record<WheelId, number>;
  mmPending: Record<WheelId, AdaptiveDwellPending>;
  steps: Record<WheelId, number>;
  planSince: number | null;
}

function liftsOf(result: LevelingResult): Record<WheelId, number> {
  const lifts = {} as Record<WheelId, number>;
  for (const id of WHEEL_IDS) lifts[id] = result.wheels[id].liftMm;
  return lifts;
}

/** The first reading is shown as is: there is nothing to be stable against yet. */
function initialDisplay(lifts: Record<WheelId, number>, settings: LevelSettings): ShownDisplay {
  const displayMm = {} as Record<WheelId, number>;
  const mmPending = {} as Record<WheelId, AdaptiveDwellPending>;
  for (const id of WHEEL_IDS) {
    displayMm[id] = Math.round(lifts[id]);
    mmPending[id] = newAdaptiveDwellPending();
  }
  return { displayMm, mmPending, steps: { ...planRamps(lifts, settings).steps }, planSince: null };
}

function settleDisplay(
  shown: ShownDisplay,
  lifts: Record<WheelId, number>,
  settings: LevelSettings,
  nowMs: number,
): void {
  settlePlan(shown, lifts, settings, nowMs);
  for (const id of WHEEL_IDS) {
    shown.displayMm[id] = stabilizeNumber(
      shown.displayMm[id],
      shown.mmPending[id],
      lifts[id],
      settings.stabilityMm,
      settings.dwellRestMs,
      settings.dwellMotionMs,
      nowMs,
    );
  }
}

/**
 * Plan adoption: the best plan for the live reading is used only to decide
 * *whether* to replace the shown plan, never rendered directly. Fixed rest
 * dwell, not adaptive — see the module doc comment.
 */
function settlePlan(
  shown: ShownDisplay,
  lifts: Record<WheelId, number>,
  settings: LevelSettings,
  nowMs: number,
): void {
  const fresh = planRamps(lifts, settings);
  const current = evaluateSteps(fitWedge(shown.steps, lifts, settings), lifts, settings);
  if (!isClearlyBetterPlan(fresh, current, settings)) {
    shown.planSince = null;
    return;
  }
  shown.planSince ??= nowMs;
  if (nowMs - shown.planSince >= settings.dwellRestMs) {
    shown.steps = { ...fresh.steps };
    shown.planSince = null;
  }
}

/** Clearly more level, level with fewer ramps, or (all else equal) clearly better for the drain. */
function isClearlyBetterPlan(fresh: RampPlan, current: RampPlan, settings: LevelSettings): boolean {
  if (WHEEL_IDS.every((id) => fresh.steps[id] === current.steps[id])) return false;
  const deadbandMm = settings.stabilityMm;
  const clearlyLevel = (plan: RampPlan) => plan.maxDeficitMm <= settings.toleranceMm - deadbandMm;
  if (fresh.maxDeficitMm + deadbandMm < current.maxDeficitMm) return true;
  if (!clearlyLevel(fresh)) return false;
  if (fresh.rampsUsed < current.rampsUsed) return true;
  return (
    clearlyLevel(current) &&
    fresh.rampsUsed === current.rampsUsed &&
    fresh.drainScoreMm > current.drainScoreMm + deadbandMm
  );
}

/** Severity from the two layers just settled — see `createDisplayStabilizer`. */
function displayResult(
  result: LevelingResult,
  shown: ShownDisplay,
  settings: LevelSettings,
): DisplayResult {
  const steps = fitWedge(shown.steps, shown.displayMm, settings);
  const plan = evaluateSteps(steps, shown.displayMm, settings);
  const wheels = {} as Record<WheelId, DisplayWheel>;
  for (const id of WHEEL_IDS) {
    const displayMm = shown.displayMm[id];
    const stepMm = steps[id];
    const severity = plannedSeverity(stepMm, plan.deficits[id], displayMm, settings);
    wheels[id] = { displayMm, stepMm, severity };
  }
  return {
    rollDeg: result.rollDeg,
    pitchDeg: result.pitchDeg,
    // Level exactly when every wheel shows green — one source of truth.
    isLevel: WHEEL_IDS.every((id) => wheels[id].severity === 'none'),
    wheels,
    maxDeficitMm: plan.maxDeficitMm,
  };
}

/**
 * On a stepless wedge (#600) the plan keeps only which wheels get a ramp:
 * each one's height follows its lift as it climbs, so a held plan never
 * asks for the height a wheel needed before it started up.
 */
function fitWedge(
  steps: Record<WheelId, number>,
  lifts: Record<WheelId, number>,
  settings: LevelSettings,
): Record<WheelId, number> {
  if (!settings.rampStepless) return steps;
  const fitted = {} as Record<WheelId, number>;
  for (const id of WHEEL_IDS) fitted[id] = steps[id] > 0 ? rampHeightFor(lifts[id], settings) : 0;
  return fitted;
}
