/**
 * Top-down RV diagram — the hero of the screen (issues #4/#5).
 *
 * Inline SVG: an RV outline seen from above with a "Front ↑" arrow so the
 * user knows how to place the phone, and one marker per wheel. Wheels that
 * need raising are colored (orange = small lift, red = large) and labeled
 * with the required lift in cm, so color is never the only signal.
 */
import { liftSeverity, WHEEL_IDS, type LevelingResult, type WheelId } from '../domain/leveling';
import type { LevelSettings } from '../domain/settings';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface WheelRefs {
  marker: SVGRectElement;
  label: SVGTextElement;
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

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

export function createRvDiagram(): RvDiagram {
  const container = document.createElement('figure');
  container.className = 'rv-diagram';

  const svg = svgEl('svg', {
    viewBox: '0 0 240 330',
    role: 'img',
    'aria-label': 'Top-down view of your RV showing which wheels need raising',
  });

  // Front arrow + placement hint.
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
    // The lift figure sits in front of the front wheels and behind the
    // rear wheels, so each number is unambiguously "its" wheel.
    const isFront = y < 170;
    const label = svgEl('text', {
      x: String(x),
      y: String(isFront ? y - 32 : y + 42),
      'text-anchor': 'middle',
      class: 'rv-diagram__lift-label',
    });
    svg.append(marker, label);
    wheels[id] = { marker, label };
  }

  const caption = document.createElement('figcaption');
  caption.className = 'rv-diagram__caption';
  caption.textContent = 'Point the top of your phone toward the front.';
  container.append(svg, caption);

  return {
    element: container,
    update(result, settings) {
      for (const id of WHEEL_IDS) {
        const { liftCm } = result.wheels[id];
        const severity = liftSeverity(liftCm, settings);
        const { marker, label } = wheels[id];
        marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        label.textContent = severity === 'none' ? '' : `${liftCm.toFixed(1)} cm`;
      }
    },
  };
}
