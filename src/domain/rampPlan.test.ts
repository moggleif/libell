import { describe, expect, it } from 'vitest';
import { WHEEL_IDS, type WheelId } from './leveling';
import { deficitMagnitude, evaluateSteps, plannedSeverity, planRamps, rampCost } from './rampPlan';
import { DEFAULT_SETTINGS } from './settings';

// Symmetric reference geometry and easy step arithmetic, independent of
// the app's defaults. Two ramps — the case the planner exists for (#93).
const SETTINGS = {
  ...DEFAULT_SETTINGS,
  wheelbaseMm: 4000,
  trackWidthFrontMm: 1800,
  trackWidthRearMm: 1800,
  rampStepHeightsMm: [40, 80, 120],
  toleranceMm: 20,
  rampCount: 2,
};

function lifts(fl: number, fr: number, rl: number, rr: number): Record<WheelId, number> {
  return { frontLeft: fl, frontRight: fr, rearLeft: rl, rearRight: rr };
}

const stepsOf = (plan: ReturnType<typeof planRamps>) => WHEEL_IDS.map((id) => plan.steps[id]);

describe('planRamps', () => {
  it('recommends nothing when the vehicle is already within tolerance', () => {
    const plan = planRamps(lifts(0, 18, 0, 18), SETTINGS);
    expect(stepsOf(plan)).toEqual([0, 0, 0, 0]);
    expect(plan.achievesLevel).toBe(true);
    expect(plan.rampsUsed).toBe(0);
  });

  it('pure roll: the low side gets the closest workable step on both wheels', () => {
    const plan = planRamps(lifts(0, 44, 0, 44), SETTINGS);
    expect(plan.steps.frontRight).toBe(40);
    expect(plan.steps.rearRight).toBe(40);
    expect(plan.steps.frontLeft).toBe(0);
    expect(plan.achievesLevel).toBe(true);
  });

  it('uses one ramp when one is enough', () => {
    const plan = planRamps(lifts(0, 0, 0, 44), SETTINGS);
    expect(stepsOf(plan)).toEqual([0, 0, 0, 40]);
    expect(plan.rampsUsed).toBe(1);
  });

  it('never plans more wheels than there are ramps', () => {
    // Combined tilt: three wheels below the highest corner, two ramps.
    const plan = planRamps(lifts(0, 20, 40, 60), SETTINGS);
    expect(plan.rampsUsed).toBeLessThanOrEqual(2);
    // Best two-ramp answer: 40 under each rear wheel leaves the right
    // side 20 low — exactly within tolerance — while any placement
    // ramping the far-low rear right higher overshoots the plane.
    expect(stepsOf(plan)).toEqual([0, 0, 40, 40]);
    expect(plan.achievesLevel).toBe(true);
    expect(plan.deficits.frontRight).toBeCloseTo(20);
  });

  it('marks the wheel it cannot serve when the tolerance is unreachable', () => {
    // Steeper combined tilt: no two-ramp placement reaches the tolerance;
    // the best one still minimizes how un-level the vehicle stays.
    const plan = planRamps(lifts(0, 30, 50, 80), SETTINGS);
    expect(plan.achievesLevel).toBe(false);
    expect(plan.steps.rearRight).toBe(80);
    expect(plan.steps.rearLeft).toBe(40);
    expect(plan.maxDeficitMm).toBeCloseTo(30);
    // The unserved wheel stays below tolerance — toned down, no action.
    expect(plan.steps.frontRight).toBe(0);
    expect(plannedSeverity(0, plan.deficits.frontRight, 30, SETTINGS)).toBe('unserved');
  });

  it('with more ramps the same tilt levels fully', () => {
    const plan = planRamps(lifts(0, 30, 50, 80), { ...SETTINGS, rampCount: 3 });
    expect(plan.achievesLevel).toBe(true);
    expect(plan.rampsUsed).toBe(3);
  });

  it('a boggie pair consumes two ramps', () => {
    const boggie = { ...SETTINGS, rearAxle: 'boggie' as const };
    expect(rampCost('rearLeft', boggie)).toBe(2);
    expect(rampCost('frontLeft', boggie)).toBe(1);
    // Rear end low: fixing it needs both rear pairs = four ramps. With
    // two ramps no placement helps, so the plan honestly recommends none.
    const stuck = planRamps(lifts(0, 0, 60, 60), boggie);
    expect(stepsOf(stuck)).toEqual([0, 0, 0, 0]);
    expect(stuck.achievesLevel).toBe(false);
    // With four ramps both pairs drive up.
    const plan = planRamps(lifts(0, 0, 60, 60), { ...boggie, rampCount: 4 });
    expect(stepsOf(plan)).toEqual([0, 0, 40, 40]);
    expect(plan.achievesLevel).toBe(true);
    expect(plan.rampsUsed).toBe(4);
  });

  it('prefers the placement that leaves the drain side lowest — within tolerance', () => {
    // Front 44 mm low; steps 40 and 60 both level within the 20 mm
    // tolerance (4 mm low vs 16 mm high). The rear drain prefers the
    // overshoot that tips the vehicle backward; no drain preference
    // picks the most level; a front drain keeps the nose down.
    const steps = { ...SETTINGS, rampStepHeightsMm: [40, 60] };
    const rear = planRamps(lifts(44, 44, 0, 0), { ...steps, drainPosition: 'rear' as const });
    expect(rear.steps.frontLeft).toBe(60);
    expect(rear.steps.frontRight).toBe(60);
    expect(rear.achievesLevel).toBe(true);
    const neutral = planRamps(lifts(44, 44, 0, 0), steps);
    expect(neutral.steps.frontLeft).toBe(40);
    const front = planRamps(lifts(44, 44, 0, 0), { ...steps, drainPosition: 'front' as const });
    expect(front.steps.frontLeft).toBe(40);
  });

  it('the drain preference never sacrifices levelness or spends extra ramps', () => {
    // The only steps are 40 and 120: overshooting to 120 would leave the
    // rear 76 mm below — far outside tolerance — so the drain loses.
    const steps = { ...SETTINGS, rampStepHeightsMm: [40, 120] };
    const plan = planRamps(lifts(44, 44, 0, 0), { ...steps, drainPosition: 'rear' as const });
    expect(plan.steps.frontLeft).toBe(40);
    expect(plan.achievesLevel).toBe(true);
    // Already level: no ramps just for drainage.
    const level = planRamps(lifts(0, 0, 0, 0), { ...steps, drainPosition: 'rear' as const });
    expect(stepsOf(level)).toEqual([0, 0, 0, 0]);
  });

  // Design review: a corner position (e.g. rearLeft) scores only its own
  // wheel, unlike the side/axle "middle" positions above (e.g. rear),
  // which average both wheels on that edge — a real difference whenever
  // the two wheels of an edge end up at different deficits.
  it('a corner drain position scores only its own wheel, not an average with its neighbor', () => {
    const steps = { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 20 };
    const zeroLifts = lifts(0, 0, 0, 0);
    const rearRightDeficit = evaluateSteps(steps, zeroLifts, {
      ...SETTINGS,
      drainPosition: 'rearRight',
    }).drainScoreMm;
    const rearLeftDeficit = evaluateSteps(steps, zeroLifts, {
      ...SETTINGS,
      drainPosition: 'rearLeft',
    }).drainScoreMm;
    const rearAxleMean = evaluateSteps(steps, zeroLifts, {
      ...SETTINGS,
      drainPosition: 'rear',
    }).drainScoreMm;
    expect(rearRightDeficit).toBeCloseTo(0); // stepped up — no deficit
    expect(rearLeftDeficit).toBeCloseTo(20); // never stepped — full deficit
    expect(rearAxleMean).toBeCloseTo(10); // the two rear wheels' average
  });
});

