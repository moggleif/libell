/**
 * Top-down RV diagram — the hero of the screen.
 *
 * Classic: an RV outline seen from above with a front-pointing arrow (no
 * text label — the shape alone says "this end is the front") and one
 * marker per wheel, the wheel carrying its own step/lift text right on
 * the SVG. Wheels are green when they need no lift; wheels that need
 * raising are orange (a step reaches) or red (beyond the tallest step).
 *
 * Modern (#106, appearance preset from #104; reshaped in a follow-up
 * discussion after #161): a redrawn two-tone silhouette — a narrower cab
 * up front widening into the box body, roof inset, mirrors, side window
 * strips, roof hatch, rear hatch, awning, a dashed crosshair through the
 * bubble — with per-wheel status shown only in the floating "wheel cards"
 * (HTML, not SVG) positioned over the diagram, see `buildWheelCard`; the
 * SVG itself carries no per-wheel marker at all, so the silhouette stays
 * clean. A card's position on screen already says which wheel it is, so
 * the card carries no visible position text either — only an aria-label,
 * for anyone not reading the layout visually (screen-cleanup follow-up).
 * Both variants share one severity→color/glyph vocabulary and the same
 * bubble-level physics; only the geometry and where the text lives differ.
 */
import { WHEEL_IDS, type WheelId } from '../domain/leveling';
import type { DisplayResult } from '../domain/stability';
import { formatLength, type AppearanceSetting, type AxleConfig } from '../domain/settings';
import { t, type MessageKey } from './i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Shape per state so color is never the only signal (WCAG 1.4.1).
 * Exported: onboarding's Modern legend (#110) reuses it instead of
 * duplicating the glyph set. */
export const SEVERITY_GLYPH = { none: '✓', small: '↑', large: '✕', unserved: '–' } as const;

const WHEEL_LABEL: Record<WheelId, MessageKey> = {
  frontLeft: 'diagram.wheel.frontLeft',
  frontRight: 'diagram.wheel.frontRight',
  rearLeft: 'diagram.wheel.rearLeft',
  rearRight: 'diagram.wheel.rearRight',
};

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

/** Step/lift text for one wheel — shared by the classic on-SVG labels
 * and the modern wheel cards, so both read the same plan the same way. */
function stepAndLiftText(
  severity: DisplayResult['wheels'][WheelId]['severity'],
  stepMm: number,
  displayMm: number,
  unit: 'mm' | 'cm',
  stepHeightsMm: number[],
): { step: string; stepHeight: string; lift: string } {
  if (severity === 'none') {
    return { step: '', stepHeight: '', lift: formatLength(displayMm, unit) };
  }
  if (stepMm <= 0) {
    // Unserved (gray, ADR 0011): low, but no ramp reaches this wheel —
    // say so instead of leaving the step line blank (screen-cleanup
    // follow-up).
    return { step: t('diagram.noRamp'), stepHeight: '', lift: formatLength(displayMm, unit) };
  }
  const stepNumber = stepHeightsMm.indexOf(stepMm) + 1;
  return {
    step: stepNumber > 0 ? t('diagram.step', { n: stepNumber }) : `↑ ${formatLength(stepMm, unit)}`,
    stepHeight: stepNumber > 0 ? `(${formatLength(stepMm, unit)})` : '',
    lift: formatLength(displayMm, unit),
  };
}

export interface RvDiagram {
  element: HTMLElement;
  update(result: DisplayResult, unit: 'mm' | 'cm', stepHeightsMm: number[]): void;
}

export function createRvDiagram(
  rearAxle: AxleConfig = 'single',
  appearance: AppearanceSetting = 'classic',
): RvDiagram {
  return appearance === 'modern' ? createModernDiagram() : createClassicDiagram(rearAxle);
}

/** Shared bubble-level physics: lerp toward the high side, snap under
 * reduced motion, flip to the "level" fill when settled there. */
