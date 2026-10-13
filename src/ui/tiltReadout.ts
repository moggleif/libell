/**
 * Current tilt in degrees: small gray text, front/back and
 * side/side. Tabular figures so the digits don't jitter as values change.
 */
import { tiltDegreesText } from './tiltText';

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
      element.textContent = tiltDegreesText(result, '  ·  ');
    },
  };
}