describe('evaluateSteps', () => {
  it('re-references deficits to the new highest wheel after driving up', () => {
    // Overshooting the only low wheel by 16 mm makes it the new highest:
    // the other three now sit 16 mm below it.
    const plan = evaluateSteps(
      { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 60 },
      lifts(0, 0, 0, 44),
      SETTINGS,
    );
    expect(plan.deficits.rearRight).toBeCloseTo(0);
    expect(plan.deficits.frontLeft).toBeCloseTo(16);
    expect(plan.maxDeficitMm).toBeCloseTo(16);
  });
});

describe('deficitMagnitude', () => {
  // SETTINGS.toleranceMm is 20 mm throughout this file.
  it('is "close" just barely short of the tolerance (#125)', () => {
    expect(deficitMagnitude(21, SETTINGS.toleranceMm)).toBe('close');
    expect(deficitMagnitude(30, SETTINGS.toleranceMm)).toBe('close');
    // Right at the "close" boundary — twice the tolerance — still close.
    expect(deficitMagnitude(40, SETTINGS.toleranceMm)).toBe('close');
  });

  it('is "far" well beyond the tolerance (#125)', () => {
    expect(deficitMagnitude(41, SETTINGS.toleranceMm)).toBe('far');
    expect(deficitMagnitude(100, SETTINGS.toleranceMm)).toBe('far');
  });

  it('categorizes an unreachable plan end to end', () => {
    // Same steep tilt as the "unreachable" test above: 30 mm short with a
    // 20 mm tolerance — just short of the "close" cutoff (40 mm).
    const plan = planRamps(lifts(0, 30, 50, 80), SETTINGS);
    expect(plan.achievesLevel).toBe(false);
    expect(deficitMagnitude(plan.maxDeficitMm, SETTINGS.toleranceMm)).toBe('close');

    // A wildly steeper tilt that no two-ramp placement gets anywhere near.
    const farPlan = planRamps(lifts(0, 60, 150, 260), SETTINGS);
    expect(farPlan.achievesLevel).toBe(false);
    expect(deficitMagnitude(farPlan.maxDeficitMm, SETTINGS.toleranceMm)).toBe('far');
  });
});

describe('plannedSeverity', () => {
  it('green within tolerance, orange for a step, red only beyond every step, gray when unserved', () => {
    expect(plannedSeverity(0, 5, 5, SETTINGS)).toBe('none');
    expect(plannedSeverity(40, 4, 44, SETTINGS)).toBe('small');
    // Not even the highest step (120) fixes a 200 mm lift — move instead.
    expect(plannedSeverity(120, 80, 200, SETTINGS)).toBe('large');
    expect(plannedSeverity(0, 30, 30, SETTINGS)).toBe('unserved');
  });

  it('a wheel a step could fix is never red, even when the plan leaves it short', () => {
    // Field feedback: a 63 mm wheel got the 40 step (the global optimum —
    // more would hoist the reference and hurt an unserved wheel), leaving
    // it 23 mm short. The 80 step could fix it alone, so red would read
    // as a bug; it stays orange ("drive up on the shown step").
    expect(plannedSeverity(40, 23, 63, SETTINGS)).toBe('small');
  });
});
