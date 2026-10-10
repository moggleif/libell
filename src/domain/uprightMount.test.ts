import { describe, expect, it } from 'vitest';
import { isStandingUpright, mayZeroUprightBox, ZERO_CONFIRM_WINDOW_MS } from './uprightMount';

describe('a box that must stand upright (#304, found on hardware in #273)', () => {
  it('stands upright a few degrees off level', () => {
    expect(isStandingUpright({ pitchDeg: 3, rollDeg: -2 })).toBe(true);
  });

  it('lies down when either angle reads near a quarter turn', () => {
    expect(isStandingUpright({ pitchDeg: -89, rollDeg: 1 })).toBe(false);
    expect(isStandingUpright({ pitchDeg: 2, rollDeg: 88 })).toBe(false);
  });

  it('is zeroed at once when it stands upright', () => {
    expect(mayZeroUprightBox({ pitchDeg: 2, rollDeg: 1 }, null, 1000)).toBe(true);
  });

  it('is not zeroed on the first tap while it lies down', () => {
    expect(mayZeroUprightBox({ pitchDeg: -88, rollDeg: 0 }, null, 1000)).toBe(false);
  });

  it('is zeroed on a second tap right after the refusal: the way back for a box zeroed lying down earlier', () => {
    const now = 1000 + ZERO_CONFIRM_WINDOW_MS;
    expect(mayZeroUprightBox({ pitchDeg: 88, rollDeg: 0 }, 1000, now)).toBe(true);
  });

  it('asks again once that window has passed', () => {
    const now = 1001 + ZERO_CONFIRM_WINDOW_MS;
    expect(mayZeroUprightBox({ pitchDeg: 88, rollDeg: 0 }, 1000, now)).toBe(false);
  });

  it('does not block without a reading; not being connected is reported on its own', () => {
    expect(mayZeroUprightBox(null, null, 1000)).toBe(true);
  });
});
