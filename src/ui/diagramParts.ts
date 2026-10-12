/**
 * The parts the motorhome and caravan diagrams are both built from. Each
 * diagram only says where its parts go.
 */
import type { DisplayResult, DisplayWheel } from '../domain/stability';
import { formatLength } from '../domain/lengths';
import { createElement } from './dom';
import { t } from './i18n';
import { svgEl } from './svg';

export interface Point {
  x: number;
  y: number;
}

export interface ViewBox {
  width: number;
  height: number;
}

type Unit = 'mm' | 'cm';
type Severity = DisplayWheel['severity'];

/** Shape per state so color is never the only signal (WCAG 1.4.1). */
export const SEVERITY_GLYPH = { none: '✓', small: '↑', large: '✕', unserved: '–' } as const;

/** Degrees of tilt that push the bubble to the edge of its travel. */
const BUBBLE_FULL_SCALE_DEG = 5;

// ============================================================
// Frame
// ============================================================

/**
 * `--diagram-aspect` (read by styles.css) and the `<svg viewBox>` come from
 * the same `ViewBox`, so the box the diagram is fitted into never drifts out
 * of proportion with the drawing. That keeps the floating wheel cards,
 * positioned as a percentage of that box, pinned to their wheels.
 */
export function diagramContainer(viewBox: ViewBox, className: string): HTMLDivElement {
  const container = createElement('div', className);
  container.style.setProperty('--diagram-aspect', String(viewBox.width / viewBox.height));
  return container;
}

export function diagramSvg(viewBox: ViewBox, ariaLabel: string): SVGSVGElement {
  return svgEl('svg', {
    viewBox: `0 0 ${viewBox.width} ${viewBox.height}`,
    role: 'img',
    'aria-label': ariaLabel,
  });
}

/** The stage is wider than the drawing so the wheel cards have margins to
 * sit in. */
export function modernFrame(
  viewBox: ViewBox,
  ariaLabel: string,
): { container: HTMLDivElement; svg: SVGSVGElement; cardLayer: HTMLDivElement } {
  const container = diagramContainer(viewBox, 'rv-diagram rv-diagram--modern');
  const stage = createElement('div', 'rv-diagram__stage');
  const svg = diagramSvg(viewBox, ariaLabel);
  const cardLayer = createElement('div', 'wheel-card-layer');
  stage.append(svg, cardLayer);
  container.append(stage);
  return { container, svg, cardLayer };
}

// ============================================================
// Shapes
// ============================================================

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  className: string,
): SVGRectElement {
  return svgEl('rect', {
    x: String(x),
    y: String(y),
    width: String(width),
    height: String(height),
    rx: String(rx),
    class: className,
  });
}

export function path(d: string, className: string): SVGPathElement {
  return svgEl('path', { d, class: className });
}

export function crosshair(x1: number, y1: number, x2: number, y2: number): SVGLineElement {
  return svgEl('line', {
    x1: String(x1),
    y1: String(y1),
    x2: String(x2),
    y2: String(y2),
    class: 'rv-diagram__crosshair',
  });
}

export function modernFrontArrow(): SVGPathElement {
  return path('M130 6 L118 28 L126 28 L126 44 L134 44 L134 28 L142 28 Z', 'rv-diagram__arrow');
}

// ============================================================
// Bubble level
// ============================================================

