// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  CLASSIC_BUBBLE,
  buildWheelCard,
  createBubbleLevel,
  createClassicWheel,
  diagramContainer,
  fillWheelCard,
  placeWheelCard,
} from './diagramParts';
import { setLanguage } from './i18n';

setLanguage('en');

describe('diagramContainer (#241, #419)', () => {
  it('publishes the drawing proportions for the layout', () => {
    const container = diagramContainer({ width: 240, height: 320 }, 'rv-diagram');
    expect(container.className).toBe('rv-diagram');
    expect(container.style.getPropertyValue('--diagram-aspect')).toBe('0.75');
  });
});

describe('createClassicWheel (#419)', () => {
  it('draws one marker for a single wheel and two for a pair, then glyph, step and lift', () => {
    expect(createClassicWheel({ x: 46, y: 96 }, false).elements).toHaveLength(4);
    const pair = createClassicWheel({ x: 46, y: 96 }, true).elements;
    expect(pair.map((el) => el.getAttribute('class'))).toEqual([
      'rv-diagram__wheel',
      'rv-diagram__wheel',
      'rv-diagram__wheel-glyph',
      'rv-diagram__step-label',
      'rv-diagram__lift-label',
    ]);
  });

  it('colors every marker by severity and labels the step and lift', () => {
    const wheel = createClassicWheel({ x: 46, y: 96 }, true);
    wheel.update({ displayMm: 63, stepMm: 78, severity: 'small' }, 'mm', [44, 78]);
    const [front, back, glyph, step, lift] = wheel.elements;
    expect(front?.getAttribute('class')).toBe('rv-diagram__wheel rv-diagram__wheel--small');
    expect(back?.getAttribute('class')).toBe('rv-diagram__wheel rv-diagram__wheel--small');
    expect([glyph?.textContent, step?.textContent, lift?.textContent]).toEqual([
      '↑',
      'Step 2',
      '63 mm',
    ]);
  });

  it('shows no lift on a green wheel', () => {
    const wheel = createClassicWheel({ x: 46, y: 96 }, false);
    wheel.update({ displayMm: 3, stepMm: 0, severity: 'none' }, 'mm', [44]);
    expect(wheel.elements[3]?.textContent).toBe('');
  });
});

describe('wheel cards (#419)', () => {
  it('floats a card level with its wheel in the drawn area and records the wheel', () => {
    const layer = document.createElement('div');
    const { card } = buildWheelCard('Front left', 'left');
    placeWheelCard(layer, card, 105, { width: 260, height: 420 });
    expect(card.style.top).toBe('calc(50% + (-0.250000 * var(--drawn-height)))');
    expect(card.dataset.wheelY).toBe('105');
    expect(layer.firstChild).toBe(card);
    expect(card.getAttribute('aria-label')).toBe('Front left');
  });

  it('says "Done" in place of a step once the wheel needs none', () => {
    const refs = buildWheelCard('Front left', 'left');
    fillWheelCard(refs, 'left', 'none', '✓', { step: '', lift: '0 mm' });
    expect(refs.card.className).toBe('wheel-card wheel-card--left wheel-card--none');
    expect([refs.markerGlyph.textContent, refs.step.textContent, refs.mm.textContent]).toEqual([
      '✓',
      'Done',
      '0 mm',
    ]);
    fillWheelCard(refs, 'left', 'large', '✕', { step: 'Step 3', lift: '140 mm' });
    expect(refs.step.textContent).toBe('Step 3');
  });
});

describe('createBubbleLevel (#244, #419)', () => {
  it('starts the bubble in the middle of its dial', () => {
    const [dial, ring, bubble] = createBubbleLevel({ x: 120, y: 172 }, CLASSIC_BUBBLE).elements;
    expect(dial?.getAttribute('r')).toBe('34');
    expect(ring?.getAttribute('r')).toBe('11');
    expect([bubble?.getAttribute('cx'), bubble?.getAttribute('cy')]).toEqual(['120', '172']);
  });

  it('moves the bubble toward the tilt from where it last was', () => {
    const level = createBubbleLevel({ x: 120, y: 172 }, CLASSIC_BUBBLE);
    const bubble = level.elements[2];
    level.update({ rollDeg: 5, pitchDeg: 0, isLevel: false });
    expect(bubble?.getAttribute('cx')).toBe('126.60');
    level.update({ rollDeg: 5, pitchDeg: 0, isLevel: false });
    expect(bubble?.getAttribute('cx')).toBe('131.22');
  });
});
