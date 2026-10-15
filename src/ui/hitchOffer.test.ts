// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { createHitchOffer } from './hitchOffer';
import { setLanguage, t } from './i18n';

afterEach(() => {
  setLanguage('en');
  document.body.replaceChildren();
});

function setup(reading: string | null = null) {
  const state = { saved: false, dismissed: false };
  const offer = createHitchOffer({
    isDue: () => !state.saved && !state.dismissed,
    save: () => {
      if (reading === null) state.saved = true;
      return reading;
    },
    dismiss: () => void (state.dismissed = true),
  });
  const button = (key: Parameters<typeof t>[0]) =>
    [...offer.element.querySelectorAll('button')].find((b) => b.textContent === t(key))!;
  return { offer, state, button };
}

describe('"Save the hitch height first?" (#598)', () => {
  it('asks in one quiet line while none is saved', () => {
    const { offer } = setup();
    expect(offer.element.hidden).toBe(false);
    expect(offer.element.textContent).toContain(t('hitch.offer'));
  });

  it('saves on tap, confirms it, and goes away', () => {
    const { offer, state, button } = setup();
    button('hitch.offer.save').click();
    expect(state.saved).toBe(true);
    expect(document.querySelector('.toast')?.textContent).toBe(t('hitch.savedNow'));
    expect(offer.element.hidden).toBe(true);
  });

  it('says why when saving fails, and keeps asking', () => {
    const { offer, button } = setup('No reading yet');
    button('hitch.offer.save').click();
    expect(document.querySelector('.toast')?.textContent).toBe('No reading yet');
    expect(offer.element.hidden).toBe(false);
  });

  it('goes away when dismissed', () => {
    const { offer, state, button } = setup();
    button('hitch.offer.dismiss').click();
    expect(state.dismissed).toBe(true);
    expect(offer.element.hidden).toBe(true);
  });
});
