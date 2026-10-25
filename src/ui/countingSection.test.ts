// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { COUNTER_ORIGIN } from '../domain/usage';
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { createCountingExplanation, createCountingSection } from './countingSection';
import { t } from './i18n';

function choice(on: boolean) {
  const state = { on };
  return { state, isOn: () => state.on, setOn: (next: boolean) => void (state.on = next) };
}

function textOf(elements: HTMLElement[]): string {
  return elements.map((element) => element.textContent).join(' ');
}

describe('createCountingSection (#674)', () => {
  it('says what is counted and what is never saved', () => {
    const text = createCountingSection(choice(true)).textContent ?? '';
    expect(text).toContain(
      t('counting.sent', { boxes: EXTERNAL_SENSORS.map((box) => box.displayName).join(', ') }),
    );
    for (const key of [
      'counting.intro',
      'counting.sent.h',
      'counting.notSent.h',
      'counting.notSent',
      'counting.gpc',
    ] as const)
      expect(text).toContain(t(key));
  });

  it('shows the stored choice and stores a change at once', () => {
    const stored = choice(true);
    const box = createCountingSection(stored).querySelector<HTMLInputElement>('input');
    expect(box?.checked).toBe(true);
    box!.checked = false;
    box!.dispatchEvent(new Event('change'));
    expect(stored.state.on).toBe(false);
  });

  it('links the public statistics in a new tab', () => {
    const link = createCountingSection(choice(false)).querySelector('a');
    expect(link?.href.replace(/\/$/, '')).toBe(COUNTER_ORIGIN);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener');
  });
});

describe('createCountingExplanation (#699)', () => {
  it('tells the first-start choice where to change it later, with no switch', () => {
    const parts = createCountingExplanation('choice');
    const text = textOf(parts);
    expect(text).toContain(
      t('counting.later', { help: t('bottombar.help'), tab: t('menu.privacy.tab') }),
    );
    expect(text).not.toContain(t('counting.gpc'));
    expect(parts.some((part) => part.querySelector('input'))).toBe(false);
  });
});
