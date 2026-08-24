// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createRvDiagram } from './rvDiagram';
import { setLanguage } from './i18n';
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
