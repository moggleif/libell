import { afterEach, describe, expect, it } from 'vitest';
import type { SpokenPlan } from '../domain/spokenGuidance';
import { setLanguage } from './i18n';
import { spokenText } from './spokenText';

afterEach(() => setLanguage('en'));

function raise(part: SpokenPlan['parts'][number]): SpokenPlan {
  return { isLevel: false, parts: [part] };
}

describe('spokenText (#602)', () => {
  it('says the wheel and its ramp step, as the wheel card shows them', () => {
    setLanguage('sv');
    const plan = raise({ kind: 'wheel', wheel: 'rearLeft', step: 2, liftMm: 78, notEnough: false });
    expect(spokenText(plan, 'mm')).toBe('Vänster bak, Steg 2');
  });

  it('says the lift when there is no step to name', () => {
    setLanguage('sv');
    const plan = raise({
      kind: 'wheel',
      wheel: 'rearLeft',
      step: null,
      liftMm: 30,
      notEnough: false,
    });
    expect(spokenText(plan, 'mm')).toBe('Vänster bak, 30 mm');
  });

  it('adds "not enough" when the tallest step falls short', () => {
    const plan = raise({
      kind: 'wheel',
      wheel: 'frontRight',
      step: 3,
      liftMm: 200,
      notEnough: true,
    });
    expect(spokenText(plan, 'mm')).toBe('Front right, Step 3, not enough');
  });

  it('says cranking the jockey wheel in the display unit, with the language’s decimal mark', () => {
    setLanguage('sv');
    expect(spokenText(raise({ kind: 'crank', direction: 'up', mm: 20 }), 'mm')).toBe(
      'Veva upp 20 mm',
    );
    expect(spokenText(raise({ kind: 'crank', direction: 'down', mm: 35 }), 'cm')).toBe(
      'Veva ner 3,5 cm',
    );
    setLanguage('en');
    expect(spokenText(raise({ kind: 'crank', direction: 'down', mm: 35 }), 'cm')).toBe(
      'Crank down 3.5 cm',
    );
  });

  it('says several wheels one after the other', () => {
    const plan: SpokenPlan = {
      isLevel: false,
      parts: [
        { kind: 'wheel', wheel: 'axleRight', step: 1, liftMm: 41, notEnough: false },
        { kind: 'crank', direction: 'up', mm: 20 },
      ],
    };
    expect(spokenText(plan, 'mm')).toBe('Right axle wheel, Step 1. Crank up 20 mm');
  });

  it('says "level" when level', () => {
    setLanguage('sv');
    expect(spokenText({ isLevel: true, parts: [] }, 'mm')).toBe('Plant');
  });
});
