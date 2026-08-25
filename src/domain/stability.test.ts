import { describe, expect, it } from 'vitest';
import { computeLeveling, WHEEL_IDS, type GravityVector } from './leveling';
import { evaluateSteps, plannedSeverity } from './rampPlan';
import { DEFAULT_SETTINGS } from './settings';
import { createDisplayStabilizer } from './stability';

const G = 9.81;

function gravityFor(rollDeg: number, pitchDeg: number): GravityVector {
  const roll = (rollDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  return { x: G * Math.tan(roll), y: G * Math.tan(pitch), z: G };
}

/** Roll angle (deg) that produces the given front-right lift in mm. */
function rollForLift(liftMm: number, trackMm: number): number {
  return (-Math.atan(liftMm / trackMm) * 180) / Math.PI;
}

// Symmetric reference geometry, independent of the app's defaults.
const settings = {
  ...DEFAULT_SETTINGS,
  wheelbaseMm: 4000,
  trackWidthFrontMm: 1800,
  trackWidthRearMm: 1800,
  rampStepHeightsMm: [20, 40, 60],
};

// A first change in a direction, or one reversing the last adopted
// direction, always pays the full rest dwell (#183) — this is "plenty of
// time" for any single, isolated transition in these tests.
const SETTLE_MS = settings.dwellRestMs + 100;

/**
 * Frame-by-frame harness: each reading advances a fake clock, long enough
 * by default for every dwell to elapse, so a *sustained* reading always
 * shows. Pass a small dt to model rapid jitter instead.
 */
function createHarness() {
  const stabilize = createDisplayStabilizer();
  let now = 0;
  return (liftMm: number, dtMs = SETTLE_MS) => {
    now += dtMs;
    const result = computeLeveling(gravityFor(rollForLift(liftMm, 1800), 0), settings);
    return stabilize(result, settings, now);
  };
}

/** Feed the same reading until every dwell has elapsed; return the last. */
function settle(at: ReturnType<typeof createHarness>, liftMm: number) {
  at(liftMm);
  return at(liftMm);
}

describe('createDisplayStabilizer', () => {
  it('keeps the whole-mm figure steady across rounding-edge jitter', () => {
    const at = createHarness();
    expect(at(44).wheels.frontRight.displayMm).toBe(44);
    // Jitter within the dead band keeps the shown value…
    expect(at(45.5).wheels.frontRight.displayMm).toBe(44);
    expect(at(44.5).wheels.frontRight.displayMm).toBe(44);
    // …until the reading clearly and durably moves on.
    expect(settle(at, 54).wheels.frontRight.displayMm).toBe(54);
  });

  it('does not flap between two ramp steps at their midpoint', () => {
    const at = createHarness();
    expect(at(44).wheels.frontRight.stepMm).toBe(40);
    // 50.5 mm is a hair past the 40/60 midpoint — not clearly better, keep 40.
    expect(at(50.5).wheels.frontRight.stepMm).toBe(40);
    expect(at(49.5).wheels.frontRight.stepMm).toBe(40);
    // A clear, sustained move switches.
    expect(settle(at, 58).wheels.frontRight.stepMm).toBe(60);
  });

  it('changes severity color only past the boundary dead band', () => {
    // Green/orange boundary sits at the tolerance (20 mm), dead band 3 mm.
    const at = createHarness();
    expect(at(18).wheels.frontRight.severity).toBe('none');
    expect(at(20.5).wheels.frontRight.severity).toBe('none');
    expect(at(19.5).wheels.frontRight.severity).toBe('none');
    expect(settle(at, 25).wheels.frontRight.severity).toBe('small');
    // And it does not fall straight back at boundary jitter.
    expect(at(20.5).wheels.frontRight.severity).toBe('small');
  });

  it('ignores a single spike past the boundary (dwell time)', () => {
    const at = createHarness();
    expect(at(15).isLevel).toBe(true);
    // One 60 fps frame at 26 mm — clearly past the band, but not sustained.
    expect(at(26, 16).isLevel).toBe(true);
    expect(at(26, 16).wheels.frontRight.severity).toBe('none');
    // Back inside: the pending change is discarded.
    expect(at(15, 16).isLevel).toBe(true);
    // Sustained past the band for the dwell: now it flips.
    at(26, 16);
    expect(at(26, SETTLE_MS).isLevel).toBe(false);
  });

  it('shows every wheel green while the vehicle is level', () => {
    const stabilize = createDisplayStabilizer();
    const result = computeLeveling(gravityFor(rollForLift(15, 1800), 0), settings);
    expect(result.isLevel).toBe(true);
    const display = stabilize(result, settings, 0);
    expect(display.isLevel).toBe(true);
    expect(display.wheels.frontRight.severity).toBe('none');
    expect(display.wheels.frontLeft.severity).toBe('none');
  });

  it('never reports level while a wheel is not green (field regression)', () => {
    // v0.1.57 in the field: "almost level — 3 mm left" with four green
    // wheels. Level is now derived from the displayed severities, so the
    // status and the wheel colors can never disagree — check the
    // invariant across a whole sweep with mixed jitter.
    const at = createHarness();
    const sweep = [30, 25, 22, 19, 21, 17, 23, 24, 16, 15, 21, 26, 22, 18, 14];
    for (const liftMm of sweep) {
      for (const dtMs of [16, 16, SETTLE_MS]) {
        const display = at(liftMm, dtMs);
        const allGreen = WHEEL_IDS.every((id) => display.wheels[id].severity === 'none');
        expect(display.isLevel).toBe(allGreen);
      }
    }
  });

  it('never flaps at boundary jitter (field regression: strobe + vibration)', () => {
    // Readings hovering right at the tolerance (20 mm) with ±2 mm jitter
    // at sensor rate must not toggle the level state even once.
    const at = createHarness();
    expect(settle(at, 30).isLevel).toBe(false); // start clearly un-level
    const jitter = [19, 21, 18.5, 21.5, 19.5, 22, 18, 20.5, 19, 21.5, 18.5, 22.5];
    const states = jitter.map((liftMm) => at(liftMm, 120).isLevel);
    expect(new Set(states).size).toBe(1); // no flip inside the band
    expect(settle(at, 14).isLevel).toBe(true); // clearly, durably below -> level
    const stillLevel = [21, 19, 22.5, 18, 21.5].map((liftMm) => at(liftMm, 120).isLevel);
    expect(stillLevel.every(Boolean)).toBe(true);
  });

  it('holds "level" through jitter just past the tolerance', () => {
    // Tolerance 20 mm, dead band 3 mm → leaves level only above 23 mm.
    const at = createHarness();
    expect(at(15).isLevel).toBe(true);
    expect(at(22).isLevel).toBe(true); // within the dead band — still level
    expect(settle(at, 26).isLevel).toBe(false); // clearly out, sustained
    expect(at(22).isLevel).toBe(false); // must come back clearly inside
    expect(settle(at, 15).isLevel).toBe(true);
  });

  it('updates within a bounded lag while the user is actively leveling', () => {
    // Driving up a ramp changes the lift continuously; the display must
    // follow after the dwell, not freeze.
    const at = createHarness();
    expect(at(60).wheels.frontRight.displayMm).toBe(60);
    at(40, settings.dwellRestMs / 2);
    const settled = at(40, settings.dwellRestMs);
    expect(settled.wheels.frontRight.displayMm).toBe(40);
  });

  /**
   * #183: driving up a ramp is a continuous, sustained change, but every
   * intermediate reading used to pay the full rest dwell (600 ms
   * default) before showing — noticeably laggy to watch while actually
   * adjusting. Once a change has *just* been adopted, a further change
   * in the same direction only needs the much shorter motion dwell; a
   * fresh direction (including the very first change, or one reversing
   * the last) still pays the full rest dwell, so the noise guard for
   * genuine jitter (which doesn't hold one direction for two changes in
   * a row) is unaffected.
   */
  it('keeps up with a sustained one-directional change (driving up a ramp), but not a fresh or reversed one', () => {
    const at = createHarness();
    expect(settle(at, 200).wheels.frontRight.displayMm).toBe(200);

    // First step down: a fresh direction — full rest dwell, unchanged
    // from before this feature existed.
    expect(settle(at, 150).wheels.frontRight.displayMm).toBe(150);

    // A further step, same direction, fed at sensor rate: total elapsed
    // is well under the rest dwell, but the figure keeps up regardless —
    // this is the "still climbing the ramp" case.
    at(100, 50);
    const quick = at(100, settings.dwellMotionMs + 20);
    expect(quick.wheels.frontRight.displayMm).toBe(100);

    // A change reversing direction, fed just as quickly, does NOT get the
    // fast path — it needs the full rest dwell like any fresh direction.
    at(120, 50);
    const reversed = at(120, settings.dwellMotionMs + 20);
    expect(reversed.wheels.frontRight.displayMm).toBe(100); // not yet
    expect(settle(at, 120).wheels.frontRight.displayMm).toBe(120); // given time, it does adopt
  });

  it('does not let oscillating jitter borrow the fast motion dwell', () => {
    // Jitter alternates direction every reading, so — with nothing yet
    // adopted to compare against — it can never satisfy "the same
    // direction as the last adopted change": every reading here is fed
    // faster than the motion dwell (150 ms default), which would have
    // been enough to adopt *if* this were a sustained one-directional
    // change; staying frozen past that proves the slow, full rest-dwell
    // path is the one actually being used.
    const at = createHarness();
    expect(settle(at, 50).wheels.frontRight.displayMm).toBe(50);
    const dtMs = settings.dwellMotionMs + 20;
    const bounce = [80, 20, 80]; // 3 × dtMs is still short of the rest dwell
    expect(3 * dtMs).toBeLessThan(settings.dwellRestMs);
    for (const liftMm of bounce) {
      expect(at(liftMm, dtMs).wheels.frontRight.displayMm).toBe(50);
    }
  });

  /**
   * Field regression: a screenshot (v1.0.0-CR180) showed one corner as
   * "Klart" (green check, 43 mm) and the diagonal corner as a red X,
   * "Ingen ramp" ("no ramp reaches this wheel"), 0 mm — a wheel that by
   * its own displayed number needs no lift at all, flagged as needing one
   * a ramp can't provide. Each field (mm, step, color) was individually
   * "correct" per its own dwell, but the mm figure and the shown plan
   * updated on different clocks than the color, so mid-transition they
   * could disagree. The fix: severity is now a pure function of the
   * *exact* shown plan + displayed mm figures — recomputing it from
   * those two (the same inputs the UI renders) must equal what the
   * stabilizer actually returned, on every single frame, never just at
   * rest.
   */
  it('never lets a wheel card show a color the shown mm/step figures disagree with (field regression: screenshot v1.0.0-CR180)', () => {
    const stabilize = createDisplayStabilizer();
    const wheel = (liftMm: number) => ({ liftMm, stepMm: 0 });
    const resultFor = (fl: number, fr: number, rl: number, rr: number) => ({
      rollDeg: 0,
      pitchDeg: 0,
      isLevel: false,
      wheels: {
        frontLeft: wheel(fl),
        frontRight: wheel(fr),
        rearLeft: wheel(rl),
        rearRight: wheel(rr),
      },
    });

    // A wheel needing the tallest step, then a sudden clear back near
    // level — fed at sensor rate (16 ms) so most frames land mid-dwell,
    // exactly where the old, independently-clocked severity could drift
    // from the mm figure and shown step it was meant to describe.
    const frames: Array<[number, number, number, number, number]> = [
      [0, 150, 30, 118, 1600], // settle: a real "needs a big step" state
      [0, 150, 30, 118, 1600],
      [0, 0, 30, 118, 16],
      [0, 0, 30, 118, 16],
      [0, 0, 30, 118, 200],
      [0, 0, 30, 118, 400],
      [0, 0, 30, 118, 700],
      [0, 0, 30, 118, 1600],
      [0, 8, 5, 20, 16],
      [0, 8, 5, 20, 700],
      [0, 8, 5, 20, 1600],
    ];

    let now = 0;
    for (const [fl, fr, rl, rr, dtMs] of frames) {
      now += dtMs;
      const display = stabilize(resultFor(fl, fr, rl, rr), settings, now);

      const shownSteps = {} as Record<(typeof WHEEL_IDS)[number], number>;
      const shownMm = {} as Record<(typeof WHEEL_IDS)[number], number>;
      for (const id of WHEEL_IDS) {
        shownSteps[id] = display.wheels[id].stepMm;
        shownMm[id] = display.wheels[id].displayMm;
      }
      const deficits = evaluateSteps(shownSteps, shownMm, settings).deficits;

      for (const id of WHEEL_IDS) {
        const expected = plannedSeverity(shownSteps[id], deficits[id], shownMm[id], settings);
        expect(display.wheels[id].severity).toBe(expected);
      }
    }
  });
});

describe('two-ramp plan display (#93)', () => {
  const planSettings = { ...settings, rampStepHeightsMm: [40, 80, 120] };

  /** Hand-built LevelingResult: the stabilizer only reads the lifts. */
  function resultFor(fl: number, fr: number, rl: number, rr: number) {
    const wheel = (liftMm: number) => ({ liftMm, stepMm: 0 });
    return {
      rollDeg: 0,
      pitchDeg: 0,
      isLevel: false,
      wheels: {
        frontLeft: wheel(fl),
        frontRight: wheel(fr),
        rearLeft: wheel(rl),
        rearRight: wheel(rr),
      },
    };
  }

  it('steps go only to the planned wheels; an unserved wheel is toned down', () => {
    // Three wheels below the highest corner, two ramps: the plan serves
    // the rear pair; the front right gets no ramp — dimmed, not alarmed.
    const display = createDisplayStabilizer()(resultFor(0, 30, 50, 80), planSettings, 0);
    expect(display.wheels.rearLeft.stepMm).toBe(40);
    expect(display.wheels.rearRight.stepMm).toBe(80);
    expect(display.wheels.frontRight.stepMm).toBe(0);
    expect(display.wheels.frontRight.severity).toBe('unserved');
    expect(display.wheels.frontLeft.severity).toBe('none');
    expect(display.isLevel).toBe(false);
  });

  it('with four ramps the same tilt gets a full plan', () => {
    const four = { ...planSettings, rampCount: 4 };
    const display = createDisplayStabilizer()(resultFor(0, 30, 50, 80), four, 0);
    const stepped = WHEEL_IDS.filter((id) => display.wheels[id].stepMm > 0);
    expect(stepped).toHaveLength(3);
    const severities = WHEEL_IDS.map((id) => display.wheels[id].severity);
    expect(severities.every((s) => s === 'none' || s === 'small')).toBe(true);
  });

  it("exposes the shown plan's residual deficit for the status line (#125)", () => {
    // Same unreachable tilt as above: best two-ramp plan leaves 30 mm.
    const display = createDisplayStabilizer()(resultFor(0, 30, 50, 80), planSettings, 0);
    expect(display.wheels.frontRight.severity).toBe('unserved');
    expect(display.maxDeficitMm).toBeCloseTo(30);
    // With enough ramps the plan reaches level: no residual deficit.
    const four = { ...planSettings, rampCount: 4 };
    const level = createDisplayStabilizer()(resultFor(0, 30, 50, 80), four, 0);
    expect(level.maxDeficitMm).toBeLessThanOrEqual(planSettings.toleranceMm);
  });
});
