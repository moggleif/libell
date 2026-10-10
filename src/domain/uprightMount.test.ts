import { describe, expect, it } from 'vitest';
import { isStandingUpright } from './uprightMount';

describe('a box that must stand upright (#304, found on hardware in #273)', () => {
  it('stands upright a few degrees off level', () => {
    expect(isStandingUpright({ pitchDeg: 3, rollDeg: -2 })).toBe(true);
    expect(isStandingUpright({ pitchDeg: 45, rollDeg: -45 })).toBe(true);
  });

  it('lies down when either angle reads near a quarter turn', () => {
    expect(isStandingUpright({ pitchDeg: -89, rollDeg: 1 })).toBe(false);
    expect(isStandingUpright({ pitchDeg: 2, rollDeg: 88 })).toBe(false);
  });
});
