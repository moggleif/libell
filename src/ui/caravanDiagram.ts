/**
 * Top-down caravan diagram (#72, ADR 0008): drawbar and jockey wheel at
 * the front, one axle pair, the bubble level in the middle. Follows the
 * appearance like the motorhome diagram does (#368):
 *
 * Classic (and Glossy): shares the `.rv-diagram` styles and the
 * wheel/label conventions with the motorhome's Classic drawing — step
 * name above an axle wheel, its lift below. The jockey wheel shows its
 * crank direction as a glyph, with the action and the amount beside it.
 *
 * Modern: a caravan silhouette in the motorhome's Modern style, with the
 * same floating wheel cards — one per axle side in the margins, and one
 * for the jockey wheel centred on the drawbar where the wheel is.
 */
import type { CaravanDisplayResult } from '../domain/caravan';
import { formatLength, type AppearanceSetting, type AxleConfig } from '../domain/settings';
import {
  buildWheelCard,
  SEVERITY_GLYPH,
  stepAndLiftText,
  updateBubble,
  wheelMarkers,
} from './rvDiagram';
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
  /** One rect for a single wheel, two for a tandem pair (ADR 0009). */
  markers: SVGRectElement[];
  glyph: SVGTextElement;
  stepLabel: SVGTextElement;
  liftLabel: SVGTextElement;
}

/** Same proportions as the motorhome's Classic drawing, and declared here
 * for the same reason — see `CLASSIC_VIEWBOX` in `rvDiagram.ts` (#241). */
const CARAVAN_VIEWBOX = { width: 240, height: 310 };

export function createCaravanDiagram(
  axleConfig: AxleConfig = 'single',
  appearance: AppearanceSetting = 'classic',
): CaravanDiagram {
  return appearance === 'modern' ? createModernCaravan() : createClassicCaravan(axleConfig);
}

