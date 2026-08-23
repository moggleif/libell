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
    // Green/orange boundary sits at the tolerance (20 mm), dead band 3 mm.
    const stabilize = createDisplayStabilizer();
    expect(displayFor(stabilize, 1.8).severity).toBe('none');
    expect(displayFor(stabilize, 2.05).severity).toBe('none');
    expect(displayFor(stabilize, 1.95).severity).toBe('none');
    expect(displayFor(stabilize, 2.5).severity).toBe('small');
    // And it does not fall straight back at boundary jitter.
    expect(displayFor(stabilize, 2.05).severity).toBe('small');
  });

  it('shows every wheel green while the vehicle is level', () => {
    const stabilize = createDisplayStabilizer();
    const result = computeLeveling(gravityFor(rollForLift(1.5, 180), 0), settings);
    expect(result.isLevel).toBe(true);
    const display = stabilize(result, settings);
    expect(display.isLevel).toBe(true);
    expect(display.wheels.frontRight.severity).toBe('none');
    expect(display.wheels.frontLeft.severity).toBe('none');
  });

  it('holds "level" through jitter just past the tolerance', () => {
    // Tolerance 20 mm, dead band 3 mm → leaves level only above 23 mm.
    const stabilize = createDisplayStabilizer();
    const at = (liftCm: number) =>
      stabilize(computeLeveling(gravityFor(rollForLift(liftCm, 180), 0), settings), settings);
    expect(at(1.5).isLevel).toBe(true);
    expect(at(2.2).isLevel).toBe(true); // within the dead band — still level
    expect(at(2.6).isLevel).toBe(false); // clearly out
    expect(at(2.2).isLevel).toBe(false); // must come back inside to re-enter
    expect(at(1.5).isLevel).toBe(true);
  });
});
