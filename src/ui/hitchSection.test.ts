// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { createHitchSection, type HitchOptions } from './hitchSection';
import { LANGUAGES, setLanguage, t } from './i18n';
import { createTargetsSection } from './targetsSection';

afterEach(() => setLanguage('en'));

function fakeHitch(overrides: { caravan?: boolean; reading?: string | null } = {}) {
  const state = { caravan: overrides.caravan ?? true, saved: null as number | null, going: false };
  const options: HitchOptions = {
    isCaravan: () => state.caravan,
    savedPitch: () => state.saved,
    save: () => {
      if (overrides.reading) return overrides.reading;
      state.saved = 1.5;
      return null;
    },
    isActive: () => state.going && state.saved !== null,
    start: () => void (state.going = true),
    stop: () => void (state.going = false),
  };
  return { options, state };
}

function button(root: HTMLElement, key: Parameters<typeof t>[0]): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === t(key))!;
}

function status(root: HTMLElement): string | null {
  return root.querySelector('.menu__text--status')!.textContent;
}

describe('hitch height section (#598)', () => {
  it('offers only the save button while none is saved', () => {
    const { element } = createHitchSection(fakeHitch().options);
    expect(element.hidden).toBe(false);
    expect(button(element, 'hitch.save').hidden).toBe(false);
    expect(button(element, 'hitch.go').hidden).toBe(true);
    expect(button(element, 'hitch.done').hidden).toBe(true);
    expect(status(element)).toBe(t('hitch.status.none'));
  });

  it('saves, then offers Back to hitch height', () => {
    const { element } = createHitchSection(fakeHitch().options);
    button(element, 'hitch.save').click();
    expect(status(element)).toBe(t('hitch.savedNow'));
    expect(button(element, 'hitch.go').hidden).toBe(false);
  });

  it('shows the message when saving fails, offering nothing more', () => {
    const { element } = createHitchSection(fakeHitch({ reading: 'No reading yet' }).options);
    button(element, 'hitch.save').click();
    expect(status(element)).toBe('No reading yet');
    expect(button(element, 'hitch.go').hidden).toBe(true);
  });

  it('starts going back, and Done ends it', () => {
    const { options, state } = fakeHitch();
    const { element } = createHitchSection(options);
    button(element, 'hitch.save').click();
    button(element, 'hitch.go').click();
    expect(state.going).toBe(true);
    expect(status(element)).toBe(t('hitch.status.active'));
    expect(button(element, 'hitch.go').hidden).toBe(true);
    button(element, 'hitch.done').click();
    expect(state.going).toBe(false);
    expect(status(element)).toBe(t('hitch.status.saved'));
  });

  it('is hidden for a motorhome, and follows a change of vehicle on refresh', () => {
    const { options, state } = fakeHitch({ caravan: false });
    const section = createHitchSection(options);
    expect(section.element.hidden).toBe(true);
    state.caravan = true;
    section.refresh();
    expect(section.element.hidden).toBe(false);
  });

  it('sits under the saved targets, refreshed with them', () => {
    const { options, state } = fakeHitch({ caravan: false });
    const targets = createTargetsSection({
      getTargetPresets: () => [],
      getActiveTargetId: () => null,
      selectTarget: () => {},
      addTargetPreset: () => null,
      deleteTargetPreset: () => {},
      hitch: options,
    });
    const hitch = targets.element.querySelector<HTMLElement>('.hitch')!;
    expect(targets.element.lastElementChild).toBe(hitch);
    expect(hitch.hidden).toBe(true);
    state.caravan = true;
    targets.refresh();
    expect(hitch.hidden).toBe(false);
  });

  it.each(LANGUAGES)('is fully translated in %s', (language) => {
    setLanguage(language);
    const { element } = createHitchSection(fakeHitch().options);
    for (const text of [...element.querySelectorAll('p, button')].map((el) => el.textContent)) {
      expect(text).toBeTruthy();
      expect(text).not.toMatch(/^hitch\./);
    }
  });
});