/** Lerps toward the high side; snaps under reduced motion. */
export function updateBubble(
  bubble: SVGCircleElement,
  result: Pick<DisplayResult, 'rollDeg' | 'pitchDeg' | 'isLevel'>,
  center: Point,
  travel: number,
  fullScaleDeg: number,
  reduceMotion: MediaQueryList,
  state: { get(): Point; set(x: number, y: number): void },
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

export interface BubbleLevel {
  /** In drawing order. */
  elements: SVGCircleElement[];
  update(result: Pick<DisplayResult, 'rollDeg' | 'pitchDeg' | 'isLevel'>): void;
}

export interface BubbleSize {
  dial: number;
  ring: number;
  bubble: number;
  /** How far the bubble can move from the centre at full tilt. */
  travel: number;
}

export const CLASSIC_BUBBLE: BubbleSize = { dial: 34, ring: 11, bubble: 8, travel: 22 };
export const MODERN_BUBBLE: BubbleSize = { dial: 44, ring: 13, bubble: 10, travel: 28 };

export function createBubbleLevel(center: Point, size: BubbleSize): BubbleLevel {
  const circle = (r: number, className: string) =>
    svgEl('circle', {
      cx: String(center.x),
      cy: String(center.y),
      r: String(r),
      class: className,
    });
  const dial = circle(size.dial, 'rv-diagram__bubble-dial');
  const ring = circle(size.ring, 'rv-diagram__bubble-ring');
  // An SVG circle without cx/cy sits at 0,0: a stray, half-clipped disc in
  // the corner until the first (possibly slow) sensor reading arrives.
  const bubble = svgEl('circle', {
    r: String(size.bubble),
    cx: String(center.x),
    cy: String(center.y),
    class: 'rv-diagram__bubble',
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = { ...center };
  const state = {
    get: () => position,
    set: (x: number, y: number) => {
      position = { x, y };
    },
  };

  return {
    elements: [dial, ring, bubble],
    update(result) {
      updateBubble(bubble, result, center, size.travel, BUBBLE_FULL_SCALE_DEG, reduceMotion, state);
    },
  };
}

// ============================================================
// Wheel text
// ============================================================

/** Shared by every diagram so all read the plan the same way. The step's own
 * height is not repeated next to its name: two millimetre figures side by
 * side read as two answers. A gray wheel gets no figure: a height on a wheel
 * to leave alone only begs the question of what to do with it. */
export function stepAndLiftText(
  severity: Severity,
  stepMm: number,
  displayMm: number,
  unit: Unit,
  stepHeightsMm: number[],
): { step: string; lift: string } {
  if (severity === 'none') return { step: '', lift: formatLength(displayMm, unit) };
  // Unserved (gray, ADR 0011): low, but no ramp reaches this wheel.
  if (stepMm <= 0) return { step: t('diagram.noRamp'), lift: formatLength(displayMm, unit) };
  const stepNumber = stepHeightsMm.indexOf(stepMm) + 1;
  return {
    step: stepNumber > 0 ? t('diagram.step', { n: stepNumber }) : `↑ ${formatLength(stepMm, unit)}`,
    lift: formatLength(displayMm, unit),
  };
}

// ============================================================
// Classic wheel
// ============================================================

/**
 * Wheel marker(s) within the same 28×48 footprint: a single wheel is one
 * rect; a boggie pair is two shorter rects with a gap — same outer
 * bounds, so glyphs and labels keep their positions (ADR 0009).
 */
function wheelMarkers(at: Point, pair: boolean): SVGRectElement[] {
  const marker = (top: number, height: number) =>
    rect(at.x - 14, top, 28, height, 1, 'rv-diagram__wheel');
  return pair ? [marker(at.y - 24, 22), marker(at.y + 2, 22)] : [marker(at.y - 24, 48)];
}

function wheelText(x: number, y: number, className: string): SVGTextElement {
  return svgEl('text', {
    x: String(x),
    y: String(y),
    'text-anchor': 'middle',
    class: className,
  });
}

export interface ClassicWheel {
  elements: SVGElement[];
  update(wheel: DisplayWheel, unit: Unit, stepHeightsMm: number[]): void;
}

export function createClassicWheel(at: Point, pair: boolean): ClassicWheel {
  const markers = wheelMarkers(at, pair);
  const glyph = svgEl('text', {
    x: String(at.x),
    y: String(at.y + 7),
    class: 'rv-diagram__wheel-glyph',
  });
  const stepLabel = wheelText(at.x, at.y - 34, 'rv-diagram__step-label');
  const liftLabel = wheelText(at.x, at.y + 42, 'rv-diagram__lift-label');

  return {
    elements: [...markers, glyph, stepLabel, liftLabel],
    update({ displayMm, stepMm, severity }, unit, stepHeightsMm) {
      // A pair shares one severity — both wheels get equal steps.
      for (const marker of markers)
        marker.setAttribute('class', `rv-diagram__wheel rv-diagram__wheel--${severity}`);
      glyph.textContent = SEVERITY_GLYPH[severity];
      const text = stepAndLiftText(severity, stepMm, displayMm, unit, stepHeightsMm);
      stepLabel.textContent = text.step;
      liftLabel.textContent = severity === 'none' ? '' : text.lift;
    },
  };
}

// ============================================================
// Modern wheel card
// ============================================================

export type CardSide = 'left' | 'right' | 'center';

export interface WheelCard {
  card: HTMLDivElement;
  markerGlyph: HTMLSpanElement;
  step: HTMLDivElement;
  mm: HTMLDivElement;
}

/** No visible position text: the card's place over the silhouette says
 * which wheel it is; `label` becomes its aria-label. */
export function buildWheelCard(label: string, side: CardSide): WheelCard {
  const card = createElement('div', `wheel-card wheel-card--${side}`);
  card.setAttribute('aria-label', label);
  const marker = createElement('div', 'wheel-card__marker');
  const markerGlyph = document.createElement('span');
  marker.append(markerGlyph);
  const text = createElement('div', 'wheel-card__text');
  const step = createElement('div', 'wheel-card__step');
  const mm = createElement('div', 'wheel-card__mm');
  text.append(step, mm);
  card.append(marker, text);
  return { card, markerGlyph, step, mm };
}

/** Measured from the centre of the *drawn* vehicle, not of the stage: the
 * drawing letterboxes within the wider stage, so a plain percentage of the
 * stage would miss the wheel. `--drawn-height` is set in styles.css. */
export function placeWheelCard(
  cardLayer: HTMLDivElement,
  card: HTMLDivElement,
  wheelY: number,
  viewBox: ViewBox,
): void {
  const offsetFromCentre = wheelY / viewBox.height - 0.5;
  card.style.top = `calc(50% + (${offsetFromCentre.toFixed(6)} * var(--drawn-height)))`;
  // Read back by scripts/fit-test.mjs to check the card lands on its wheel
  // at any diagram size.
  card.dataset.wheelY = String(wheelY);
  cardLayer.append(card);
}

export function fillWheelCard(
  refs: WheelCard,
  side: CardSide,
  severity: Severity,
  glyph: string,
  text: { step: string; lift: string },
): void {
  refs.markerGlyph.textContent = glyph;
  refs.card.className = `wheel-card wheel-card--${side} wheel-card--${severity}`;
  refs.step.textContent = severity === 'none' ? t('diagram.done') : text.step;
  refs.mm.textContent = text.lift;
}
