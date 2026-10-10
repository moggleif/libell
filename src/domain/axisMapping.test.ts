import { describe, expect, it } from 'vitest';
import {
  applyAxisMapping,
  IDENTITY_AXIS_MAPPING,
  learnAxisMapping,
  parseAxisMapping,
  type AxisMapping,
} from './axisMapping';

const flat = { pitchDeg: 0, rollDeg: 0 };

/** What a box mounted with `mapping`'s inverse would report for a vehicle
 * tilt — the mounting under test, simulated: every case below learns from
 * these readings and must recover vehicle-frame angles exactly. */
function boxReading(vehicle: { pitchDeg: number; rollDeg: number }, mounting: AxisMapping) {
  // `applyAxisMapping` is its own inverse up to the swap, so invert it
  // explicitly: undo the signs, then undo the swap.
  const pitch = mounting.pitchSign * vehicle.pitchDeg;
  const roll = mounting.rollSign * vehicle.rollDeg;
  return mounting.swap ? { pitchDeg: roll, rollDeg: pitch } : { pitchDeg: pitch, rollDeg: roll };
}

const ALL_MOUNTINGS: AxisMapping[] = [false, true].flatMap((swap) =>
  ([1, -1] as const).flatMap((pitchSign) =>
    ([1, -1] as const).map((rollSign) => ({ swap, pitchSign, rollSign })),
  ),
);

describe('learnAxisMapping (#293)', () => {
  it.each(ALL_MOUNTINGS)(
    'learns every mounting so front-up reads positive pitch and left-low positive roll: %o',
    (mounting) => {
      const result = learnAxisMapping(
        boxReading(flat, mounting),
        // Front raised 3°: nose up.
        boxReading({ pitchDeg: 3, rollDeg: 0 }, mounting),
        // Right raised 2°: left low, positive roll.
        boxReading({ pitchDeg: 0, rollDeg: 2 }, mounting),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const vehicle = { pitchDeg: 1.5, rollDeg: -0.7 };
      const mapped = applyAxisMapping(boxReading(vehicle, mounting), result.mapping);
      expect(mapped.pitchDeg).toBeCloseTo(1.5);
      expect(mapped.rollDeg).toBeCloseTo(-0.7);
    },
  );

  it('learns from a box that is not level to start with', () => {
    // E.g. on its back after a zero that was not quite at level.
    const start = { pitchDeg: 0.8, rollDeg: -0.4 };
    const result = learnAxisMapping(
      start,
      { pitchDeg: 0.9, rollDeg: -3.4 },
      { pitchDeg: -1.7, rollDeg: -0.3 },
    );
    expect(result).toEqual({ ok: true, mapping: { swap: true, pitchSign: -1, rollSign: -1 } });
  });

  it('refuses a lift too small to tell from noise', () => {
    const result = learnAxisMapping(
      flat,
      { pitchDeg: 0.4, rollDeg: 0 },
      { pitchDeg: 0, rollDeg: 3 },
    );
    expect(result).toEqual({ ok: false, error: 'tooSmall' });
  });

  it('refuses a lift that moved both axes about equally — a corner, not a side', () => {
    const result = learnAxisMapping(
      flat,
      { pitchDeg: 2, rollDeg: 1.8 },
      { pitchDeg: 0, rollDeg: 3 },
    );
    expect(result).toEqual({ ok: false, error: 'ambiguous' });
  });

  it('tolerates a little sideways movement in a lift', () => {
    const result = learnAxisMapping(
      flat,
      { pitchDeg: 3, rollDeg: 0.6 },
      { pitchDeg: -0.4, rollDeg: 2 },
    );
    expect(result).toEqual({ ok: true, mapping: IDENTITY_AXIS_MAPPING });
  });

  it('refuses two lifts that moved the same axis', () => {
    const result = learnAxisMapping(
      flat,
      { pitchDeg: 3, rollDeg: 0 },
      { pitchDeg: -2, rollDeg: 0 },
    );
    expect(result).toEqual({ ok: false, error: 'sameAxis' });
  });
});

describe('applyAxisMapping (#293)', () => {
  it('changes nothing with the identity mapping', () => {
    expect(applyAxisMapping({ pitchDeg: 1, rollDeg: -2 }, IDENTITY_AXIS_MAPPING)).toEqual({
      pitchDeg: 1,
      rollDeg: -2,
    });
  });
});

describe('parseAxisMapping (#293)', () => {
  it('accepts a well-formed mapping', () => {
    expect(parseAxisMapping({ swap: true, pitchSign: -1, rollSign: 1 })).toEqual({
      swap: true,
      pitchSign: -1,
      rollSign: 1,
    });
  });

  it('rejects anything else rather than guessing', () => {
    expect(parseAxisMapping(null)).toBeNull();
    expect(parseAxisMapping('swap')).toBeNull();
    expect(parseAxisMapping({ swap: true, pitchSign: 2, rollSign: 1 })).toBeNull();
    expect(parseAxisMapping({ swap: 'yes', pitchSign: 1, rollSign: 1 })).toBeNull();
  });
});
