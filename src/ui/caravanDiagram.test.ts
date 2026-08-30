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

  it('says "No ramp" for a gray/unserved axle wheel instead of a blank step line (screen-cleanup follow-up)', () => {
    const diagram = createCaravanDiagram();
    diagram.update(
      result({ axle: { left: GREEN, right: { displayMm: 6, stepMm: 0, severity: 'unserved' } } }),
      'mm',
      STEPS,
    );
    const stepLabels = [...diagram.element.querySelectorAll('.rv-diagram__step-label')];
    const right = stepLabels[2]!;
    expect(right.children[0]?.textContent).toBe('No ramp');
    expect(right.children[1]?.textContent).toBe('');
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
    const right = stepLabels[2]!;
    expect(right.children[0]?.textContent).toBe('Step 2');
    expect(right.children[1]?.textContent).toBe('(78 mm)');
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

// Same as the motorhome diagrams — see rvDiagram.test.ts (#244).
describe('the caravan bubble starts in its dial, not at the SVG origin (#244)', () => {
  it('has its dial coordinates before any reading is applied', () => {
    const diagram = createCaravanDiagram();
    const bubble = diagram.element.querySelector('.rv-diagram__bubble')!;
    const dial = diagram.element.querySelector('.rv-diagram__bubble-dial')!;
    expect(Number(bubble.getAttribute('cx'))).toBeCloseTo(Number(dial.getAttribute('cx')), 5);
    expect(Number(bubble.getAttribute('cy'))).toBeCloseTo(Number(dial.getAttribute('cy')), 5);
  });
});
