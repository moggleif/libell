/**
 * Help illustrations (issue #54): small inline SVGs that carry the
 * meaning so the captions can stay short. Token-based colors only —
 * legible in both themes, and the repo stays text-only.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(viewBox: string, label: string): SVGSVGElement {
  const root = el('svg', { viewBox, role: 'img', class: 'illu' });
  root.setAttribute('aria-label', label);
  return root;
}

function outline(x: number, y: number, w: number, h: number): SVGRectElement {
  return el('rect', {
    x: String(x),
    y: String(y),
    width: String(w),
    height: String(h),
    rx: '14',
    class: 'illu__body',
  });
}

/** Phone lying flat in the vehicle, top edge toward the front. */
export function placementIllustration(label: string): SVGSVGElement {
  const root = svg('0 0 200 150', label);
  root.append(
    el('path', {
      d: 'M100 6 L92 20 L97 20 L97 30 L103 30 L103 20 L108 20 Z',
      class: 'illu__accent',
    }),
    outline(60, 36, 80, 106),
    el('rect', { x: '86', y: '66', width: '28', height: '48', rx: '5', class: 'illu__phone' }),
    el('rect', { x: '92', y: '72', width: '16', height: '30', rx: '2', class: 'illu__screen' }),
    el('path', { d: 'M100 62 L96 68 L104 68 Z', class: 'illu__accent' }),
  );
  return root;
}

/** The three wheel states with their glyphs. */
export function legendIllustration(label: string): SVGSVGElement {
  const root = svg('0 0 220 70', label);
  const states: [string, string][] = [
    ['illu__wheel--ok', '✓'],
    ['illu__wheel--up', '↑'],
    ['illu__wheel--no', '✕'],
  ];
  states.forEach(([cls, glyph], i) => {
    const x = 30 + i * 75;
    root.append(
      el('rect', {
        x: String(x),
        y: '12',
        width: '28',
        height: '46',
        rx: '9',
        class: `illu__wheel ${cls}`,
      }),
      el('text', { x: String(x + 14), y: '42', class: 'illu__glyph' }, glyph),
    );
  });
  return root;
}

/** Wheelbase (L) and track width (W) shown on the vehicle. */
export function measuresIllustration(label: string): SVGSVGElement {
  const root = svg('0 0 200 160', label);
  root.append(outline(55, 12, 90, 136));
  const wheelPositions: [number, number][] = [
    [45, 30],
    [145, 30],
    [45, 116],
    [145, 116],
  ];
  for (const [x, y] of wheelPositions) {
    root.append(
      el('rect', {
        x: String(x - 7),
        y: String(y),
        width: '14',
        height: '26',
        rx: '5',
        class: 'illu__wheel',
      }),
    );
  }
  root.append(
    el('line', { x1: '100', y1: '43', x2: '100', y2: '129', class: 'illu__measure' }),
    el('text', { x: '108', y: '90', class: 'illu__label' }, 'L'),
    el('line', {
      x1: '45',
      y1: '80',
      x2: '155',
      y2: '80',
      class: 'illu__measure illu__measure--dash',
    }),
    el('text', { x: '68', y: '74', class: 'illu__label' }, 'W'),
  );
  return root;
}

/** Flip calibration: phone, 180° turn, phone. */
export function calibrationIllustration(label: string): SVGSVGElement {
  const root = svg('0 0 220 90', label);
  root.append(
    el('rect', { x: '30', y: '20', width: '34', height: '56', rx: '6', class: 'illu__phone' }),
    el('circle', { cx: '40', cy: '30', r: '3', class: 'illu__screen' }),
    el('path', { d: 'M84 46 A 26 26 0 1 1 136 46', class: 'illu__rotate' }),
    el('path', { d: 'M136 46 L130 36 L143 38 Z', class: 'illu__accent' }),
    el('text', { x: '110', y: '18', class: 'illu__label' }, '180°'),
    el('rect', { x: '156', y: '20', width: '34', height: '56', rx: '6', class: 'illu__phone' }),
    el('circle', { cx: '180', cy: '66', r: '3', class: 'illu__screen' }),
  );
  return root;
}
