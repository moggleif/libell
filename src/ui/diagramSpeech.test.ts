// @vitest-environment happy-dom
// What a screen reader hears from the level view (#534): each wheel's
// position and its instruction, in every appearance and vehicle.
import { afterEach, describe, expect, it } from 'vitest';
import type { CaravanDisplayResult } from '../domain/caravan';
import type { DisplayResult, DisplayWheel } from '../domain/stability';
import { createCaravanDiagram } from './caravanDiagram';
import { setLanguage } from './i18n';
import { createRvDiagram } from './rvDiagram';

const STEPS = [44, 78, 112];
const DONE: DisplayWheel = { displayMm: 0, stepMm: 0, severity: 'none' };
const STEP_2: DisplayWheel = { displayMm: 63, stepMm: 78, severity: 'small' };
const TOO_HIGH: DisplayWheel = { displayMm: 160, stepMm: 112, severity: 'large' };
const NO_RAMP: DisplayWheel = { displayMm: 6, stepMm: 0, severity: 'unserved' };

function motorhome(wheels: Partial<DisplayResult['wheels']> = {}): DisplayResult {
  return {
    rollDeg: 0,
    pitchDeg: 0,
    isLevel: false,
    maxDeficitMm: 0,
    wheels: { frontLeft: DONE, frontRight: DONE, rearLeft: DONE, rearRight: DONE, ...wheels },
  };
}

function caravan(overrides: Partial<CaravanDisplayResult> = {}): CaravanDisplayResult {
  return {
    rollDeg: 0,
    pitchDeg: 0,
    isLevel: false,
    axle: { left: DONE, right: DONE },
    jockey: { displayMm: 0, direction: 'ok' },
    ...overrides,
  };
}

const drawingLabel = (element: HTMLElement) =>
  element.querySelector('svg')?.getAttribute('aria-label');

afterEach(() => setLanguage('en'));

describe('Classic motorhome: the drawing says what each wheel needs', () => {
  it('names every wheel with its step and lift, done, not enough or no ramp', () => {
    setLanguage('en');
    const diagram = createRvDiagram('single', 'classic');
    diagram.update(
      motorhome({ frontLeft: STEP_2, rearLeft: TOO_HIGH, rearRight: NO_RAMP }),
      'mm',
      STEPS,
    );
    expect(drawingLabel(diagram.element)).toBe(
      'Top-down view of your motorhome showing which wheels need raising. ' +
        'Front left: Step 2, 63 mm. Front right: Done. ' +
        'Rear left: Step 3, 160 mm, not enough. Rear right: No ramp, 6 mm.',
    );
  });

  it('says the new instructions after the reading changes', () => {
    setLanguage('en');
    const diagram = createRvDiagram('single', 'classic');
    diagram.update(motorhome({ frontLeft: STEP_2 }), 'mm', STEPS);
    diagram.update(motorhome(), 'mm', STEPS);
    expect(drawingLabel(diagram.element)).toContain('Front left: Done.');
  });

  it('speaks the chosen language', () => {
    setLanguage('sv');
    const diagram = createRvDiagram('single', 'classic');
    diagram.update(motorhome({ frontLeft: STEP_2, rearLeft: TOO_HIGH }), 'mm', STEPS);
    expect(drawingLabel(diagram.element)).toContain('Vänster fram: Steg 2, 63 mm.');
    expect(drawingLabel(diagram.element)).toContain('räcker inte');
  });
});

describe('Classic caravan: the drawing says what the axle and jockey wheel need', () => {
  it('names both axle wheels and the jockey wheel', () => {
    setLanguage('en');
    const diagram = createCaravanDiagram('single', 'classic');
    diagram.update(
      caravan({ axle: { left: DONE, right: STEP_2 }, jockey: { displayMm: 20, direction: 'up' } }),
      'mm',
      STEPS,
    );
    expect(drawingLabel(diagram.element)).toBe(
      'Top-down view of your caravan showing the axle wheels and the jockey wheel. ' +
        'Left axle wheel: Done. Right axle wheel: Step 2, 63 mm. ' +
        'Jockey wheel: Crank up, 20 mm.',
    );
  });

  it('says the jockey wheel is done once it is', () => {
    setLanguage('en');
    const diagram = createCaravanDiagram('single', 'classic');
    diagram.update(caravan({ jockey: { displayMm: 20, direction: 'down' } }), 'mm', STEPS);
    expect(drawingLabel(diagram.element)).toContain('Jockey wheel: Crank down, 20 mm.');
    diagram.update(caravan(), 'mm', STEPS);
    expect(drawingLabel(diagram.element)).toContain('Jockey wheel: Done.');
  });
});

describe('Modern wheel cards: each card is a named group a reader can enter', () => {
  const cards = (element: HTMLElement) => [...element.querySelectorAll<HTMLElement>('.wheel-card')];

  it('names each motorhome card by its position and hides the marker glyph', () => {
    setLanguage('en');
    const diagram = createRvDiagram('single', 'modern');
    diagram.update(motorhome({ frontLeft: STEP_2 }), 'mm', STEPS);
    const [frontLeft] = cards(diagram.element);
    expect(frontLeft?.getAttribute('role')).toBe('group');
    expect(frontLeft?.getAttribute('aria-label')).toBe('Front left');
    expect(frontLeft?.querySelector('.wheel-card__marker')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('adds an unseen "not enough" only where the ramps fall short, and drops it after', () => {
    setLanguage('en');
    const diagram = createRvDiagram('single', 'modern');
    const note = (i: number) =>
      cards(diagram.element)[i]?.querySelector('.visually-hidden')?.textContent;
    diagram.update(motorhome({ frontLeft: TOO_HIGH, frontRight: STEP_2 }), 'mm', STEPS);
    expect(note(0)).toBe('not enough');
    expect(note(1)).toBe('');
    diagram.update(motorhome(), 'mm', STEPS);
    expect(note(0)).toBe('');
  });

  it('gives the caravan cards the same structure', () => {
    setLanguage('en');
    const diagram = createCaravanDiagram('single', 'modern');
    diagram.update(caravan(), 'mm', STEPS);
    for (const card of cards(diagram.element)) {
      expect(card.getAttribute('role')).toBe('group');
      expect(card.querySelector('.wheel-card__marker')?.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
