/**
 * Help illustrations (issue #54): small inline SVGs that carry the
 * meaning so the captions can stay short. Token-based colors only —
 * legible in both themes, and the repo stays text-only.
 *
 * `placementIllustration` and `measuresIllustration` take an optional
 * `VehicleType` (#184): a caravan gets a drawbar + jockey wheel + single
 * axle instead of the four-wheel motorhome box, mirroring the shape
 * `caravanDiagram.ts` already draws for the real top-down view. Defaults
 * to `'motorhome'` so the static Help tab (`infoMenu.ts`, not tied to any
 * particular user's vehicle) is unaffected — only the onboarding wizard,
 * which knows the vehicle the user just picked, passes the other value.
 */
import type { VehicleType } from '../domain/settings';

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

/** Windshield notch, same proportions/curve as `rv-diagram.ts`'s real
 * top-down body (`M74 92 Q120 76 166 92 L160 110 Q120 100 80 110 Z` on its
 * own 124-wide/196-tall body) — scaled to whatever body rect is passed in,
 * so a motorhome reads as a vehicle from above here too, not just on the
 * real screen (#189: these two used to look nothing alike). */
function windshield(x: number, y: number, w: number, h: number): SVGPathElement {
  const inset = w * 0.13;
  const left = x + inset;
  const right = x + w - inset;
  const mid = x + w / 2;
  const topSide = y + h * 0.1;
  const topPeak = y + h * 0.02;
  const botSide = y + h * 0.19;
  const botPeak = y + h * 0.14;
  return el('path', {
    d: `M${left} ${topSide} Q${mid} ${topPeak} ${right} ${topSide} L${right} ${botSide} Q${mid} ${botPeak} ${left} ${botSide} Z`,
    class: 'illu__windshield',
  });
}

function frontArrow(): SVGPathElement {
  return el('path', {
    d: 'M100 6 L92 20 L97 20 L97 30 L103 30 L103 20 L108 20 Z',
    class: 'illu__accent',
  });
}

/** Phone lying flat in the vehicle, top edge toward the front. */
export function placementIllustration(
  label: string,
  vehicleType: VehicleType = 'motorhome',
): SVGSVGElement {
  const root = svg('0 0 200 150', label);
  const phone = [
    el('rect', { x: '86', y: '66', width: '28', height: '48', rx: '5', class: 'illu__phone' }),
    el('rect', { x: '92', y: '72', width: '16', height: '30', rx: '2', class: 'illu__screen' }),
    el('path', { d: 'M100 62 L96 68 L104 68 Z', class: 'illu__accent' }),
  ];
  if (vehicleType === 'caravan') {
    root.append(
      frontArrow(),
      el('path', { d: 'M76 56 L100 30 L124 56', class: 'illu__drawbar' }),
      el('circle', { cx: '100', cy: '30', r: '6', class: 'illu__wheel' }),
      outline(58, 56, 84, 86),
      ...phone,
    );
    return root;
  }
  root.append(frontArrow(), outline(60, 36, 80, 106), windshield(60, 36, 80, 106), ...phone);
  return root;
}

/** The four wheel states with their glyphs. */
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

function wheelRect(x: number, y: number): SVGRectElement {
  return el('rect', {
    x: String(x - 7),
    y: String(y),
    width: '14',
    height: '26',
    rx: '5',
    class: 'illu__wheel',
  });
}

/** Wheelbase and track width shown on the vehicle as measure lines only —
 * no "L"/"W" letters (the step's own field labels next to the numbers
 * already say what each one is; the letters just repeated that). A
 * caravan has one axle, one track-width line; a motorhome has two
 * (trackWidthFrontMm and trackWidthRearMm are separate fields, so the
 * illustration shows one dashed line at each axle, not a single one
 * in between). */
export function measuresIllustration(
  label: string,
  vehicleType: VehicleType = 'motorhome',
): SVGSVGElement {
  const root = svg('0 0 200 160', label);
  if (vehicleType === 'caravan') {
    root.append(
      el('path', { d: 'M70 60 L100 30 L130 60', class: 'illu__drawbar' }),
      el('circle', { cx: '100', cy: '30', r: '7', class: 'illu__wheel' }),
      outline(55, 60, 90, 88),
      wheelRect(45, 120),
      // Mirrors the left wheel (45) about the 100 centre line, matching
      // where the dashed track-width line below actually ends (155) —
      // was 145, sitting asymmetrically inside the body outline (#184
      // follow-up: "högerdäcken ligger fel").
      wheelRect(155, 120),
      el('line', { x1: '100', y1: '30', x2: '100', y2: '133', class: 'illu__measure' }),
      el('line', {
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
    // Same right-wheel fix as the caravan branch above.
    wheelRect(155, 30),
    wheelRect(45, 116),
    wheelRect(155, 116),
    el('line', { x1: '100', y1: '43', x2: '100', y2: '129', class: 'illu__measure' }),
    // Front axle track width.
    el('line', {
      x1: '45',
      y1: '43',
      x2: '155',
      y2: '43',
      class: 'illu__measure illu__measure--dash',
    }),
    // Rear axle track width.
    el('line', {
      x1: '45',
      y1: '129',
      x2: '155',
      y2: '129',
      class: 'illu__measure illu__measure--dash',
    }),
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
