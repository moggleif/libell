// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createCaravanDiagram } from './caravanDiagram';
import { setLanguage } from './i18n';
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
