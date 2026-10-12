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
 * (HTML, not SVG) positioned over the diagram, see `buildWheelCard` in
 * `diagramParts.ts`; the SVG itself carries no per-wheel marker at all, so
 * the silhouette stays clean. A card's position on screen already says which wheel it is, so
 * the card carries no visible position text either — only an aria-label,
 * for anyone not reading the layout visually (screen-cleanup follow-up).
 * Both variants share one severity→color/glyph vocabulary and the same
 * bubble-level physics; only the geometry and where the text lives differ.
 */
import { WHEEL_IDS, type WheelId } from '../domain/leveling';
import type { DisplayResult } from '../domain/stability';
import type { AppearanceSetting, AxleConfig } from '../domain/settings';
import { t, type MessageKey } from './i18n';
import {
  CLASSIC_BUBBLE,
  MODERN_BUBBLE,
  SEVERITY_GLYPH,
  createBubbleLevel,
  createClassicWheel,
  crosshair,
  diagramContainer,
  diagramSvg,
  buildWheelCard,
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

export { SEVERITY_GLYPH, stepAndLiftText, updateBubble } from './diagramParts';

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

// ============================================================
// Classic — unchanged from before #106.
// ============================================================

const CLASSIC_VIEWBOX = { width: 240, height: 310 };
const CLASSIC_BUBBLE_CENTER = { x: 120, y: 172 };
const CLASSIC_WHEEL_POS: Record<WheelId, { x: number; y: number }> = {
  frontLeft: { x: 46, y: 96 },
  frontRight: { x: 194, y: 96 },
  rearLeft: { x: 46, y: 244 },
  rearRight: { x: 194, y: 244 },
};

function createClassicDiagram(rearAxle: AxleConfig): RvDiagram {
  const container = diagramContainer(CLASSIC_VIEWBOX, 'rv-diagram');
  const svg = diagramSvg(CLASSIC_VIEWBOX, t('diagram.aria'));
  const wheels = classicWheels(rearAxle);
  const bubble = createBubbleLevel(CLASSIC_BUBBLE_CENTER, CLASSIC_BUBBLE);
  svg.append(...classicBody());
  for (const id of WHEEL_IDS) svg.append(...wheels[id].elements);
  svg.append(...bubble.elements);
  container.append(svg);

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      // Values arrive hysteresis-stabilized — a still phone shows a
      // still diagram.
      for (const id of WHEEL_IDS) wheels[id].update(result.wheels[id], unit, stepHeightsMm);
      bubble.update(result);
    },
  };
}

/** A plain rectangular outline under a front arrow — Classic's
 * "unstyled HTML" square-cornered counterpart to Modern's heavily rounded
 * silhouette. The arrow's shape alone says "front", with no text label
 * (#161 follow-up). */
function classicBody(): SVGElement[] {
  return [
    path('M120 8 L110 26 L117 26 L117 40 L123 40 L123 26 L130 26 Z', 'rv-diagram__arrow'),
    rect(58, 72, 124, 196, 2, 'rv-diagram__body'),
    path('M74 92 Q120 76 166 92 L160 110 Q120 100 80 110 Z', 'rv-diagram__windshield'),
  ];
}

/** One Classic wheel per corner; a boggie rear axle draws each rear wheel
 * as a pair (ADR 0009). */
function classicWheels(rearAxle: AxleConfig): Record<WheelId, ClassicWheel> {
  const wheels = {} as Record<WheelId, ClassicWheel>;
  for (const id of WHEEL_IDS) {
    const pair = rearAxle === 'boggie' && id.startsWith('rear');
    wheels[id] = createClassicWheel(CLASSIC_WHEEL_POS[id], pair);
  }
  return wheels;
}

// ============================================================
// Modern (#106) — redrawn silhouette, wheel cards.
// ============================================================

const MODERN_VIEWBOX = { width: 260, height: 420 };
const MODERN_BUBBLE_CENTER = { x: 130, y: 236 };
/** Card anchor height per wheel. Front sits well clear of the cab (which
 * ends at y=124) so the card never overlaps it; rear mirrors the same
 * distance from the box's bottom edge. */
