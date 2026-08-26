// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { measuresIllustration } from './helpIllustrations';

// Regression test (#184 follow-up): the right-side wheels used to sit at
// x=145 while the dashed track-width line ran to x=155 and the left
// wheels sat at x=45 — mirrored about the 100 centre line would put the
// right wheels at 155, not 145, so they visibly overlapped the vehicle
// body ("högerdäcken ligger fel") instead of sitting outside it like the
// left wheels do.
describe('measuresIllustration wheel symmetry', () => {
  function wheelCenterXs(svg: SVGSVGElement): number[] {
    return [...svg.querySelectorAll('rect.illu__wheel')].map(
      (rect) => Number(rect.getAttribute('x')) + Number(rect.getAttribute('width')) / 2,
    );
  }

  it('motorhome: every right wheel mirrors its left counterpart about the centre line', () => {
    const svg = measuresIllustration('label', 'motorhome');
    const xs = wheelCenterXs(svg);
    expect(xs).toHaveLength(4);
    for (const x of xs) {
      // Left wheels at 45, right wheels at 155 — both 55 from centre (100).
      expect(Math.abs(x - 100)).toBeCloseTo(55);
    }
  });

  it('caravan: the single axle’s right wheel mirrors the left one about the centre line', () => {
    const svg = measuresIllustration('label', 'caravan');
    const xs = wheelCenterXs(svg);
    expect(xs).toHaveLength(2);
    for (const x of xs) {
      expect(Math.abs(x - 100)).toBeCloseTo(55);
    }
  });
});
