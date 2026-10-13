// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createTiltReadout } from './tiltReadout';

describe('createTiltReadout (#510)', () => {
  it('shows front/back first, then side/side, each with its sign', () => {
    const readout = createTiltReadout();
    readout.update({ rollDeg: -1.26, pitchDeg: 0.34 });
    expect(readout.element.textContent).toBe('Front/back +0.3°  ·  Side/side −1.3°');
  });

  it('shows a level reading as plus zero', () => {
    const readout = createTiltReadout();
    readout.update({ rollDeg: 0, pitchDeg: 0 });
    expect(readout.element.textContent).toBe('Front/back +0.0°  ·  Side/side +0.0°');
  });
});
