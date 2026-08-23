import { describe, expect, it } from 'vitest';
import { computeLeveling, type GravityVector } from './leveling';
import { DEFAULT_SETTINGS } from './settings';
import { createDisplayStabilizer } from './stability';

const G = 9.81;

function gravityFor(rollDeg: number, pitchDeg: number): GravityVector {
  const roll = (rollDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  return { x: G * Math.tan(roll), y: G * Math.tan(pitch), z: G };
}

/** Roll angle (deg) that produces the given front-right lift in cm. */
function rollForLift(liftCm: number, trackCm: number): number {
  return (-Math.atan(liftCm / trackCm) * 180) / Math.PI;
}

const settings = { ...DEFAULT_SETTINGS, rampStepHeightsMm: [20, 40, 60] };

function displayFor(stabilize: ReturnType<typeof createDisplayStabilizer>, liftCm: number) {
  const result = computeLeveling(gravityFor(rollForLift(liftCm, 180), 0), settings);
  return stabilize(result, settings).wheels.frontRight;
}

describe('createDisplayStabilizer', () => {
  it('keeps the whole-cm figure steady across rounding-edge jitter', () => {
    const stabilize = createDisplayStabilizer();
    expect(displayFor(stabilize, 4.4).displayCm).toBe(4);
    // Jitter around the 4/5 rounding edge stays at 4…
    expect(displayFor(stabilize, 4.55).displayCm).toBe(4);
    expect(displayFor(stabilize, 4.45).displayCm).toBe(4);
    // …until the reading clearly moves on.
    expect(displayFor(stabilize, 5.4).displayCm).toBe(5);
  });

  it('does not flap between two ramp steps at their midpoint', () => {
    const stabilize = createDisplayStabilizer();
    expect(displayFor(stabilize, 4.4).stepMm).toBe(40);
    // 5.05 cm is a hair past the 40/60 midpoint — not clearly better, keep 40.
    expect(displayFor(stabilize, 5.05).stepMm).toBe(40);
    expect(displayFor(stabilize, 4.95).stepMm).toBe(40);
    // A clear move switches.
    expect(displayFor(stabilize, 5.8).stepMm).toBe(60);
  });

  it('changes severity color only past the boundary dead band', () => {
    // Tight tolerance so the vehicle counts as un-level and the color is
    // governed by the step boundary alone: min step 20 mm → none/small
    // boundary at 10 mm.
    const tight = { ...settings, toleranceDeg: 0.1 };
    const stabilize = createDisplayStabilizer();
    const sev = (liftCm: number) => {
      const result = computeLeveling(gravityFor(rollForLift(liftCm, 180), 0), tight);
      return stabilize(result, tight).wheels.frontRight.severity;
    };
    expect(sev(0.8)).toBe('none');
    expect(sev(1.05)).toBe('none');
    expect(sev(0.95)).toBe('none');
    expect(sev(1.5)).toBe('small');
    // And it does not fall straight back at boundary jitter.
    expect(sev(1.05)).toBe('small');
  });

  it('shows every wheel green while the vehicle is level, whatever the lifts', () => {
    // A long wheelbase turns even a within-tolerance pitch into a couple
    // of cm of lift; the tolerance must gate the colors too, so the app
    // never colors wheels while saying "Your RV is level!".
    const stabilize = createDisplayStabilizer();
    const result = computeLeveling(gravityFor(0, -0.4), settings);
    expect(result.isLevel).toBe(true);
    expect(result.wheels.frontLeft.liftCm).toBeGreaterThan(2);
    const display = stabilize(result, settings);
    expect(display.isLevel).toBe(true);
    expect(display.wheels.frontLeft.severity).toBe('none');
    expect(display.wheels.frontRight.severity).toBe('none');
  });

  it('holds "level" through jitter just past the tolerance', () => {
    const stabilize = createDisplayStabilizer();
    const at = (deg: number) => stabilize(computeLeveling(gravityFor(deg, 0), settings), settings);
    expect(at(0.2).isLevel).toBe(true);
    expect(at(0.55).isLevel).toBe(true); // within exit margin — still level
    expect(at(0.8).isLevel).toBe(false); // clearly out
    expect(at(0.55).isLevel).toBe(false); // must come back inside to re-enter
    expect(at(0.3).isLevel).toBe(true);
  });
});
