// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { NO_TRIM, nudgeTrim, type TrimDirection } from '../domain/zeroTrim';
import { LANGUAGES, setLanguage, t } from './i18n';
import { createZeroTrimRow, zeroTrimText } from './zeroTrimRow';

afterEach(() => setLanguage('en'));

function fakeTrim(hasZero = true) {
  let trim = NO_TRIM;
  const options = {
    hasZero: () => hasZero,
    getTrim: () => trim,
    nudge: (direction: TrimDirection) => void (trim = nudgeTrim(trim, direction)),
    reset: () => void (trim = NO_TRIM),
  };
  return { options, trim: () => trim };
}

function button(root: HTMLElement, key: Parameters<typeof t>[0]): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === t(key))!;
}

function total(root: HTMLElement): string {
  return root.querySelector('.menu__text--status')!.textContent!;
}

describe('the fine-tune row (#596)', () => {
  it('offers four nudges and a reset under a stored zero', () => {
    setLanguage('sv');
    const { element } = createZeroTrimRow(fakeTrim().options);
    expect(element.hidden).toBe(false);
    expect([...element.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'Vänster upp',
      'Höger upp',
      'Fram upp',
      'Bak upp',
      'Återställ finjustering',
    ]);
  });

  it('is not shown while there is no zero to adjust', () => {
    expect(createZeroTrimRow(fakeTrim(false).options).element.hidden).toBe(true);
  });

  it('nudges per tap and shows the total, front/back first', () => {
    setLanguage('sv');
    const fake = fakeTrim();
    const { element } = createZeroTrimRow(fake.options);
    expect(total(element)).toBe('Inte finjusterat');
    button(element, 'zeroTrim.left').click();
    button(element, 'zeroTrim.left').click();
    button(element, 'zeroTrim.front').click();
    expect(fake.trim()).toEqual({ rollDeg: -0.2, pitchDeg: 0.1 });
    expect(total(element)).toBe('Finjusterat: Fram +0.1° · Vänster +0.2°');
  });

  it('resets to the zero as captured, and has nothing to reset before a nudge', () => {
    const fake = fakeTrim();
    const { element } = createZeroTrimRow(fake.options);
    const reset = button(element, 'zeroTrim.reset');
    expect(reset.disabled).toBe(true);
    button(element, 'zeroTrim.back').click();
    expect(reset.disabled).toBe(false);
    reset.click();
    expect(fake.trim()).toEqual(NO_TRIM);
    expect(total(element)).toBe(t('zeroTrim.none'));
  });

  it('writes the total in every shipped language', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      const text = zeroTrimText({ rollDeg: 0.1, pitchDeg: -0.3 });
      expect(text).toBe(
        t('zeroTrim.total', {
          trim: `${t('zeroTrim.side.back')} +0.3° · ${t('zeroTrim.side.right')} +0.1°`,
        }),
      );
    }
  });
});
