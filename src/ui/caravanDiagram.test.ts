// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createCaravanDiagram } from './caravanDiagram';
import { setLanguage, t } from './i18n';
import type { CaravanDisplayResult } from '../domain/caravan';
import type { DisplayWheel } from '../domain/stability';

setLanguage('en');

const GREEN: DisplayWheel = { displayMm: 0, stepMm: 0, severity: 'none' };
const STEPS = [44, 78, 112];

function result(overrides: Partial<CaravanDisplayResult>): CaravanDisplayResult {
  return {
    rollDeg: 0,
    pitchDeg: 0,
    isLevel: false,
    axle: { left: GREEN, right: GREEN },
    jockey: { displayMm: 0, direction: 'ok' },
    ...overrides,
  };
}

describe('caravanDiagram', () => {
  it('draws the front arrow with no "Front" text label (screen-cleanup follow-up)', () => {
    const diagram = createCaravanDiagram();
    diagram.update(result({}), 'mm', STEPS);
    expect(diagram.element.querySelector('.rv-diagram__arrow')).not.toBeNull();
    expect(diagram.element.textContent).not.toContain(t('diagram.front'));
  });

  it('says "No ramp" and shows no height for a gray/unserved axle wheel (screen-cleanup follow-up, #368)', () => {
    const diagram = createCaravanDiagram();
    diagram.update(
      result({ axle: { left: GREEN, right: { displayMm: 6, stepMm: 0, severity: 'unserved' } } }),
      'mm',
      STEPS,
    );
    const stepLabels = [...diagram.element.querySelectorAll('.rv-diagram__step-label')];
    expect(stepLabels[2]?.textContent).toBe('No ramp');
    const lifts = [...diagram.element.querySelectorAll('.rv-diagram__lift-label')];
    expect(lifts[2]?.textContent).toBe('');
    // Same glyph as the motorhome's gray wheel, not the red ✕.
    const glyphs = [...diagram.element.querySelectorAll('.rv-diagram__wheel-glyph')];
    expect(glyphs[2]?.textContent).toBe('–');
  });

  it('shows step guidance on the low axle wheel like the motorhome diagram', () => {
    const diagram = createCaravanDiagram();
    diagram.update(
      result({ axle: { left: GREEN, right: { displayMm: 63, stepMm: 78, severity: 'small' } } }),
      'mm',
      STEPS,
    );
    const stepLabels = [...diagram.element.querySelectorAll('.rv-diagram__step-label')];
    // Order: jockey action label first, then left, then right axle wheel.
    expect(stepLabels[2]?.textContent).toBe('Step 2');
    // One height per wheel (#368): the lift, not the step's own height too.
    expect(diagram.element.textContent).not.toContain('78 mm');
    const lifts = [...diagram.element.querySelectorAll('.rv-diagram__lift-label')];
    expect(lifts.map((l) => l.textContent)).toEqual(['', '', '63 mm']);
  });

  it('tells the user to crank the jockey wheel up, with the amount', () => {
    const diagram = createCaravanDiagram();
    diagram.update(result({ jockey: { displayMm: 35, direction: 'up' } }), 'mm', STEPS);
    const action = diagram.element.querySelector('.rv-diagram__step-label')!;
    expect(action.textContent).toBe('Crank up');
    const amount = diagram.element.querySelector('.rv-diagram__lift-label')!;
    expect(amount.textContent).toBe('35 mm');
    const glyphs = [...diagram.element.querySelectorAll('.rv-diagram__wheel-glyph')];
    expect(glyphs[0]?.textContent).toBe('↑');
  });

  it('draws axle wheel pairs for a tandem axle (#81)', () => {
    const diagram = createCaravanDiagram('boggie');
    diagram.update(
      result({ axle: { left: GREEN, right: { displayMm: 63, stepMm: 78, severity: 'small' } } }),
      'mm',
      STEPS,
    );
    // Jockey 1 + axle 2×2 markers.
    const markers = [...diagram.element.querySelectorAll('.rv-diagram__wheel')];
    expect(markers).toHaveLength(5);
    const orange = markers.filter((m) =>
      m.getAttribute('class')?.includes('rv-diagram__wheel--small'),
    );
    expect(orange).toHaveLength(2);
  });

  it('marks the jockey orange while cranking is needed, green when ok', () => {
    const diagram = createCaravanDiagram();
    diagram.update(result({ jockey: { displayMm: 20, direction: 'down' } }), 'mm', STEPS);
    const jockeyMarker = diagram.element.querySelector('.rv-diagram__wheel')!;
    expect(jockeyMarker.getAttribute('class')).toContain('rv-diagram__wheel--small');
    diagram.update(result({ isLevel: true }), 'mm', STEPS);
    expect(jockeyMarker.getAttribute('class')).toContain('rv-diagram__wheel--none');
    expect(diagram.element.querySelector('.rv-diagram__step-label')!.textContent).toBe('');
  });
});