function updateBubble(
  bubble: SVGCircleElement,
  result: DisplayResult,
  center: { x: number; y: number },
  travel: number,
  fullScaleDeg: number,
  reduceMotion: MediaQueryList,
  state: { get(): { x: number; y: number }; set(x: number, y: number): void },
): void {
  const targetX = center.x + Math.max(-1, Math.min(1, result.rollDeg / fullScaleDeg)) * travel;
  const targetY = center.y + Math.max(-1, Math.min(1, result.pitchDeg / fullScaleDeg)) * travel;
  const current = state.get();
  const x = reduceMotion.matches ? targetX : current.x + (targetX - current.x) * 0.3;
  const y = reduceMotion.matches ? targetY : current.y + (targetY - current.y) * 0.3;
  state.set(x, y);
  bubble.setAttribute('cx', x.toFixed(2));
  bubble.setAttribute('cy', y.toFixed(2));
  bubble.setAttribute(
    'class',
    result.isLevel ? 'rv-diagram__bubble rv-diagram__bubble--level' : 'rv-diagram__bubble',
  );
}

// ============================================================
// Classic — unchanged from before #106.
// ============================================================

interface ClassicWheelRefs {
  /** One rect for a single wheel, two for a boggie pair (ADR 0009). */
  markers: SVGRectElement[];
  glyph: SVGTextElement;
  stepName: SVGTSpanElement;
  stepHeight: SVGTSpanElement;
  liftLabel: SVGTextElement;
}

const CLASSIC_WHEEL_POS: Record<WheelId, { x: number; y: number }> = {
  frontLeft: { x: 46, y: 96 },
  frontRight: { x: 194, y: 96 },
  rearLeft: { x: 46, y: 244 },
  rearRight: { x: 194, y: 244 },
};

const CLASSIC_BUBBLE_CENTER = { x: 120, y: 172 };
const CLASSIC_BUBBLE_TRAVEL = 22;
/** Degrees of tilt that push the bubble to the edge of its travel. */
const BUBBLE_FULL_SCALE_DEG = 5;

/**
 * Wheel marker(s) within the same 28×48 footprint: a single wheel is one
 * rect; a boggie pair is two shorter rects with a gap — same outer
 * bounds, so glyphs and labels keep their positions.
 */
export function wheelMarkers(x: number, y: number, pair: boolean): SVGRectElement[] {
  const rect = (top: number, height: number) =>
    svgEl('rect', {
      x: String(x - 14),
      y: String(top),
      width: '28',
      height: String(height),
      rx: '1',
      class: 'rv-diagram__wheel',
    });
  return pair ? [rect(y - 24, 22), rect(y + 2, 22)] : [rect(y - 24, 48)];
}

