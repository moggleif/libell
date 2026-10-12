/**
 * Small inline SVGs that carry the meaning so the captions can stay short.
 * `vehicleType` defaults to motorhome for the Help tab, which is not tied
 * to the user's vehicle.
 */
import type { VehicleType } from '../domain/settings';
import { svgEl } from './svg';

function svg(viewBox: string, label: string): SVGSVGElement {
  const root = svgEl('svg', { viewBox, role: 'img', class: 'illu' });
  root.setAttribute('aria-label', label);
  return root;
}

function outline(x: number, y: number, w: number, h: number): SVGRectElement {
  return svgEl('rect', {
    x: String(x),
    y: String(y),
    width: String(w),
    height: String(h),
    rx: '14',
    class: 'illu__body',
  });
}

/** Same proportions as the real diagram's windshield, scaled to the body
 * rect passed in. */
function windshield(x: number, y: number, w: number, h: number): SVGPathElement {
  const inset = w * 0.13;
  const left = x + inset;
  const right = x + w - inset;
  const mid = x + w / 2;
  const topSide = y + h * 0.1;
  const topPeak = y + h * 0.02;
  const botSide = y + h * 0.19;
  const botPeak = y + h * 0.14;
  return svgEl('path', {
    d: `M${left} ${topSide} Q${mid} ${topPeak} ${right} ${topSide} L${right} ${botSide} Q${mid} ${botPeak} ${left} ${botSide} Z`,
    class: 'illu__windshield',
  });
}

function frontArrow(): SVGPathElement {
  return svgEl('path', {
    d: 'M100 6 L92 20 L97 20 L97 30 L103 30 L103 20 L108 20 Z',
    class: 'illu__accent',
  });
}

export function placementIllustration(
  label: string,
  vehicleType: VehicleType = 'motorhome',
): SVGSVGElement {
  const root = svg('0 0 200 150', label);
  const phone = [
    svgEl('rect', { x: '86', y: '66', width: '28', height: '48', rx: '5', class: 'illu__phone' }),
    svgEl('rect', { x: '92', y: '72', width: '16', height: '30', rx: '2', class: 'illu__screen' }),
    svgEl('path', { d: 'M100 62 L96 68 L104 68 Z', class: 'illu__accent' }),
  ];
  if (vehicleType === 'caravan') {
    root.append(
      frontArrow(),
      svgEl('path', { d: 'M76 56 L100 30 L124 56', class: 'illu__drawbar' }),
      svgEl('circle', { cx: '100', cy: '30', r: '6', class: 'illu__wheel' }),
      outline(58, 56, 84, 86),
      ...phone,
    );
    return root;
  }
  root.append(frontArrow(), outline(60, 36, 80, 106), windshield(60, 36, 80, 106), ...phone);
  return root;
}

export function legendIllustration(label: string): SVGSVGElement {
  const root = svg('0 0 260 70', label);
  const states: [string, string][] = [
    ['illu__wheel--ok', '✓'],
    ['illu__wheel--up', '↑'],
    ['illu__wheel--no', '✕'],
    ['illu__wheel--dim', '–'],
  ];
  states.forEach(([cls, glyph], i) => {
    const x = 30 + i * 60;
    root.append(
      svgEl('rect', {
        x: String(x),
        y: '12',
        width: '28',
        height: '46',
        rx: '9',
        class: `illu__wheel ${cls}`,
      }),
      svgEl('text', { x: String(x + 14), y: '42', class: 'illu__glyph' }, glyph),
    );
  });
  return root;
}

function wheelRect(x: number, y: number): SVGRectElement {
  return svgEl('rect', {
    x: String(x - 7),
    y: String(y),
    width: '14',
    height: '26',
    rx: '5',
    class: 'illu__wheel',
  });
}

/** Measure lines only, no letters: the field labels say what each is. A
 * motorhome has separate front and rear track widths, so one dashed line
 * at each axle. */
export function measuresIllustration(
  label: string,
  vehicleType: VehicleType = 'motorhome',
): SVGSVGElement {
  const root = svg('0 0 200 160', label);
  if (vehicleType === 'caravan') {
    root.append(
      svgEl('path', { d: 'M70 60 L100 30 L130 60', class: 'illu__drawbar' }),
      svgEl('circle', { cx: '100', cy: '30', r: '7', class: 'illu__wheel' }),
      outline(55, 60, 90, 88),
      wheelRect(45, 120),
      // Mirrors the left wheel (45) about the 100 centre line.
      wheelRect(155, 120),
      svgEl('line', { x1: '100', y1: '30', x2: '100', y2: '133', class: 'illu__measure' }),
      svgEl('line', {
        x1: '45',
        y1: '133',
        x2: '155',
        y2: '133',
        class: 'illu__measure illu__measure--dash',
      }),
    );
    return root;
  }
  root.append(
    outline(55, 12, 90, 136),
    windshield(55, 12, 90, 136),
    wheelRect(45, 30),
    wheelRect(155, 30),
    wheelRect(45, 116),
    wheelRect(155, 116),
    svgEl('line', { x1: '100', y1: '43', x2: '100', y2: '129', class: 'illu__measure' }),
    // Front axle track width.
    svgEl('line', {
      x1: '45',
      y1: '43',
      x2: '155',
      y2: '43',
      class: 'illu__measure illu__measure--dash',
    }),
    // Rear axle track width.
    svgEl('line', {
      x1: '45',
      y1: '129',
      x2: '155',
      y2: '129',
      class: 'illu__measure illu__measure--dash',
    }),
  );
  return root;
}