describe('caravanDiagram — modern appearance (#368)', () => {
  function cards(element: HTMLElement) {
    return [...element.querySelectorAll('.wheel-card')].map((card) => ({
      label: card.getAttribute('aria-label'),
      className: card.getAttribute('class') ?? '',
      glyph: card.querySelector('.wheel-card__marker')?.textContent,
      step: card.querySelector('.wheel-card__step')?.textContent,
      mm: card.querySelector('.wheel-card__mm')?.textContent,
    }));
  }

  it('uses the motorhome’s Modern wheel cards: jockey, then left and right axle wheel', () => {
    const diagram = createCaravanDiagram('single', 'modern');
    diagram.update(result({}), 'mm', STEPS);
    expect(diagram.element.classList.contains('rv-diagram--modern')).toBe(true);
    const c = cards(diagram.element);
    expect(c.map((x) => x.label)).toEqual(['Jockey wheel', 'Left axle wheel', 'Right axle wheel']);
    expect(c[0]?.className).toContain('wheel-card--center');
    expect(c[1]?.className).toContain('wheel-card--left');
    expect(c[2]?.className).toContain('wheel-card--right');
    // No Classic on-SVG labels or wheel markers.
    expect(diagram.element.querySelectorAll('.rv-diagram__step-label')).toHaveLength(0);
    expect(diagram.element.querySelectorAll('.rv-diagram__wheel')).toHaveLength(0);
  });

  it('shows the step and one height, the lift, on a low axle wheel', () => {
    const diagram = createCaravanDiagram('single', 'modern');
    diagram.update(
      result({ axle: { left: GREEN, right: { displayMm: 63, stepMm: 78, severity: 'small' } } }),
      'mm',
      STEPS,
    );
    const right = cards(diagram.element)[2]!;
    expect(right.step).toBe('Step 2');
    expect(right.mm).toBe('63 mm');
    expect(right.glyph).toBe('↑');
    expect(right.className).toContain('wheel-card--small');
    expect(diagram.element.textContent).not.toContain('78 mm');
  });

  it('shows "No ramp" and no height on a gray axle wheel', () => {
    const diagram = createCaravanDiagram('single', 'modern');
    diagram.update(
      result({ axle: { left: { displayMm: 6, stepMm: 0, severity: 'unserved' }, right: GREEN } }),
      'mm',
      STEPS,
    );
    const left = cards(diagram.element)[1]!;
    expect(left.step).toBe('No ramp');
    expect(left.mm).toBe('');
    expect(left.glyph).toBe('–');
  });

  it('tells the user to crank the jockey wheel, with the amount, and never shows it red', () => {
    const diagram = createCaravanDiagram('single', 'modern');
    diagram.update(result({ jockey: { displayMm: 35, direction: 'down' } }), 'mm', STEPS);
    let jockey = cards(diagram.element)[0]!;
    expect(jockey.step).toBe('Crank down');
    expect(jockey.mm).toBe('35 mm');
    expect(jockey.glyph).toBe('↓');
    expect(jockey.className).toContain('wheel-card--small');
    diagram.update(result({ isLevel: true }), 'mm', STEPS);
    jockey = cards(diagram.element)[0]!;
    expect(jockey.step).toBe('Done');
    expect(jockey.glyph).toBe('✓');
    expect(jockey.className).toContain('wheel-card--none');
  });

  it('pins each card to its wheel’s height in the drawing (#241)', () => {
    const diagram = createCaravanDiagram('boggie', 'modern');
    const [jockey, left, right] = [...diagram.element.querySelectorAll<HTMLElement>('.wheel-card')];
    expect(Number(jockey?.dataset.wheelY)).toBeLessThan(Number(left?.dataset.wheelY));
    expect(left?.dataset.wheelY).toBe(right?.dataset.wheelY);
  });

  it('keeps Classic for any other appearance', () => {
    for (const appearance of ['classic', 'glossy'] as const) {
      const diagram = createCaravanDiagram('single', appearance);
      expect(diagram.element.querySelectorAll('.wheel-card')).toHaveLength(0);
    }
  });
});

// Same as the motorhome diagrams — see rvDiagram.test.ts (#244).
describe('the caravan bubble starts in its dial, not at the SVG origin (#244)', () => {
  it.each(['classic', 'modern'] as const)(
    '%s: has its dial coordinates before any reading is applied',
    (appearance) => {
      const diagram = createCaravanDiagram('single', appearance);
      const bubble = diagram.element.querySelector('.rv-diagram__bubble')!;
      const dial = diagram.element.querySelector('.rv-diagram__bubble-dial')!;
      expect(Number(bubble.getAttribute('cx'))).toBeCloseTo(Number(dial.getAttribute('cx')), 5);
      expect(Number(bubble.getAttribute('cy'))).toBeCloseTo(Number(dial.getAttribute('cy')), 5);
    },
  );
});
