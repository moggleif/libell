/**
 * Ramp placement planning — pure TypeScript, no browser APIs (ADR 0011).
 *
 * Ramps are sold in pairs and most owners carry exactly two, yet a
 * combined roll + pitch tilt leaves three wheels below the highest
 * corner. This module turns the per-wheel required lifts (R3) into a
 * plan for the ramps the user actually owns: which wheels to drive up,
 * onto which step, so the vehicle ends as close to level as the set
 * allows. Preference order: reach the tolerance at all, then use as few
 * ramps as possible, then leave the waste-water drain side lowest (so
 * the grey tank empties), then be as level as possible, then climb as
 * little as possible.
 */
import { WHEEL_IDS, type LiftSeverity, type WheelId } from './leveling';
import type { DrainPosition, LevelSettings } from './settings';

export interface RampPlan {
  /** Ramp step per wheel (mm, 0 = no ramp). A boggie pair shares one
   * planning wheel and one step — but consumes two physical ramps. */
  steps: Record<WheelId, number>;
  /** How far below the new highest wheel each wheel ends up once every
   * planned step has been driven up, in mm (≥ 0). */
  deficits: Record<WheelId, number>;
  /** Largest remaining deficit — how un-level the plan leaves the vehicle. */
  maxDeficitMm: number;
  /** Physical ramps the plan consumes (a boggie pair counts as two). */
  rampsUsed: number;
  /** True when every wheel ends within the tolerance. */
  achievesLevel: boolean;
  /** Mean deficit on the drain side — higher = drains better; 0 when no
   * drain position is configured. */
  drainScoreMm: number;
}

const DRAIN_WHEELS: Record<Exclude<DrainPosition, 'none'>, [WheelId, WheelId]> = {
  left: ['frontLeft', 'rearLeft'],
  right: ['frontRight', 'rearRight'],
  front: ['frontLeft', 'frontRight'],
  rear: ['rearLeft', 'rearRight'],
};

/** Physical ramps needed to drive this wheel up: a boggie pair is two. */
export function rampCost(id: WheelId, settings: LevelSettings): number {
  return settings.rearAxle === 'boggie' && id.startsWith('rear') ? 2 : 1;
}

/**
 * Score one concrete step assignment against the given lifts. Wheel
 * heights are relative to today's highest wheel: `step − lift`; the new
 * highest wheel is the new reference, so overshooting a step raises the
 * bar for every other wheel — the deficits account for that.
 */
export function evaluateSteps(
  steps: Record<WheelId, number>,
  lifts: Record<WheelId, number>,
  settings: LevelSettings,
): RampPlan {
  let high = -Infinity;
  for (const id of WHEEL_IDS) high = Math.max(high, steps[id] - lifts[id]);
  const deficits = {} as Record<WheelId, number>;
  let maxDeficitMm = 0;
  let rampsUsed = 0;
  for (const id of WHEEL_IDS) {
    deficits[id] = high - (steps[id] - lifts[id]);
    maxDeficitMm = Math.max(maxDeficitMm, deficits[id]);
    if (steps[id] > 0) rampsUsed += rampCost(id, settings);
  }
  let drainScoreMm = 0;
  if (settings.drainPosition !== 'none') {
    const [a, b] = DRAIN_WHEELS[settings.drainPosition];
    drainScoreMm = (deficits[a] + deficits[b]) / 2;
  }
  return {
    steps,
    deficits,
    maxDeficitMm,
    rampsUsed,
    achievesLevel: maxDeficitMm <= settings.toleranceMm,
    drainScoreMm,
  };
}

function totalStepMm(plan: RampPlan): number {
  let total = 0;
  for (const id of WHEEL_IDS) total += plan.steps[id];
  return total;
}

/** True when `a` beats `b` in the plan preference order (header comment). */
function preferred(a: RampPlan, b: RampPlan): boolean {
  if (a.achievesLevel !== b.achievesLevel) return a.achievesLevel;
  if (!a.achievesLevel && a.maxDeficitMm !== b.maxDeficitMm) return a.maxDeficitMm < b.maxDeficitMm;
  if (a.rampsUsed !== b.rampsUsed) return a.rampsUsed < b.rampsUsed;
  if (a.drainScoreMm !== b.drainScoreMm) return a.drainScoreMm > b.drainScoreMm;
  if (a.maxDeficitMm !== b.maxDeficitMm) return a.maxDeficitMm < b.maxDeficitMm;
  return totalStepMm(a) < totalStepMm(b);
}

/**
 * The best assignment of the owned ramps to wheels for the given
 * required lifts (mm, relative to the highest wheel). Exhaustive search
 * over every step choice per wheel — the reference wheel keeps the plan
 * near today's plane, so steps that would hoist a wheel clearly above it
 * can never win and are pruned, keeping the search tiny.
 */
export function planRamps(lifts: Record<WheelId, number>, settings: LevelSettings): RampPlan {
  const overshootLimitMm = settings.toleranceMm + settings.stabilityMm;
  const candidates = WHEEL_IDS.map((id) => [
    0,
    ...settings.rampStepHeightsMm.filter((s) => s <= lifts[id] + overshootLimitMm),
  ]);

  let best: RampPlan | null = null;
  const steps = {} as Record<WheelId, number>;
  const tryWheel = (index: number, usedRamps: number): void => {
    if (index === WHEEL_IDS.length) {
      const plan = evaluateSteps({ ...steps }, lifts, settings);
      if (best === null || preferred(plan, best)) best = plan;
      return;
    }
    const id = WHEEL_IDS[index]!;
    for (const step of candidates[index]!) {
      const cost = step > 0 ? rampCost(id, settings) : 0;
      if (usedRamps + cost > settings.rampCount) continue;
      steps[id] = step;
      tryWheel(index + 1, usedRamps + cost);
    }
  };
  tryWheel(0, 0);
  // The all-zero assignment is always a candidate, so best is never null.
  return best!;
}

/**
 * Wheel color under a plan — "what should I do with this wheel?":
 * green (none) when it ends within the tolerance with no ramp, orange
 * (small) when driving up its planned step brings it within, red (large)
 * when even the best plan leaves it outside — the owned ramps cannot fix
 * it; move the vehicle instead.
 */
export function plannedSeverity(
  stepMm: number,
  deficitMm: number,
  settings: LevelSettings,
): LiftSeverity {
  if (deficitMm > settings.toleranceMm) return 'large';
  return stepMm > 0 ? 'small' : 'none';
}
