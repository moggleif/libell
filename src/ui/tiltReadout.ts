/**
 * Current tilt in degrees (issue #8): small gray text, front/back and
 * side/side. Tabular figures so the digits don't jitter as values change.
 */
export interface TiltReadout {
  element: HTMLElement;
  update(result: { rollDeg: number; pitchDeg: number }): void;
}

export function createTiltReadout(): TiltReadout {
  const element = document.createElement('p');
  element.className = 'tilt-readout';

  return {
    element,
    update(result) {
      const frontBack = result.pitchDeg;
      const sideSide = result.rollDeg;
      element.textContent =
        `Front/back ${frontBack >= 0 ? '+' : '−'}${Math.abs(frontBack).toFixed(1)}°` +
        `  ·  Side/side ${sideSide >= 0 ? '+' : '−'}${Math.abs(sideSide).toFixed(1)}°`;
    },
  };
}
