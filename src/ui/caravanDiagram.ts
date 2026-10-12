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
import type { CaravanDisplayResult, JockeyDirection } from '../domain/caravan';
import { formatLength, type AppearanceSetting, type AxleConfig } from '../domain/settings';
import { t } from './i18n';
import { svgEl } from './svg';
import {
  CLASSIC_BUBBLE,
  MODERN_BUBBLE,
  SEVERITY_GLYPH,
  buildWheelCard,
  createBubbleLevel,
  createClassicWheel,
  crosshair,
  diagramContainer,
  diagramSvg,
  fillWheelCard,
  modernFrame,
  modernFrontArrow,
  path,
  placeWheelCard,
  rect,
  stepAndLiftText,
  type ClassicWheel,
  type WheelCard,
} from './diagramParts';

export interface CaravanDiagram {
  element: HTMLElement;
  update(result: CaravanDisplayResult, unit: 'mm' | 'cm', stepHeightsMm: number[]): void;
}

export function createCaravanDiagram(
  axleConfig: AxleConfig = 'single',
  appearance: AppearanceSetting = 'classic',
): CaravanDiagram {
  return appearance === 'modern' ? createModernCaravan() : createClassicCaravan(axleConfig);
}

const SIDES = ['left', 'right'] as const;
type Side = (typeof SIDES)[number];

const JOCKEY_GLYPH = { ok: '✓', up: '↑', down: '↓' } as const;

/** What to do with the jockey wheel's crank, or nothing once it is right. */
function crankText(direction: JockeyDirection): string {
  if (direction === 'ok') return '';
  return t(direction === 'up' ? 'caravan.crankUp' : 'caravan.crankDown');
}

/** The jockey is bidirectional: never "red" — any amount is crankable. */
function jockeySeverity(direction: JockeyDirection): 'none' | 'small' {
  return direction === 'ok' ? 'none' : 'small';
}

// ============================================================
// Classic (and Glossy)
// ============================================================

/** Same proportions as the motorhome's Classic drawing, and declared here
 * for the same reason — see `diagramContainer` (#241). */
const CLASSIC_VIEWBOX = { width: 240, height: 310 };
const CLASSIC_AXLE = { y: 214, leftX: 46, rightX: 194 };
const CLASSIC_JOCKEY = { x: 120, y: 84 };
const CLASSIC_BUBBLE_CENTER = { x: 120, y: 214 };

function createClassicCaravan(axleConfig: AxleConfig): CaravanDiagram {
  const container = diagramContainer(CLASSIC_VIEWBOX, 'rv-diagram');
  const svg = diagramSvg(CLASSIC_VIEWBOX, t('diagram.caravan.aria'));
  const jockey = createClassicJockey();
  const axle = classicAxle(axleConfig);
  const bubble = createBubbleLevel(CLASSIC_BUBBLE_CENTER, CLASSIC_BUBBLE);
  svg.append(...classicBody(), ...jockey.elements);
  for (const side of SIDES) svg.append(...axle[side].elements);
  svg.append(...bubble.elements);
  container.append(svg);

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const side of SIDES) axle[side].update(result.axle[side], unit, stepHeightsMm);
      jockey.update(result.jockey, unit);
      bubble.update(result);
    },
  };
}

/** A body with a drawbar converging on the coupling, under a front arrow
 * whose shape alone says "front" (#161 follow-up). */
function classicBody(): SVGElement[] {
  return [
    path('M120 6 L110 24 L117 24 L117 36 L123 36 L123 24 L130 24 Z', 'rv-diagram__arrow'),
    path('M74 132 L120 66 L166 132', 'rv-diagram__drawbar'),
    rect(58, 128, 124, 160, 22, 'rv-diagram__body'),
  ];
}

/** The axle wheels, with the motorhome's label conventions; a tandem axle
 * draws each side as a pair (ADR 0009). */
function classicAxle(axleConfig: AxleConfig): Record<Side, ClassicWheel> {
  const pair = axleConfig === 'boggie';
  return {
    left: createClassicWheel({ x: CLASSIC_AXLE.leftX, y: CLASSIC_AXLE.y }, pair),
    right: createClassicWheel({ x: CLASSIC_AXLE.rightX, y: CLASSIC_AXLE.y }, pair),
  };
}

/** The jockey wheel on the drawbar, its crank direction as the glyph.
 * The action and amount sit to its right: the area beside the drawbar is
 * empty, and above it collides with the front arrow. */
