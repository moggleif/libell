import { describe, expect, it } from 'vitest';
import { computeLeveling, WHEEL_IDS, type GravityVector } from './leveling';
import { DEFAULT_SETTINGS } from './settings';
import { createDisplayStabilizer, STATE_DWELL_MS, VALUE_DWELL_MS } from './stability';

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

/**
 * Frame-by-frame harness: each reading advances a fake clock, long enough
 * by default for every dwell to elapse, so a *sustained* reading always
 * shows. Pass a small dt to model rapid jitter instead.
 */
function createHarness() {
  const stabilize = createDisplayStabilizer();
  let now = 0;
  return (liftMm: number, dtMs = STATE_DWELL_MS + 100) => {
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
    expect(at(26, STATE_DWELL_MS + 100).isLevel).toBe(false);
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
      for (const dtMs of [16, 16, STATE_DWELL_MS + 100]) {
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
    at(40, VALUE_DWELL_MS / 2);
    const settled = at(40, VALUE_DWELL_MS);
    expect(settled.wheels.frontRight.displayMm).toBe(40);
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
