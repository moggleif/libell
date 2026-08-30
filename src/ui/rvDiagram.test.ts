// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createRvDiagram } from './rvDiagram';
import { setLanguage, t } from './i18n';
import type { DisplayResult, DisplayWheel } from '../domain/stability';

setLanguage('en');

const GREEN: DisplayWheel = { displayMm: 0, stepMm: 0, severity: 'none' };

function result(
  wheels: Partial<Record<keyof DisplayResult['wheels'], DisplayWheel>>,
): DisplayResult {
  return {
    rollDeg: 0,
    pitchDeg: 0,
    isLevel: false,
    maxDeficitMm: 0,
    wheels: {
      frontLeft: GREEN,
      frontRight: GREEN,
      rearLeft: GREEN,
      rearRight: GREEN,
      ...wheels,
    },
  };
}

const STEPS = [44, 78, 112];

function labelsOf(element: HTMLElement) {
  const stepLabels = [...element.querySelectorAll('.rv-diagram__step-label')];
  return {
    // Wheels append in WHEEL_IDS order: FL, FR, RL, RR.
    stepName: (i: number) => stepLabels[i]?.children[0]?.textContent,
    stepHeight: (i: number) => stepLabels[i]?.children[1]?.textContent,
    lift: (i: number) => [...element.querySelectorAll('.rv-diagram__lift-label')][i]?.textContent,
    glyph: (i: number) => [...element.querySelectorAll('.rv-diagram__wheel-glyph')][i]?.textContent,
    wheelClass: (i: number) =>
      [...element.querySelectorAll('.rv-diagram__wheel')][i]?.getAttribute('class'),
  };
}

describe('rvDiagram front arrow (screen-cleanup follow-up)', () => {
  it('draws the arrow with no "Front" text label, in both appearances', () => {
    for (const appearance of ['classic', 'modern'] as const) {
      const diagram = createRvDiagram('single', appearance);
      diagram.update(result({}), 'mm', STEPS);
      expect(diagram.element.querySelector('.rv-diagram__arrow')).not.toBeNull();
      expect(diagram.element.textContent).not.toContain(t('diagram.front'));
    }
  });
});

