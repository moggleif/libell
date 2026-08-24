/**
 * Top-down caravan diagram (#72, ADR 0008): drawbar and jockey wheel at
 * the front, one axle pair, the bubble level in the middle. Shares the
 * `.rv-diagram` styles and the wheel/label conventions with the
 * motorhome diagram: step name above an axle wheel with its height
 * parenthesized small, plain lift below. The jockey wheel shows its
 * crank direction as a glyph plus the amount below.
 */
import type { CaravanDisplayResult } from '../domain/caravan';
import { formatLength } from '../domain/settings';
import { t } from './i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';

const AXLE = { y: 214, leftX: 46, rightX: 194 };
const JOCKEY = { x: 120, y: 84 };
const BUBBLE_CENTER = { x: 120, y: 214 };
const BUBBLE_TRAVEL = 22;
const BUBBLE_FULL_SCALE_DEG = 5;

const JOCKEY_GLYPH = { ok: '✓', up: '↑', down: '↓' } as const;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

export interface CaravanDiagram {
  element: HTMLElement;
  update(result: CaravanDisplayResult, unit: 'mm' | 'cm', stepHeightsMm: number[]): void;
}

interface AxleRefs {
  marker: SVGRectElement;
  glyph: SVGTextElement;
  stepName: SVGTSpanElement;
  stepHeight: SVGTSpanElement;
  liftLabel: SVGTextElement;
}

export function createCaravanDiagram(): CaravanDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram';

  const svg = svgEl('svg', {
    viewBox: '0 0 240 310',
    role: 'img',
    'aria-label': t('diagram.caravan.aria'),
  });

  // Front arrow above the coupling.
  const arrow = svgEl('path', {
    d: 'M120 6 L110 24 L117 24 L117 36 L123 36 L123 24 L130 24 Z',
    class: 'rv-diagram__arrow',
  });
  const arrowLabel = svgEl('text', { x: '120', y: '54', class: 'rv-diagram__front-label' });
  arrowLabel.textContent = t('diagram.front');

  // Caravan body with a drawbar converging on the coupling.
  const body = svgEl('rect', {
    x: '58',
    y: '128',
    width: '124',
    height: '160',
    rx: '22',
    class: 'rv-diagram__body',
  });
  const drawbar = svgEl('path', {
    d: 'M74 132 L120 66 L166 132',
    class: 'rv-diagram__drawbar',
  });
  svg.append(arrow, arrowLabel, drawbar, body);

  // Jockey wheel on the drawbar.
  const jockeyMarker = svgEl('rect', {
    x: String(JOCKEY.x - 11),
    y: String(JOCKEY.y - 18),
    width: '22',
    height: '36',
    rx: '9',
    class: 'rv-diagram__wheel',
  });
  const jockeyGlyph = svgEl('text', {
    x: String(JOCKEY.x),
    y: String(JOCKEY.y + 6),
    class: 'rv-diagram__wheel-glyph',
  });
  // Action and amount sit to the right of the jockey wheel — the area
  // beside the drawbar is empty, and above collides with "Front ↑".
  const jockeyAction = svgEl('text', {
    x: String(JOCKEY.x + 20),
    y: String(JOCKEY.y - 3),
    'text-anchor': 'start',
    class: 'rv-diagram__step-label',
  });
  const jockeyAmount = svgEl('text', {
    x: String(JOCKEY.x + 20),
    y: String(JOCKEY.y + 15),
    'text-anchor': 'start',
    class: 'rv-diagram__lift-label',
  });
  svg.append(jockeyMarker, jockeyGlyph, jockeyAction, jockeyAmount);

  // Axle wheels — same label conventions as the motorhome diagram.
  const axle = {} as Record<'left' | 'right', AxleRefs>;
  for (const side of ['left', 'right'] as const) {
    const x = side === 'left' ? AXLE.leftX : AXLE.rightX;
    const marker = svgEl('rect', {
      x: String(x - 14),
      y: String(AXLE.y - 24),
      width: '28',
      height: '48',
      rx: '9',
      class: 'rv-diagram__wheel',
    });
    const stepLabel = svgEl('text', {
      'text-anchor': 'middle',
      class: 'rv-diagram__step-label',
    });
    const stepName = svgEl('tspan', { x: String(x), y: String(AXLE.y - 48) });
    const stepHeight = svgEl('tspan', {
      x: String(x),
      y: String(AXLE.y - 32),
      class: 'rv-diagram__mm',
    });
    stepLabel.append(stepName, stepHeight);
    const liftLabel = svgEl('text', {
      x: String(x),
      y: String(AXLE.y + 42),
      'text-anchor': 'middle',
      class: 'rv-diagram__lift-label',
    });
    const glyph = svgEl('text', {
      x: String(x),
      y: String(AXLE.y + 7),
      class: 'rv-diagram__wheel-glyph',
    });
    svg.append(marker, glyph, stepLabel, liftLabel);
    axle[side] = { marker, glyph, stepName, stepHeight, liftLabel };
  }

  // Bubble level in the middle of the body.
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
    update(result, unit, stepHeightsMm) {
      for (const side of ['left', 'right'] as const) {
        const { displayMm, stepMm, severity } = result.axle[side];
        const refs = axle[side];
        refs.marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        refs.glyph.textContent = severity === 'none' ? '✓' : severity === 'small' ? '↑' : '✕';
        if (severity === 'none' || stepMm <= 0) {
          refs.stepName.textContent = '';
          refs.stepHeight.textContent = '';
        } else {
          const stepNumber = stepHeightsMm.indexOf(stepMm) + 1;
          refs.stepName.textContent =
            stepNumber > 0
              ? t('diagram.step', { n: stepNumber })
              : `↑ ${formatLength(stepMm, unit)}`;
          refs.stepHeight.textContent = stepNumber > 0 ? `(${formatLength(stepMm, unit)})` : '';
        }
        refs.liftLabel.textContent = severity === 'none' ? '' : formatLength(displayMm, unit);
      }

      // The jockey is bidirectional: never "red" — any amount is crankable.
      const { direction, displayMm } = result.jockey;
      jockeyMarker.setAttribute(
        'class',
        `rv-diagram__wheel rv-diagram__wheel--${direction === 'ok' ? 'none' : 'small'}`,
      );
      jockeyGlyph.textContent = JOCKEY_GLYPH[direction];
      jockeyAction.textContent =
        direction === 'ok' ? '' : t(direction === 'up' ? 'caravan.crankUp' : 'caravan.crankDown');
      jockeyAmount.textContent = direction === 'ok' ? '' : formatLength(displayMm, unit);

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
