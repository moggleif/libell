// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { COUNTER_ORIGIN } from '../domain/usage';
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { createCountingSection } from './countingSection';
import { t } from './i18n';

function choice(on: boolean) {
  const state = { on };
  return { state, isOn: () => state.on, setOn: (next: boolean) => void (state.on = next) };
}

describe('createCountingSection (#674)', () => {
  it('says what is counted and what is never saved', () => {
    const text = createCountingSection(choice(true), 'privacy').textContent ?? '';
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

  it('tells the guide where the switch lives later', () => {
    const text = createCountingSection(choice(true), 'guide').textContent ?? '';
    expect(text).toContain(
      t('counting.later', { help: t('bottombar.help'), tab: t('menu.privacy.tab') }),
    );
    expect(text).not.toContain(t('counting.gpc'));
  });

  it('shows the stored choice and stores a change at once', () => {
    const stored = choice(true);
    const box = createCountingSection(stored, 'guide').querySelector<HTMLInputElement>('input');
    expect(box?.checked).toBe(true);
    box!.checked = false;
    box!.dispatchEvent(new Event('change'));
    expect(stored.state.on).toBe(false);
  });

  it('links the public statistics in a new tab', () => {
    const link = createCountingSection(choice(false), 'guide').querySelector('a');
    expect(link?.href.replace(/\/$/, '')).toBe(COUNTER_ORIGIN);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener');
  });
});