describe('rvDiagram wheel labels', () => {
  it('shows the step name, its parenthesized height and the plain lift for an orange wheel', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    const l = labelsOf(diagram.element);
    expect(l.stepName(0)).toBe('Step 2');
    expect(l.stepHeight(0)).toBe('(78 mm)');
    expect(l.lift(0)).toBe('63 mm');
    expect(l.glyph(0)).toBe('↑');
    expect(l.wheelClass(0)).toContain('rv-diagram__wheel--small');
  });

  it('leaves a green wheel unlabeled with a ✓ glyph', () => {
    const diagram = createRvDiagram();
    diagram.update(result({}), 'mm', STEPS);
    const l = labelsOf(diagram.element);
    expect(l.stepName(1)).toBe('');
    expect(l.stepHeight(1)).toBe('');
    expect(l.lift(1)).toBe('');
    expect(l.glyph(1)).toBe('✓');
    expect(l.wheelClass(1)).toContain('rv-diagram__wheel--none');
  });

  it('marks a red wheel with ✕ and still names the tallest step', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ rearLeft: { displayMm: 200, stepMm: 112, severity: 'large' } }),
      'mm',
      STEPS,
    );
    const l = labelsOf(diagram.element);
    expect(l.stepName(2)).toBe('Step 3');
    expect(l.stepHeight(2)).toBe('(112 mm)');
    expect(l.lift(2)).toBe('200 mm');
    expect(l.glyph(2)).toBe('✕');
    expect(l.wheelClass(2)).toContain('rv-diagram__wheel--large');
  });

  it('says "No ramp" for a gray/unserved wheel instead of a blank step line (screen-cleanup follow-up)', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ rearLeft: { displayMm: 6, stepMm: 0, severity: 'unserved' } }),
      'mm',
      STEPS,
    );
    const l = labelsOf(diagram.element);
    expect(l.stepName(2)).toBe('No ramp');
    expect(l.stepHeight(2)).toBe('');
  });

  it('falls back to the plain height when the step is not in the configured list', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ rearRight: { displayMm: 40, stepMm: 60, severity: 'small' } }),
      'mm',
      STEPS,
    );
    const l = labelsOf(diagram.element);
    expect(l.stepName(3)).toBe('↑ 60 mm');
    expect(l.stepHeight(3)).toBe('');
  });

  it('formats labels in cm when that display unit is chosen', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'cm',
      STEPS,
    );
    const l = labelsOf(diagram.element);
    expect(l.stepHeight(0)).toBe('(7.8 cm)');
    expect(l.lift(0)).toBe('6.3 cm');
  });

  it('draws rear wheel pairs sharing one severity for a boggie (#81)', () => {
    const diagram = createRvDiagram('boggie');
    diagram.update(
      result({ rearLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    // Front 2×1 + rear 2×2 markers.
    const markers = [...diagram.element.querySelectorAll('.rv-diagram__wheel')];
    expect(markers).toHaveLength(6);
    const orange = markers.filter((m) =>
      m.getAttribute('class')?.includes('rv-diagram__wheel--small'),
    );
    expect(orange).toHaveLength(2); // both wheels of the rear-left pair
    // Still one glyph and one label set per side.
    expect(diagram.element.querySelectorAll('.rv-diagram__wheel-glyph')).toHaveLength(4);
    const l = labelsOf(diagram.element);
    expect(l.stepName(2)).toBe('Step 2');
    expect(l.lift(2)).toBe('63 mm');
  });

  it('clears the labels again when a wheel turns green', () => {
    const diagram = createRvDiagram();
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    diagram.update(result({}), 'mm', STEPS);
    const l = labelsOf(diagram.element);
    expect(l.stepName(0)).toBe('');
    expect(l.stepHeight(0)).toBe('');
    expect(l.lift(0)).toBe('');
  });
});

describe('rvDiagram — modern appearance (#106)', () => {
  function cardsOf(element: HTMLElement) {
    const cards = [...element.querySelectorAll('.wheel-card')];
    return {
      count: cards.length,
      ariaLabel: (i: number) => cards[i]?.getAttribute('aria-label'),
      step: (i: number) => cards[i]?.querySelector('.wheel-card__step')?.textContent,
      mm: (i: number) => cards[i]?.querySelector('.wheel-card__mm')?.textContent,
      markerGlyph: (i: number) => cards[i]?.querySelector('.wheel-card__marker')?.textContent,
      severityClass: (i: number) => cards[i]?.getAttribute('class'),
    };
  }

  it('does not render on-SVG step/lift text — that moved into wheel cards', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    expect(diagram.element.querySelectorAll('.rv-diagram__step-label')).toHaveLength(0);
    expect(diagram.element.querySelectorAll('.rv-diagram__lift-label')).toHaveLength(0);
  });

  it('shows one wheel card per wheel, identified by position via aria-label rather than visible text (screen-cleanup follow-up)', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(result({}), 'mm', STEPS);
    const c = cardsOf(diagram.element);
    expect(c.count).toBe(4);
    expect(c.ariaLabel(0)).toBe('FRONT L');
    expect(c.ariaLabel(1)).toBe('FRONT R');
    expect(c.ariaLabel(2)).toBe('REAR L');
    expect(c.ariaLabel(3)).toBe('REAR R');
    expect(diagram.element.querySelectorAll('.wheel-card__label')).toHaveLength(0);
  });

  it('shows "Done" and the actual (near-zero) lift for a green wheel, not a blank step', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(result({}), 'mm', STEPS);
    const c = cardsOf(diagram.element);
    expect(c.step(1)).toBe('Done');
    expect(c.mm(1)).toBe('0 mm');
    expect(c.markerGlyph(1)).toBe('✓');
    expect(c.severityClass(1)).toContain('wheel-card--none');
  });

  it('shows the step name and lift for an orange wheel, same figures as classic', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    const c = cardsOf(diagram.element);
    expect(c.step(0)).toBe('Step 2');
    expect(c.mm(0)).toBe('63 mm');
    expect(c.markerGlyph(0)).toBe('↑');
    expect(c.severityClass(0)).toContain('wheel-card--small');
  });

  it('dims the mm figure for an unserved wheel, same convention as classic', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(
      result({ rearRight: { displayMm: 6, stepMm: 0, severity: 'unserved' } }),
      'mm',
      STEPS,
    );
    const mm = diagram.element.querySelectorAll('.wheel-card__mm')[3];
    expect(mm?.classList.contains('wheel-card__mm--dim')).toBe(true);
  });

  it('says "No ramp" for an unserved wheel instead of a blank step line (screen-cleanup follow-up)', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(
      result({ rearRight: { displayMm: 6, stepMm: 0, severity: 'unserved' } }),
      'mm',
      STEPS,
    );
    const c = cardsOf(diagram.element);
    expect(c.step(3)).toBe('No ramp');
  });

  it('carries no on-body SVG wheel marker — status lives only in the card', () => {
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(
      result({ frontLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    expect(diagram.element.querySelectorAll('.rv-diagram__wheel-glyph')).toHaveLength(0);
    expect(diagram.element.querySelectorAll('.rv-diagram__wheel')).toHaveLength(0);
    const c = cardsOf(diagram.element);
    expect(c.markerGlyph(0)).toBe('↑');
  });

  it('shows one card per side for a boggie too, same as single-axle', () => {
    const diagram = createRvDiagram('boggie', 'modern');
    diagram.update(
      result({ rearLeft: { displayMm: 63, stepMm: 78, severity: 'small' } }),
      'mm',
      STEPS,
    );
    // Boggie only changes the rear axle's classic on-SVG markers — modern
    // has none to begin with, so the card count is unaffected either way.
    expect(diagram.element.querySelectorAll('.wheel-card')).toHaveLength(4);
  });

  it('classic mode is unaffected — no wheel cards, appearance defaults to classic', () => {
    const diagram = createRvDiagram();
    diagram.update(result({}), 'mm', STEPS);
    expect(diagram.element.querySelectorAll('.wheel-card')).toHaveLength(0);
    expect(diagram.element.classList.contains('rv-diagram--modern')).toBe(false);
  });
});

// #244: the bubble is an SVG circle, and a circle with no cx/cy defaults
// to 0,0 — the drawing's top-left corner. Until the first sensor reading
// arrived it sat there, half of it clipped by the SVG's edge, showing as
// a stray half-disc on screen. Every path that can delay a first reading
// hit it: an EasyLevel box connecting, a phone sensor waking up, a
// permission prompt still open.
describe('the bubble starts in its dial, not at the SVG origin (#244)', () => {
  for (const appearance of ['classic', 'modern'] as const) {
    it(`${appearance}: has real coordinates before any reading is applied`, () => {
      const diagram = createRvDiagram('single', appearance);
      const bubble = diagram.element.querySelector('.rv-diagram__bubble')!;
      const cx = Number(bubble.getAttribute('cx'));
      const cy = Number(bubble.getAttribute('cy'));
      expect(Number.isFinite(cx)).toBe(true);
      expect(Number.isFinite(cy)).toBe(true);
      expect(cx).toBeGreaterThan(0);
      expect(cy).toBeGreaterThan(0);

      // And it starts where its own dial is drawn, not merely somewhere
      // on the canvas.
      const dial = diagram.element.querySelector('.rv-diagram__bubble-dial')!;
      expect(cx).toBeCloseTo(Number(dial.getAttribute('cx')), 5);
      expect(cy).toBeCloseTo(Number(dial.getAttribute('cy')), 5);
    });
  }
});
