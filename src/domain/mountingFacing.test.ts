import { describe, expect, it } from 'vitest';
import { applyAxisMapping, learnAxisMapping } from './axisMapping';
import {
  axisMappingForFacing,
  easyLevelMountingForFacing,
  facingForAxisMapping,
  facingForEasyLevelMounting,
  FACINGS,
} from './mountingFacing';

describe('picking the facing by hand (#314)', () => {
  it('maps the four facings to the EasyLevel box’s four rotations and back', () => {
    expect(FACINGS.map(easyLevelMountingForFacing)).toEqual([
      'standard',
      'rotated90',
      'rotated180',
      'rotated270',
    ]);
    for (const facing of FACINGS) {
      expect(facingForEasyLevelMounting(easyLevelMountingForFacing(facing))).toBe(facing);
    }
  });

  it('needs no mapping in the reference facing', () => {
    expect(axisMappingForFacing('front', 'front')).toEqual({
      swap: false,
      pitchSign: 1,
      rollSign: 1,
    });
  });

  it('agrees with what the lift guide would learn for a box turned each way', () => {
    // Simulate a box turned a quarter turn clockwise per step: rotate the
    // vehicle's tilt into the box's own frame, then let the lift guide
    // (#293) learn it. Picking that facing must give the same mapping.
    const toBox = (pitch: number, roll: number, turns: number) => {
      let p = pitch;
      let r = roll;
      for (let i = 0; i < turns; i += 1) [p, r] = [r, -p];
      return { pitchDeg: p, rollDeg: r };
    };
    FACINGS.forEach((facing, turns) => {
      const learned = learnAxisMapping(toBox(0, 0, turns), toBox(3, 0, turns), toBox(0, 3, turns));
      expect(learned.ok).toBe(true);
      if (!learned.ok) return;
      expect(axisMappingForFacing(facing, 'front')).toEqual(learned.mapping);
      // And reading through it gives the vehicle's own tilt back.
      expect(applyAxisMapping(toBox(2, -1, turns), learned.mapping)).toEqual({
        pitchDeg: 2,
        rollDeg: -1,
      });
    });
  });

  it('counts turns from whichever facing is the reference', () => {
    expect(axisMappingForFacing('rear', 'right')).toEqual(axisMappingForFacing('right', 'front'));
  });

  it('reads a picked mapping back as its facing, and a mirrored or missing one as none', () => {
    for (const facing of FACINGS) {
      expect(facingForAxisMapping(axisMappingForFacing(facing, 'front'), 'front')).toBe(facing);
    }
    expect(facingForAxisMapping({ swap: false, pitchSign: 1, rollSign: -1 }, 'front')).toBeNull();
    expect(facingForAxisMapping(null, 'front')).toBeNull();
  });
});