function createClassicCaravan(axleConfig: AxleConfig): CaravanDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram';
  container.style.setProperty(
    '--diagram-aspect',
    String(CARAVAN_VIEWBOX.width / CARAVAN_VIEWBOX.height),
  );

  const svg = svgEl('svg', {
    viewBox: `0 0 ${CARAVAN_VIEWBOX.width} ${CARAVAN_VIEWBOX.height}`,
    role: 'img',
    'aria-label': t('diagram.caravan.aria'),
  });

  // Front arrow above the coupling — shape only, no text label (#161 follow-up).
  const arrow = svgEl('path', {
    d: 'M120 6 L110 24 L117 24 L117 36 L123 36 L123 24 L130 24 Z',
    class: 'rv-diagram__arrow',
  });

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
  svg.append(arrow, drawbar, body);

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
  // beside the drawbar is empty, and above collides with the front arrow.
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
    const markers = wheelMarkers(x, AXLE.y, axleConfig === 'boggie');
    const stepLabel = svgEl('text', {
      x: String(x),
      y: String(AXLE.y - 34),
      'text-anchor': 'middle',
      class: 'rv-diagram__step-label',
    });
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
    svg.append(...markers, glyph, stepLabel, liftLabel);
    axle[side] = { markers, glyph, stepLabel, liftLabel };
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
  // Starts in its dial rather than at the SVG origin — see the Classic
  // bubble in rvDiagram.ts for why (#244).
  const bubble = svgEl('circle', {
    r: '8',
    cx: String(BUBBLE_CENTER.x),
    cy: String(BUBBLE_CENTER.y),
    class: 'rv-diagram__bubble',
  });
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
        // A tandem pair shares one severity — both wheels get equal steps.
        for (const marker of refs.markers)
          marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
        refs.glyph.textContent = SEVERITY_GLYPH[severity];
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        refs.stepLabel.textContent = text.step;
        refs.liftLabel.textContent = severity === 'none' ? '' : text.lift;
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

      updateBubble(
        bubble,
        result,
        BUBBLE_CENTER,
        BUBBLE_TRAVEL,
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
// Modern (#368) — caravan silhouette, wheel cards.
// ============================================================

const MODERN_CARAVAN_VIEWBOX = { width: 260, height: 440 };
const MODERN_BUBBLE_CENTER = { x: 130, y: 300 };
const MODERN_BUBBLE_TRAVEL = 28;
/** Card anchor heights, in the drawing's own coordinates: the jockey card
 * sits on the drawbar where the jockey wheel is, clear of the front arrow
 * above it and the body below; the axle cards sit level with the axle,
 * a little behind the middle of the body as on a real caravan. */
const MODERN_JOCKEY_Y = 118;
const MODERN_AXLE_Y = 318;

function createModernCaravan(): CaravanDiagram {
  const container = document.createElement('div');
  container.className = 'rv-diagram rv-diagram--modern';
  container.style.setProperty(
    '--diagram-aspect',
    String(MODERN_CARAVAN_VIEWBOX.width / MODERN_CARAVAN_VIEWBOX.height),
  );

  const stage = document.createElement('div');
  stage.className = 'rv-diagram__stage';

  const svg = svgEl('svg', {
    viewBox: `0 0 ${MODERN_CARAVAN_VIEWBOX.width} ${MODERN_CARAVAN_VIEWBOX.height}`,
    role: 'img',
    'aria-label': t('diagram.caravan.aria'),
  });

  // Same arrow as the Modern motorhome.
  const arrow = svgEl('path', {
    d: 'M130 6 L118 28 L126 28 L126 44 L134 44 L134 28 L142 28 Z',
    class: 'rv-diagram__arrow',
  });
  // A-frame drawbar converging on the coupling; the jockey card covers
  // the point where the jockey wheel sits on it.
  const drawbar = svgEl('path', {
    d: 'M88 190 L130 70 L172 190',
    class: 'rv-diagram__drawbar',
  });
  const coupling = svgEl('circle', { cx: '130', cy: '66', r: '7', class: 'rv-diagram__trim' });

  // Two-tone body like the motorhome's box: shell, then an inset roof.
  // No cab — the drawbar is the caravan's front.
  const body = svgEl('rect', {
    x: '62',
    y: '176',
    width: '136',
    height: '244',
    rx: '34',
    class: 'rv-diagram__body',
  });
  const roof = svgEl('rect', {
    x: '74',
    y: '194',
    width: '112',
    height: '208',
    rx: '24',
    class: 'rv-diagram__roof',
  });
  // Front window band and a window strip along each side.
  const frontWindow = svgEl('rect', {
    x: '96',
    y: '180',
    width: '68',
    height: '8',
    rx: '4',
    class: 'rv-diagram__trim',
  });
  const windowLeft = svgEl('rect', {
    x: '68',
    y: '222',
    width: '6',
    height: '156',
    rx: '3',
    class: 'rv-diagram__trim',
  });
  const windowRight = svgEl('rect', {
    x: '186',
    y: '222',
    width: '6',
    height: '156',
    rx: '3',
    class: 'rv-diagram__trim',
  });
  // Roof skylight ahead of the bubble, a smaller vent behind it.
  const skylight = svgEl('rect', {
    x: '108',
    y: '212',
    width: '44',
    height: '30',
    rx: '6',
    class: 'rv-diagram__hatch',
  });
  const vent = svgEl('rect', {
    x: '116',
    y: '366',
    width: '28',
    height: '22',
    rx: '5',
    class: 'rv-diagram__hatch',
  });
  const crosshairV = svgEl('line', {
    x1: '130',
    y1: '248',
    x2: '130',
    y2: '358',
    class: 'rv-diagram__crosshair',
  });
  const crosshairH = svgEl('line', {
    x1: '82',
    y1: String(MODERN_BUBBLE_CENTER.y),
    x2: '178',
    y2: String(MODERN_BUBBLE_CENTER.y),
    class: 'rv-diagram__crosshair',
  });
  svg.append(
    arrow,
    drawbar,
    coupling,
    body,
    roof,
    frontWindow,
    windowLeft,
    windowRight,
    skylight,
    vent,
    crosshairV,
    crosshairH,
  );

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
  const bubble = svgEl('circle', {
    r: '10',
    cx: String(MODERN_BUBBLE_CENTER.x),
    cy: String(MODERN_BUBBLE_CENTER.y),
    class: 'rv-diagram__bubble',
  });
  svg.append(dial, ring, bubble);

  // Cards are placed exactly as the motorhome's (see createModernDiagram
  // in rvDiagram.ts, #241): vertically from the centre of the drawn area.
  const cardLayer = document.createElement('div');
  cardLayer.className = 'wheel-card-layer';
  const place = (card: HTMLDivElement, y: number) => {
    const offsetFromCentre = y / MODERN_CARAVAN_VIEWBOX.height - 0.5;
    card.style.top = `calc(50% + (${offsetFromCentre.toFixed(6)} * var(--drawn-height)))`;
    card.dataset.wheelY = String(y);
    cardLayer.append(card);
  };

  const jockey = buildWheelCard(t('caravan.jockeyWheel'), 'center');
  place(jockey.card, MODERN_JOCKEY_Y);
  const axle = {
    left: buildWheelCard(t('caravan.axleLeft'), 'left'),
    right: buildWheelCard(t('caravan.axleRight'), 'right'),
  };
  place(axle.left.card, MODERN_AXLE_Y);
  place(axle.right.card, MODERN_AXLE_Y);

  stage.append(svg, cardLayer);
  container.append(stage);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let bx = MODERN_BUBBLE_CENTER.x;
  let by = MODERN_BUBBLE_CENTER.y;

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const side of ['left', 'right'] as const) {
        const { displayMm, stepMm, severity } = result.axle[side];
        const refs = axle[side];
        refs.markerGlyph.textContent = SEVERITY_GLYPH[severity];
        refs.card.className = `wheel-card wheel-card--${side} wheel-card--${severity}`;
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        refs.step.textContent = severity === 'none' ? t('diagram.done') : text.step;
        refs.mm.textContent = text.lift;
      }

      // The jockey is bidirectional: never "red" — any amount is crankable.
      const { direction, displayMm } = result.jockey;
      jockey.markerGlyph.textContent = JOCKEY_GLYPH[direction];
      jockey.card.className = `wheel-card wheel-card--center wheel-card--${
        direction === 'ok' ? 'none' : 'small'
      }`;
      jockey.step.textContent =
        direction === 'ok'
          ? t('diagram.done')
          : t(direction === 'up' ? 'caravan.crankUp' : 'caravan.crankDown');
      jockey.mm.textContent = formatLength(displayMm, unit);

      updateBubble(
        bubble,
        result,
        MODERN_BUBBLE_CENTER,
        MODERN_BUBBLE_TRAVEL,
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
