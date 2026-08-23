/**
 * Top-down RV diagram — the hero of the screen.
 *
 * Inline SVG: an RV outline seen from above with a "Front ↑" arrow and one
 * marker per wheel. Wheels are green when they need no lift; wheels that
 * need raising are orange (a step reaches) or red (beyond the tallest
 * step). Below each wheel the required lift in whole cm; above it the ramp
 * step height to drive up onto. The bubble level sits in the middle of the
 * vehicle, like a spirit level lying on the floor.
 */
import { liftSeverity, WHEEL_IDS, type LevelingResult, type WheelId } from '../domain/leveling';
import type { LevelSettings } from '../domain/settings';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface WheelRefs {
  marker: SVGRectElement;
  stepLabel: SVGTextElement;
  liftLabel: SVGTextElement;
}

export interface RvDiagram {
  element: HTMLElement;
  update(result: LevelingResult, settings: LevelSettings): void;
}

const WHEEL_POS: Record<WheelId, { x: number; y: number }> = {
  frontLeft: { x: 46, y: 96 },
  frontRight: { x: 194, y: 96 },
  rearLeft: { x: 46, y: 244 },
  rearRight: { x: 194, y: 244 },
};

const BUBBLE_CENTER = { x: 120, y: 172 };
const BUBBLE_TRAVEL = 22;
/** Degrees of tilt that push the bubble to the edge of its travel. */
const BUBBLE_FULL_SCALE_DEG = 5;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

export function createRvDiagram(): RvDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram';

  const svg = svgEl('svg', {
    viewBox: '0 0 240 310',
    role: 'img',
    'aria-label': 'Top-down view of your RV showing which wheels need raising',
  });

  // Front arrow.
  const arrow = svgEl('path', {
    d: 'M120 8 L110 26 L117 26 L117 40 L123 40 L123 26 L130 26 Z',
    class: 'rv-diagram__arrow',
  });
  const arrowLabel = svgEl('text', { x: '120', y: '58', class: 'rv-diagram__front-label' });
  arrowLabel.textContent = 'Front ↑';

  // RV body: rounded outline with a windshield hint at the front.
  const body = svgEl('rect', {
    x: '58',
    y: '72',
    width: '124',
    height: '196',
    rx: '26',
    class: 'rv-diagram__body',
  });
  const windshield = svgEl('path', {
    d: 'M74 92 Q120 76 166 92 L160 110 Q120 100 80 110 Z',
    class: 'rv-diagram__windshield',
  });

  svg.append(arrow, arrowLabel, body, windshield);

  const wheels = {} as Record<WheelId, WheelRefs>;
  for (const id of WHEEL_IDS) {
    const { x, y } = WHEEL_POS[id];
    const marker = svgEl('rect', {
      x: String(x - 14),
      y: String(y - 24),
      width: '28',
      height: '48',
      rx: '9',
      class: 'rv-diagram__wheel',
    });
    // Above the wheel: the ramp step to drive up onto. Below: the lift.
    const stepLabel = svgEl('text', {
      x: String(x),
      y: String(y - 32),
      'text-anchor': 'middle',
      class: 'rv-diagram__step-label',
    });
    const liftLabel = svgEl('text', {
      x: String(x),
      y: String(y + 42),
      'text-anchor': 'middle',
      class: 'rv-diagram__lift-label',
    });
    svg.append(marker, stepLabel, liftLabel);
    wheels[id] = { marker, stepLabel, liftLabel };
  }

  // Bubble level in the middle of the vehicle.
  const dial = svgEl('circle', {
    cx: String(BUBBLE_CENTER.x),
    cy: String(BUBBLE_CENTER.y),
    r: '34',
    class: 'rv-diagram__bubble-dial',
  });
  const ring = svgEl('circle', {
    cx: String(BUBBLE_CENTER.x),
    cy: String(BUBBLE_CENTER.y),
    r: '11',
    class: 'rv-diagram__bubble-ring',
  });
  const bubble = svgEl('circle', { r: '8', class: 'rv-diagram__bubble' });
  svg.append(dial, ring, bubble);

  container.append(svg);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let bx = BUBBLE_CENTER.x;
  let by = BUBBLE_CENTER.y;

  return {
    element: container,
    update(result, settings) {
      for (const id of WHEEL_IDS) {
        const { liftCm, stepMm } = result.wheels[id];
        const severity = liftSeverity(liftCm, settings);
        const { marker, stepLabel, liftLabel } = wheels[id];
        marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        if (severity === 'none') {
          stepLabel.textContent = '';
          liftLabel.textContent = '';
        } else {
          // Whole centimetres — a still phone should show a still number.
          liftLabel.textContent = `${Math.round(liftCm)} cm`;
          stepLabel.textContent = stepMm > 0 ? `↑ ${stepMm} mm` : '';
        }
      }

      // The bubble floats toward the high side.
      const targetX =
        BUBBLE_CENTER.x +
        Math.max(-1, Math.min(1, result.rollDeg / BUBBLE_FULL_SCALE_DEG)) * BUBBLE_TRAVEL;
      const targetY =
        BUBBLE_CENTER.y +
        Math.max(-1, Math.min(1, result.pitchDeg / BUBBLE_FULL_SCALE_DEG)) * BUBBLE_TRAVEL;
      if (reduceMotion.matches) {
        bx = targetX;
        by = targetY;
      } else {
        bx += (targetX - bx) * 0.3;
        by += (targetY - by) * 0.3;
      }
      bubble.setAttribute('cx', bx.toFixed(2));
      bubble.setAttribute('cy', by.toFixed(2));
      bubble.setAttribute(
        'class',
        result.isLevel ? 'rv-diagram__bubble rv-diagram__bubble--level' : 'rv-diagram__bubble',
      );
    },
  };
}