function createClassicDiagram(rearAxle: AxleConfig): RvDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram';

  const svg = svgEl('svg', {
    viewBox: '0 0 240 310',
    role: 'img',
    'aria-label': t('diagram.aria'),
  });

  // Front arrow — the shape alone says "front", no text label (#161 follow-up).
  const arrow = svgEl('path', {
    d: 'M120 8 L110 26 L117 26 L117 40 L123 40 L123 26 L130 26 Z',
    class: 'rv-diagram__arrow',
  });

  // RV body: a plain rectangular outline — Classic's "unstyled HTML"
  // square-cornered counterpart to Modern's heavily rounded silhouette
  // (rx: 28, buildModernDiagram below).
  const body = svgEl('rect', {
    x: '58',
    y: '72',
    width: '124',
    height: '196',
    rx: '2',
    class: 'rv-diagram__body',
  });
  const windshield = svgEl('path', {
    d: 'M74 92 Q120 76 166 92 L160 110 Q120 100 80 110 Z',
    class: 'rv-diagram__windshield',
  });

  svg.append(arrow, body, windshield);

  const wheels = {} as Record<WheelId, ClassicWheelRefs>;
  for (const id of WHEEL_IDS) {
    const { x, y } = CLASSIC_WHEEL_POS[id];
    const markers = wheelMarkers(x, y, rearAxle === 'boggie' && id.startsWith('rear'));
    // Above the wheel, two lines: which ramp step to drive up onto, then
    // its height parenthesized and small. Below the wheel: the lift.
    const stepLabel = svgEl('text', {
      'text-anchor': 'middle',
      class: 'rv-diagram__step-label',
    });
    const stepName = svgEl('tspan', { x: String(x), y: String(y - 48) });
    const stepHeight = svgEl('tspan', {
      x: String(x),
      y: String(y - 32),
      class: 'rv-diagram__mm',
    });
    stepLabel.append(stepName, stepHeight);
    const liftLabel = svgEl('text', {
      x: String(x),
      y: String(y + 42),
      'text-anchor': 'middle',
      class: 'rv-diagram__lift-label',
    });
    const glyph = svgEl('text', {
      x: String(x),
      y: String(y + 7),
      class: 'rv-diagram__wheel-glyph',
    });
    svg.append(...markers, glyph, stepLabel, liftLabel);
    wheels[id] = { markers, glyph, stepName, stepHeight, liftLabel };
  }

  // Bubble level in the middle of the vehicle.
  const dial = svgEl('circle', {
    cx: String(CLASSIC_BUBBLE_CENTER.x),
    cy: String(CLASSIC_BUBBLE_CENTER.y),
    r: '34',
    class: 'rv-diagram__bubble-dial',
  });
  const ring = svgEl('circle', {
    cx: String(CLASSIC_BUBBLE_CENTER.x),
    cy: String(CLASSIC_BUBBLE_CENTER.y),
    r: '11',
    class: 'rv-diagram__bubble-ring',
  });
  const bubble = svgEl('circle', { r: '8', class: 'rv-diagram__bubble' });
  svg.append(dial, ring, bubble);

  container.append(svg);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let bx = CLASSIC_BUBBLE_CENTER.x;
  let by = CLASSIC_BUBBLE_CENTER.y;

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const id of WHEEL_IDS) {
        // Values arrive hysteresis-stabilized — a still phone shows a
        // still diagram.
        const { displayMm, stepMm, severity } = result.wheels[id];
        const { markers, glyph, stepName, stepHeight, liftLabel } = wheels[id];
        // A boggie pair shares one severity — both wheels get equal steps.
        for (const marker of markers)
          marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        glyph.textContent = SEVERITY_GLYPH[severity];
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        stepName.textContent = text.step;
        stepHeight.textContent = text.stepHeight;
        liftLabel.textContent = severity === 'none' ? '' : text.lift;
        // An unserved wheel (low, but no ramp left for it — ADR 0011) is
        // toned down: it asks for no action, so it must not shout.
        liftLabel.setAttribute(
          'class',
          severity === 'unserved'
            ? 'rv-diagram__lift-label rv-diagram__lift-label--dim'
            : 'rv-diagram__lift-label',
        );
      }
      updateBubble(
        bubble,
        result,
        CLASSIC_BUBBLE_CENTER,
        CLASSIC_BUBBLE_TRAVEL,
        BUBBLE_FULL_SCALE_DEG,
        reduceMotion,
        {
          get: () => ({ x: bx, y: by }),
          set: (x, y) => {
            bx = x;
            by = y;
          },
        },
      );
    },
  };
}

// ============================================================
// Modern (#106) — redrawn silhouette, wheel cards.
// ============================================================

/** Card anchor point per wheel — the SVG itself carries no per-wheel
 * marker, so only the vertical position (for `card.style.top`) matters.
 * Front sits well clear of the cab (which ends at y=124) so the card
 * never overlaps it; rear mirrors the same distance from the box's
 * bottom edge. */
const MODERN_WHEEL_Y: Record<WheelId, number> = {
  frontLeft: 165,
  frontRight: 165,
  rearLeft: 318,
  rearRight: 318,
};
const MODERN_VIEWBOX = { width: 260, height: 420 };
const MODERN_BUBBLE_CENTER = { x: 130, y: 236 };
const MODERN_BUBBLE_TRAVEL = 28;
const MODERN_BUBBLE_FULL_SCALE_DEG = 5;

interface ModernWheelRefs {
  card: HTMLDivElement;
  cardMarkerGlyph: HTMLSpanElement;
  cardStep: HTMLDivElement;
  cardMm: HTMLDivElement;
}

