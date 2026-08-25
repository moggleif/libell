import { describe, expect, it } from 'vitest';
import {
  computeCaravanLeveling,
  createCaravanStabilizer,
  type CaravanLevelingResult,
} from './caravan';
import type { GravityVector } from './leveling';
import { DEFAULT_SETTINGS } from './settings';

// Symmetric reference geometry: axle track 1800 mm, axle→jockey 4000 mm.
const SETTINGS = {
  ...DEFAULT_SETTINGS,
  vehicleType: 'caravan' as const,
  wheelbaseMm: 4000,
  trackWidthFrontMm: 1800,
  trackWidthRearMm: 1800,
};

const G = 9.81;

function gravityFor(rollDeg: number, pitchDeg: number): GravityVector {
  const roll = (rollDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  return { x: G * Math.tan(roll), y: G * Math.tan(pitch), z: G };
}

const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);

describe('computeCaravanLeveling', () => {
  it('reports level with no corrections when flat', () => {
    const result = computeCaravanLeveling({ x: 0, y: 0, z: G }, SETTINGS);
    expect(result.isLevel).toBe(true);
    expect(result.axle.left.liftMm).toBeCloseTo(0);
    expect(result.axle.right.liftMm).toBeCloseTo(0);
    expect(result.jockeyMm).toBeCloseTo(0);
  });

  it('pure roll: ramps the low axle wheel, jockey untouched', () => {
    // Negative roll = right side low (same convention as the motorhome math).
    const result = computeCaravanLeveling(gravityFor(-2, 0), SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.axle.left.liftMm).toBeCloseTo(0);
    expect(result.axle.right.liftMm).toBeCloseTo(SETTINGS.trackWidthRearMm * tan(2));
    expect(result.axle.right.stepMm).toBeGreaterThan(0);
    expect(result.jockeyMm).toBeCloseTo(0);
  });

  it('front low: crank the jockey wheel up — no ramps involved', () => {
    const result = computeCaravanLeveling(gravityFor(0, -1), SETTINGS);
    expect(result.isLevel).toBe(false);
    expect(result.axle.left.liftMm).toBeCloseTo(0);
    expect(result.axle.right.liftMm).toBeCloseTo(0);
    expect(result.jockeyMm).toBeCloseTo(SETTINGS.wheelbaseMm * tan(1));
  });

  it('front high: crank the jockey wheel down (negative correction)', () => {
    const result = computeCaravanLeveling(gravityFor(0, 1), SETTINGS);
    expect(result.jockeyMm).toBeCloseTo(-SETTINGS.wheelbaseMm * tan(1));
    expect(result.isLevel).toBe(false);
  });

  it('combined roll and pitch: one wheel ramps, the jockey cranks', () => {
    const result = computeCaravanLeveling(gravityFor(2, -1), SETTINGS);
    // Positive roll = left side low.
    expect(result.axle.left.liftMm).toBeCloseTo(SETTINGS.trackWidthRearMm * tan(2));
    expect(result.axle.right.liftMm).toBeCloseTo(0);
    expect(result.jockeyMm).toBeCloseTo(SETTINGS.wheelbaseMm * tan(1));
  });

  it('is level when both corrections are within the mm tolerance', () => {
    // 0.5° over 1800 mm track ≈ 15.7 mm, over 4000 mm ≈ 35 mm.
    const small = computeCaravanLeveling(gravityFor(-0.5, 0), SETTINGS);
    expect(small.axle.right.liftMm).toBeLessThan(SETTINGS.toleranceMm);
    expect(small.isLevel).toBe(true);
    const jockeyOut = computeCaravanLeveling(gravityFor(0, -0.5), SETTINGS);
    expect(Math.abs(jockeyOut.jockeyMm)).toBeGreaterThan(SETTINGS.toleranceMm);
    expect(jockeyOut.isLevel).toBe(false);
  });

  it('subtracts the phone calibration from the reading', () => {
    const result = computeCaravanLeveling(gravityFor(-2, -1), SETTINGS, {
      rollDeg: -2,
      pitchDeg: -1,
    });
    expect(result.isLevel).toBe(true);
    expect(result.jockeyMm).toBeCloseTo(0);
  });
});

