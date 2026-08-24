/**
 * Top-down RV diagram — the hero of the screen.
 *
 * Classic: an RV outline seen from above with a "Front" arrow and one
 * marker per wheel, the wheel carrying its own step/lift text right on
 * the SVG. Wheels are green when they need no lift; wheels that need
 * raising are orange (a step reaches) or red (beyond the tallest step).
 *
 * Modern (#106, appearance preset from #104): a redrawn two-tone
 * silhouette (cab/roof inset, mirrors, roof hatch, rear hatch, awning,
 * a dashed crosshair through the bubble — from the Claude Design
 * handoff, `RvDiagramNy`), with the wheels reduced to a glyph-only
 * marker and the step/lift text moved into floating "wheel cards"
 * (HTML, not SVG) positioned over the diagram — see `buildWheelCard`.
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
  if (severity === 'none' || stepMm <= 0) {
    return { step: '', stepHeight: '', lift: formatLength(displayMm, unit) };
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
  return appearance === 'modern' ? createModernDiagram(rearAxle) : createClassicDiagram(rearAxle);
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
      rx: '9',
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

  // Front arrow.
  const arrow = svgEl('path', {
    d: 'M120 8 L110 26 L117 26 L117 40 L123 40 L123 26 L130 26 Z',
    class: 'rv-diagram__arrow',
  });
  const arrowLabel = svgEl('text', { x: '120', y: '58', class: 'rv-diagram__front-label' });
  arrowLabel.textContent = t('diagram.front');

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

const MODERN_WHEEL_POS: Record<WheelId, { x: number; y: number }> = {
  frontLeft: { x: 46, y: 116 },
  frontRight: { x: 214, y: 116 },
  rearLeft: { x: 46, y: 250 },
  rearRight: { x: 214, y: 250 },
};
const MODERN_VIEWBOX = { width: 260, height: 320 };
const MODERN_BUBBLE_CENTER = { x: 130, y: 198 };
const MODERN_BUBBLE_TRAVEL = 28;
const MODERN_BUBBLE_FULL_SCALE_DEG = 5;

/** Same 32×56 footprint per wheel; a boggie pair splits it into two
 * shorter rects, mirroring the classic `wheelMarkers` proportions. */
function modernWheelMarkers(x: number, y: number, pair: boolean): SVGRectElement[] {
  const rect = (top: number, height: number) =>
    svgEl('rect', {
      x: String(x - 16),
      y: String(top),
      width: '32',
      height: String(height),
      rx: pair ? '10' : '11',
      class: 'rv-diagram__wheel',
    });
  return pair ? [rect(y - 28, 26), rect(y + 2, 26)] : [rect(y - 28, 56)];
}

interface ModernWheelRefs {
  markers: SVGRectElement[];
  glyph: SVGTextElement;
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
  const marker = document.createElement('div');
  marker.className = 'wheel-card__marker';
  const markerGlyph = document.createElement('span');
  marker.append(markerGlyph);
  const text = document.createElement('div');
  text.className = 'wheel-card__text';
  const label = document.createElement('div');
  label.className = 'wheel-card__label';
  label.textContent = t(WHEEL_LABEL[id]);
  const step = document.createElement('div');
  step.className = 'wheel-card__step';
  const mm = document.createElement('div');
  mm.className = 'wheel-card__mm';
  text.append(label, step, mm);
  card.append(marker, text);
  return { card, markerGlyph, step, mm };
}

function createModernDiagram(rearAxle: AxleConfig): RvDiagram {
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
  const arrowLabel = svgEl('text', { x: '130', y: '62', class: 'rv-diagram__front-label' });
  arrowLabel.textContent = t('diagram.front');

  // Mirrors.
  const mirrorLeft = svgEl('rect', {
    x: '52',
    y: '92',
    width: '12',
    height: '18',
    rx: '4',
    class: 'rv-diagram__trim',
  });
  const mirrorRight = svgEl('rect', {
    x: '196',
    y: '92',
    width: '12',
    height: '18',
    rx: '4',
    class: 'rv-diagram__trim',
  });

  // Two-tone body: outer shell, then an inset "roof" panel on top.
  const body = svgEl('rect', {
    x: '62',
    y: '74',
    width: '136',
    height: '224',
    rx: '34',
    class: 'rv-diagram__body',
  });
  const roof = svgEl('rect', {
    x: '74',
    y: '92',
    width: '112',
    height: '192',
    rx: '24',
    class: 'rv-diagram__roof',
  });
  const windshield = svgEl('path', {
    d: 'M78 96 Q130 78 182 96 L175 118 Q130 104 85 118 Z',
    class: 'rv-diagram__windshield',
  });

  // Roof hatch (skylight) and a rear hatch — panel-filled, outlined.
  const roofHatch = svgEl('rect', {
    x: '106',
    y: '138',
    width: '48',
    height: '34',
    rx: '6',
    class: 'rv-diagram__hatch',
  });
  const rearHatch = svgEl('rect', {
    x: '112',
    y: '250',
    width: '36',
    height: '24',
    rx: '5',
    class: 'rv-diagram__hatch',
  });
  const awning = svgEl('rect', {
    x: '176',
    y: '196',
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
    y1: '150',
    x2: '130',
    y2: '246',
    class: 'rv-diagram__crosshair',
  });
  const crosshairH = svgEl('line', {
    x1: '82',
    y1: '198',
    x2: '178',
    y2: '198',
    class: 'rv-diagram__crosshair',
  });

  svg.append(
    arrow,
    arrowLabel,
    mirrorLeft,
    mirrorRight,
    body,
    roof,
    windshield,
    roofHatch,
    rearHatch,
    awning,
    crosshairV,
    crosshairH,
  );

  const wheels = {} as Record<WheelId, ModernWheelRefs>;
  const cardLayer = document.createElement('div');
  cardLayer.className = 'wheel-card-layer';
  for (const id of WHEEL_IDS) {
    const { x, y } = MODERN_WHEEL_POS[id];
    const markers = modernWheelMarkers(x, y, rearAxle === 'boggie' && id.startsWith('rear'));
    const glyph = svgEl('text', {
      x: String(x),
      y: String(y + 8),
      class: 'rv-diagram__wheel-glyph rv-diagram__wheel-glyph--modern',
    });
    svg.append(...markers, glyph);

    const side = id.endsWith('Left') ? 'left' : 'right';
    const { card, markerGlyph, step, mm } = buildWheelCard(id, side);
    card.style.top = `${(y / MODERN_VIEWBOX.height) * 100}%`;
    cardLayer.append(card);

    wheels[id] = {
      markers,
      glyph,
      card,
      cardMarkerGlyph: markerGlyph,
      cardStep: step,
      cardMm: mm,
    };
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
        for (const marker of refs.markers)
          marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        const glyphChar = SEVERITY_GLYPH[severity];
        refs.glyph.textContent = glyphChar;
        refs.cardMarkerGlyph.textContent = glyphChar;
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