function buildWheelCard(
  id: WheelId,
  side: 'left' | 'right',
): {
  card: HTMLDivElement;
  markerGlyph: HTMLSpanElement;
  step: HTMLDivElement;
  mm: HTMLDivElement;
} {
  const card = document.createElement('div');
  card.className = `wheel-card wheel-card--${side}`;
  // No visible position text (#161 follow-up): the card's position over
  // the silhouette already says which wheel it is. The name still reaches
  // anyone not reading the layout visually, via aria-label.
  card.setAttribute('aria-label', t(WHEEL_LABEL[id]));
  const marker = document.createElement('div');
  marker.className = 'wheel-card__marker';
  const markerGlyph = document.createElement('span');
  marker.append(markerGlyph);
  const text = document.createElement('div');
  text.className = 'wheel-card__text';
  const step = document.createElement('div');
  step.className = 'wheel-card__step';
  const mm = document.createElement('div');
  mm.className = 'wheel-card__mm';
  text.append(step, mm);
  card.append(marker, text);
  return { card, markerGlyph, step, mm };
}

function createModernDiagram(): RvDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram rv-diagram--modern';

  const stage = document.createElement('div');
  stage.className = 'rv-diagram__stage';

  const svg = svgEl('svg', {
    viewBox: `0 0 ${MODERN_VIEWBOX.width} ${MODERN_VIEWBOX.height}`,
    role: 'img',
    'aria-label': t('diagram.aria'),
  });

  const arrow = svgEl('path', {
    d: 'M130 6 L118 28 L126 28 L126 44 L134 44 L134 28 L142 28 Z',
    class: 'rv-diagram__arrow',
  });

  // Cab: a narrower rounded nose up front, widening into the box body
  // below it — same fill/stroke class as the box, overlapping it
  // seamlessly, so the two read as one silhouette. This narrow-cab/
  // wide-box shape is the strongest "motorhome" cue there is — stronger
  // than the wheels it replaces. Widened from the original 80 to read
  // less stubby against the box (small-adjustments follow-up).
  const cab = svgEl('rect', {
    x: '80',
    y: '74',
    width: '100',
    height: '60',
    rx: '28',
    class: 'rv-diagram__body',
  });

  // Mirrors sit right at the front corners, level with the windshield,
  // overlapping the cab edge by a couple of units so they read as
  // mounted onto it rather than floating beside it (small-adjustments
  // follow-up). Sized down 30% from the original 14×18.
  const mirrorLeft = svgEl('rect', {
    x: '72',
    y: '85',
    width: '10',
    height: '13',
    rx: '4',
    class: 'rv-diagram__trim',
  });
  const mirrorRight = svgEl('rect', {
    x: '178',
    y: '85',
    width: '10',
    height: '13',
    rx: '4',
    class: 'rv-diagram__trim',
  });

  // Two-tone box body: outer shell, then an inset "roof" panel on top.
  // Longer than the cab by design (#161 follow-up: a motorhome reads as
  // a long box behind a short cab, not a stubby capsule).
  const body = svgEl('rect', {
    x: '62',
    y: '106',
    width: '136',
    height: '288',
    rx: '28',
    class: 'rv-diagram__body',
  });
  const roof = svgEl('rect', {
    x: '74',
    y: '141',
    width: '112',
    height: '232',
    rx: '20',
    class: 'rv-diagram__roof',
  });
  const windshield = svgEl('path', {
    d: 'M88 92 Q130 78 172 92 L166 122 Q130 110 94 122 Z',
    class: 'rv-diagram__windshield',
  });

  // A thin window band along each side of the box — a second, subtler
  // "this is a coachbuilt vehicle" cue, now that the wheels no longer
  // carry that weight.
  const windowLeft = svgEl('rect', {
    x: '68',
    y: '160',
    width: '6',
    height: '190',
    rx: '3',
    class: 'rv-diagram__trim',
  });
  const windowRight = svgEl('rect', {
    x: '186',
    y: '160',
    width: '6',
    height: '190',
    rx: '3',
    class: 'rv-diagram__trim',
  });

  // Roof hatch (skylight) and a rear hatch — panel-filled, outlined.
  const roofHatch = svgEl('rect', {
    x: '106',
    y: '172',
    width: '48',
    height: '34',
    rx: '6',
    class: 'rv-diagram__hatch',
  });
  const rearHatch = svgEl('rect', {
    x: '112',
    y: '318',
    width: '36',
    height: '24',
    rx: '5',
    class: 'rv-diagram__hatch',
  });
  const awning = svgEl('rect', {
    x: '176',
    y: '234',
    width: '8',
    height: '40',
    rx: '4',
    class: 'rv-diagram__trim',
  });

  // A dashed crosshair through the bubble — a measuring-instrument
  // touch (from the Claude Design handoff) that reads as "level", not
  // as an attempt at a photo.
  const crosshairV = svgEl('line', {
    x1: '130',
    y1: '160',
    x2: '130',
    y2: '312',
    class: 'rv-diagram__crosshair',
  });
  const crosshairH = svgEl('line', {
    x1: '82',
    y1: '236',
    x2: '178',
    y2: '236',
    class: 'rv-diagram__crosshair',
  });

  svg.append(
    arrow,
    cab,
    mirrorLeft,
    mirrorRight,
    body,
    roof,
    windshield,
    windowLeft,
    windowRight,
    roofHatch,
    rearHatch,
    awning,
    crosshairV,
    crosshairH,
  );

  // Per-wheel status lives entirely in the floating wheel cards — no
  // on-body marker. The old wheel-shaped rects behind the cards read as
  // leftover wheels and fought the silhouette (follow-up after #161).
  const wheels = {} as Record<WheelId, ModernWheelRefs>;
  const cardLayer = document.createElement('div');
  cardLayer.className = 'wheel-card-layer';
  for (const id of WHEEL_IDS) {
    const side = id.endsWith('Left') ? 'left' : 'right';
    const { card, markerGlyph, step, mm } = buildWheelCard(id, side);
    card.style.top = `${(MODERN_WHEEL_Y[id] / MODERN_VIEWBOX.height) * 100}%`;
    cardLayer.append(card);

    wheels[id] = { card, cardMarkerGlyph: markerGlyph, cardStep: step, cardMm: mm };
  }

  const dial = svgEl('circle', {
    cx: String(MODERN_BUBBLE_CENTER.x),
    cy: String(MODERN_BUBBLE_CENTER.y),
    r: '44',
    class: 'rv-diagram__bubble-dial',
  });
  const ring = svgEl('circle', {
    cx: String(MODERN_BUBBLE_CENTER.x),
    cy: String(MODERN_BUBBLE_CENTER.y),
    r: '13',
    class: 'rv-diagram__bubble-ring',
  });
  const bubble = svgEl('circle', { r: '10', class: 'rv-diagram__bubble' });
  svg.append(dial, ring, bubble);

  stage.append(svg, cardLayer);
  container.append(stage);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let bx = MODERN_BUBBLE_CENTER.x;
  let by = MODERN_BUBBLE_CENTER.y;

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const id of WHEEL_IDS) {
        const { displayMm, stepMm, severity } = result.wheels[id];
        const refs = wheels[id];
        refs.cardMarkerGlyph.textContent = SEVERITY_GLYPH[severity];
        refs.card.className = `wheel-card wheel-card--${
          id.endsWith('Left') ? 'left' : 'right'
        } wheel-card--${severity}`;
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        refs.cardStep.textContent = severity === 'none' ? t('diagram.done') : text.step;
        refs.cardMm.textContent = text.lift;
        refs.cardMm.classList.toggle('wheel-card__mm--dim', severity === 'unserved');
      }
      updateBubble(
        bubble,
        result,
        MODERN_BUBBLE_CENTER,
        MODERN_BUBBLE_TRAVEL,
        MODERN_BUBBLE_FULL_SCALE_DEG,
        reduceMotion,
        {
          get: () => ({ x: bx, y: by }),
          set: (x, y) => {
            bx = x;
            by = y;
          },
        },
      );
    },
  };
}