const MODERN_WHEEL_Y: Record<WheelId, number> = {
  frontLeft: 165,
  frontRight: 165,
  rearLeft: 318,
  rearRight: 318,
};

const WHEEL_LABEL: Record<WheelId, MessageKey> = {
  frontLeft: 'diagram.wheel.frontLeft',
  frontRight: 'diagram.wheel.frontRight',
  rearLeft: 'diagram.wheel.rearLeft',
  rearRight: 'diagram.wheel.rearRight',
};

function createModernDiagram(): RvDiagram {
  const { container, svg, cardLayer } = modernFrame(MODERN_VIEWBOX, t('diagram.aria'));
  const cards = modernWheelCards(cardLayer);
  const bubble = createBubbleLevel(MODERN_BUBBLE_CENTER, MODERN_BUBBLE);
  svg.append(...modernSilhouette(), ...bubble.elements);

  return {
    element: container,
    update(result, unit, stepHeightsMm) {
      for (const id of WHEEL_IDS) {
        const { displayMm, stepMm, severity } = result.wheels[id];
        const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
        fillWheelCard(cards[id], sideOf(id), severity, SEVERITY_GLYPH[severity], text);
      }
      bubble.update(result);
    },
  };
}

function sideOf(id: WheelId): 'left' | 'right' {
  return id.endsWith('Left') ? 'left' : 'right';
}

/**
 * The two-tone Modern motorhome: a narrower cab up front widening into
 * the box body, roof inset, mirrors, side window strips, roof hatch, rear
 * hatch, awning and a dashed crosshair through the bubble. The SVG carries
 * no per-wheel marker at all: per-wheel status lives entirely in the
 * floating wheel cards, since wheel-shaped rects behind the cards read as
 * leftover wheels and fought the silhouette (follow-up after #161).
 */
function modernSilhouette(): SVGElement[] {
  return [
    modernFrontArrow(),
    // Cab: a narrower rounded nose overlapping the box seamlessly, so the
    // two read as one silhouette. This narrow-cab/wide-box shape is the
    // strongest "motorhome" cue there is (widened from 80 to read less
    // stubby, small-adjustments follow-up).
    rect(80, 74, 100, 60, 28, 'rv-diagram__body'),
    // Mirrors at the front corners, level with the windshield, overlapping
    // the cab edge so they read as mounted onto it.
    rect(72, 85, 10, 13, 4, 'rv-diagram__trim'),
    rect(178, 85, 10, 13, 4, 'rv-diagram__trim'),
    // Box body, then an inset roof panel. Longer than the cab by design: a
    // motorhome reads as a long box behind a short cab (#161 follow-up).
    rect(62, 106, 136, 288, 28, 'rv-diagram__body'),
    rect(74, 141, 112, 232, 20, 'rv-diagram__roof'),
    path('M88 92 Q130 78 172 92 L166 122 Q130 110 94 122 Z', 'rv-diagram__windshield'),
    // A thin window band along each side: a subtler "coachbuilt" cue.
    rect(68, 160, 6, 190, 3, 'rv-diagram__trim'),
    rect(186, 160, 6, 190, 3, 'rv-diagram__trim'),
    // Roof hatch (skylight), rear hatch and awning.
    rect(106, 172, 48, 34, 6, 'rv-diagram__hatch'),
    rect(112, 318, 36, 24, 5, 'rv-diagram__hatch'),
    rect(176, 234, 8, 40, 4, 'rv-diagram__trim'),
    crosshair(130, 160, 130, 312),
    crosshair(82, 236, 178, 236),
  ];
}

function modernWheelCards(cardLayer: HTMLDivElement): Record<WheelId, WheelCard> {
  const cards = {} as Record<WheelId, WheelCard>;
  for (const id of WHEEL_IDS) {
    cards[id] = buildWheelCard(t(WHEEL_LABEL[id]), sideOf(id));
    placeWheelCard(cardLayer, cards[id].card, MODERN_WHEEL_Y[id], MODERN_VIEWBOX);
  }
  return cards;
}