describe('createCaravanStabilizer', () => {
  const raw = (rollDeg: number, pitchDeg: number): CaravanLevelingResult =>
    computeCaravanLeveling(gravityFor(rollDeg, pitchDeg), SETTINGS);

  it('adopts the first reading immediately', () => {
    const stabilize = createCaravanStabilizer();
    const shown = stabilize(raw(0, -1), SETTINGS, 0);
    expect(shown.jockey.direction).toBe('up');
    expect(shown.jockey.displayMm).toBeCloseTo(SETTINGS.wheelbaseMm * tan(1), 0);
    expect(shown.isLevel).toBe(false);
  });

  it('does not flap the jockey direction at boundary jitter', () => {
    const stabilize = createCaravanStabilizer();
    // Start clearly level, then jitter right at the tolerance boundary:
    // ~tolerance ± a hair, converted to degrees over the 4000 mm arm.
    let shown = stabilize(raw(0, 0), SETTINGS, 0);
    expect(shown.jockey.direction).toBe('ok');
    const degAt = (mm: number) => -(Math.atan(mm / SETTINGS.wheelbaseMm) * 180) / Math.PI;
    for (let t = 100; t <= 5000; t += 100) {
      const mm = SETTINGS.toleranceMm + (t % 200 === 0 ? 1 : -1);
      shown = stabilize(raw(0, degAt(mm)), SETTINGS, t);
      expect(shown.jockey.direction).toBe('ok');
    }
    expect(shown.isLevel).toBe(true);
  });

  it('adopts a clear, sustained jockey change after the dwell', () => {
    const stabilize = createCaravanStabilizer();
    stabilize(raw(0, 0), SETTINGS, 0);
    let shown = stabilize(raw(0, -1), SETTINGS, 100);
    expect(shown.jockey.direction).toBe('ok'); // dwell not yet served
    shown = stabilize(raw(0, -1), SETTINGS, 5000);
    expect(shown.jockey.direction).toBe('up');
    expect(shown.isLevel).toBe(false);
  });

  it('keeps up with a sustained jockey crank, same as a wheel driving up a ramp (#183)', () => {
    const stabilize = createCaravanStabilizer();
    const degAt = (mm: number) => -(Math.atan(mm / SETTINGS.wheelbaseMm) * 180) / Math.PI;
    let now = 0;
    let shown = stabilize(raw(0, 0), SETTINGS, now); // settle: level
    now += 5000;
    shown = stabilize(raw(0, 0), SETTINGS, now);
    expect(shown.jockey.displayMm).toBeCloseTo(0, 0);

    // First move: a fresh direction — full rest dwell.
    now += SETTINGS.dwellRestMs + 100;
    shown = stabilize(raw(0, degAt(80)), SETTINGS, now);
    now += SETTINGS.dwellRestMs + 100;
    shown = stabilize(raw(0, degAt(80)), SETTINGS, now);
    expect(shown.jockey.displayMm).toBeCloseTo(80, 0);

    // Further cranking, same direction, fed quickly: keeps up well under
    // the rest dwell — the same fix applied to a motorhome wheel's mm.
    now += 50;
    stabilize(raw(0, degAt(120)), SETTINGS, now);
    now += SETTINGS.dwellMotionMs + 20;
    shown = stabilize(raw(0, degAt(120)), SETTINGS, now);
    expect(shown.jockey.displayMm).toBeCloseTo(120, 0);
  });

  it('keeps the axle wheel mm figure steady inside the dead band', () => {
    const stabilize = createCaravanStabilizer();
    const first = stabilize(raw(-2, 0), SETTINGS, 0);
    const shownMm = first.axle.right.displayMm;
    // A wiggle smaller than 0.5 + stability dead band must not change it.
    const wiggleDeg = -2 + 0.005;
    const later = stabilize(raw(wiggleDeg, 0), SETTINGS, 10_000);
    expect(later.axle.right.displayMm).toBe(shownMm);
  });

  /**
   * Field regression, same root cause as stability.ts's motorhome fix
   * (screenshot v1.0.0-CR180): the jockey's shown magnitude and its
   * arrow direction used to sit on separate clocks (mm: value dwell,
   * direction: the longer state dwell), so mid-transition the screen
   * could show e.g. a near-zero mm figure next to a "crank up" arrow.
   * Both now derive from one stabilized signed value — check they can
   * never disagree across a transition fed at sensor rate.
   */
  it('never shows a jockey mm figure and arrow direction that disagree (field regression)', () => {
    const stabilize = createCaravanStabilizer();
    const degAt = (mm: number) => -(Math.atan(mm / SETTINGS.wheelbaseMm) * 180) / Math.PI;

    let now = 0;
    let shown = stabilize(raw(0, degAt(80)), SETTINGS, now); // settle: clearly "crank up"
    now += 5000;
    shown = stabilize(raw(0, degAt(80)), SETTINGS, now);
    expect(shown.jockey.direction).toBe('up');

    // Sudden clear back toward level, fed at sensor rate so most frames
    // land mid-dwell — exactly where the two used to drift apart.
    for (const dtMs of [16, 16, 16, 200, 400, 700, 1600]) {
      now += dtMs;
      shown = stabilize(raw(0, degAt(0)), SETTINGS, now);
      if (shown.jockey.displayMm <= SETTINGS.toleranceMm) {
        expect(shown.jockey.direction).toBe('ok');
      }
      if (shown.jockey.direction === 'ok') {
        expect(shown.jockey.displayMm).toBeLessThanOrEqual(SETTINGS.toleranceMm);
      }
    }
  });

  /**
   * Same fix applied to the axle wheels: severity used to be judged
   * against the live lift on its own (longer) clock while the mm figure
   * and step followed their own — check they stay in lockstep too.
   */
  it('never shows an axle wheel color the shown mm/step figures disagree with (field regression)', () => {
    const stabilize = createCaravanStabilizer();
    let now = 0;
    let shown = stabilize(raw(-3, 0), SETTINGS, now); // settle: right wheel needs a big ramp
    now += 5000;
    shown = stabilize(raw(-3, 0), SETTINGS, now);
    expect(shown.axle.right.severity).not.toBe('none');

    for (const dtMs of [16, 16, 16, 200, 400, 700, 1600]) {
      now += dtMs;
      shown = stabilize(raw(0, 0), SETTINGS, now);
      const { displayMm, stepMm, severity } = shown.axle.right;
      const expected =
        displayMm <= SETTINGS.toleranceMm
          ? 'none'
          : Math.abs(displayMm - stepMm) <= SETTINGS.toleranceMm
            ? 'small'
            : 'large';
      expect(severity).toBe(expected);
    }
  });
});