function createClassicJockey(): {
  elements: SVGElement[];
  update(jockey: CaravanDisplayResult['jockey'], unit: 'mm' | 'cm'): void;
} {
  const { x, y } = CLASSIC_JOCKEY;
  const marker = rect(x - 11, y - 18, 22, 36, 9, 'rv-diagram__wheel');
  const glyph = svgEl('text', { x: String(x), y: String(y + 6), class: 'rv-diagram__wheel-glyph' });
  const label = (labelY: number, className: string) =>
    svgEl('text', {
      x: String(x + 20),
      y: String(labelY),
      'text-anchor': 'start',
      class: className,
    });
  const action = label(y - 3, 'rv-diagram__step-label');
  const amount = label(y + 15, 'rv-diagram__lift-label');

  return {
    elements: [marker, glyph, action, amount],
    update({ direction, displayMm }, unit) {
      marker.setAttribute(
        'class',
        `rv-diagram__wheel rv-diagram__wheel--${jockeySeverity(direction)}`,
      );
      glyph.textContent = JOCKEY_GLYPH[direction];
      action.textContent = crankText(direction);
      amount.textContent = direction === 'ok' ? '' : formatLength(displayMm, unit);
    },
  };
}

// ============================================================
// Modern (#368) — caravan silhouette, wheel cards.
// ============================================================

const MODERN_VIEWBOX = { width: 260, height: 440 };
const MODERN_BUBBLE_CENTER = { x: 130, y: 300 };
/** Card anchor heights, in the drawing's own coordinates: the jockey card
 * sits on the drawbar where the jockey wheel is, clear of the front arrow
 * above it and the body below; the axle cards sit level with the axle,
 * a little behind the middle of the body as on a real caravan. */
const MODERN_JOCKEY_Y = 118;
const MODERN_AXLE_Y = 318;

function createModernCaravan(): CaravanDiagram {
  const { container, svg, cardLayer } = modernFrame(MODERN_VIEWBOX, t('diagram.caravan.aria'));
  const bubble = createBubbleLevel(MODERN_BUBBLE_CENTER, MODERN_BUBBLE);
  svg.append(...modernSilhouette(), ...bubble.elements);
  const jockey = buildWheelCard(t('caravan.jockeyWheel'), 'center');
  const axle: Record<Side, WheelCard> = {
    left: buildWheelCard(t('caravan.axleLeft'), 'left'),
    right: buildWheelCard(t('caravan.axleRight'), 'right'),
  };
  placeWheelCard(cardLayer, jockey.card, MODERN_JOCKEY_Y, MODERN_VIEWBOX);
  for (const side of SIDES)
    placeWheelCard(cardLayer, axle[side].card, MODERN_AXLE_Y, MODERN_VIEWBOX);

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const side of SIDES) {
        const { displayMm, stepMm, severity } = result.axle[side];
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        fillWheelCard(axle[side], side, severity, SEVERITY_GLYPH[severity], text);
      }
      const { direction, displayMm } = result.jockey;
      fillWheelCard(jockey, 'center', jockeySeverity(direction), JOCKEY_GLYPH[direction], {
        step: crankText(direction),
        lift: formatLength(displayMm, unit),
      });
      bubble.update(result);
    },
  };
}

/** A caravan in the motorhome's Modern style: an A-frame drawbar with the
 * jockey card covering where the jockey wheel sits on it, and a two-tone
 * body with no cab — the drawbar is the caravan's front. */
function modernSilhouette(): SVGElement[] {
  return [
    modernFrontArrow(),
    path('M88 190 L130 70 L172 190', 'rv-diagram__drawbar'),
    svgEl('circle', { cx: '130', cy: '66', r: '7', class: 'rv-diagram__trim' }),
    // Shell, then an inset roof.
    rect(62, 176, 136, 244, 34, 'rv-diagram__body'),
    rect(74, 194, 112, 208, 24, 'rv-diagram__roof'),
    // Front window band and a window strip along each side.
    rect(96, 180, 68, 8, 4, 'rv-diagram__trim'),
    rect(68, 222, 6, 156, 3, 'rv-diagram__trim'),
    rect(186, 222, 6, 156, 3, 'rv-diagram__trim'),
    // Roof skylight ahead of the bubble, a smaller vent behind it.
    rect(108, 212, 44, 30, 6, 'rv-diagram__hatch'),
    rect(116, 366, 28, 22, 5, 'rv-diagram__hatch'),
    crosshair(130, 248, 130, 358),
    crosshair(82, MODERN_BUBBLE_CENTER.y, 178, MODERN_BUBBLE_CENTER.y),
  ];
}
