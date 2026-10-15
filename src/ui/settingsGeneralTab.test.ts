// @vitest-environment happy-dom
//
// Pins the General tab on its own (#417): which elements it shows and in
// what order, what each control stores, the live previews, the reloads
// Language and Appearance trigger (and the wizard's exceptions), and
// General › More. Only the tab's public surface and the DOM it builds are
// used, so the same tests hold after the tab is split into smaller
// builders.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGeneralTab, type GeneralTab, type GeneralTabActions } from './settingsGeneralTab';
import type { RawSettings, SettingsFormContext, SettingsFormState } from './settingsFields';
import { LANGUAGE_NAMES, LANGUAGES, setLanguage, t } from './i18n';
import { takeReopenSettings } from './reopenSettings';
import { loadSettings } from '../data/settingsStore';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

interface Built {
  tab: GeneralTab;
  state: SettingsFormState;
  context: SettingsFormContext;
  actions: { [K in keyof GeneralTabActions]: ReturnType<typeof vi.fn> };
  changed: ReturnType<typeof vi.fn>;
}

function build(overrides: Partial<LevelSettings> = {}, compact = false): Built {
  const initial: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const state: SettingsFormState = {
    unit: initial.displayUnit,
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const changed = vi.fn();
  const context: SettingsFormContext = {
    state,
    compact,
    changed,
    relabelAll: vi.fn(),
    currentSettings: () => ({ ...initial, soundGuidance: true }),
  };
  const actions = { unitChanged: vi.fn(), resetAll: vi.fn() };
  const tab = createGeneralTab(initial, context, actions);
  // The form relabels the number fields itself, then every tab.
  for (const field of tab.fineTuning) field.relabel();
  tab.relabel();
  return { tab, state, context, actions, changed };
}

function read(tab: GeneralTab): RawSettings {
  const raw: RawSettings = {};
  tab.read(raw);
  return raw;
}

function captionOf(element: Element): string | null {
  return element.classList.contains('settings__field')
    ? (element.firstElementChild?.textContent ?? null)
    : null;
}

function fieldCaptioned(elements: HTMLElement[], caption: string): HTMLElement {
  const found = elements.find((e) => captionOf(e) === caption);
  if (!found) throw new Error(`no field captioned ${caption}`);
  return found;
}

function selectIn(elements: HTMLElement[], caption: string): HTMLSelectElement {
  return fieldCaptioned(elements, caption).querySelector('select')!;
}

function checkboxIn(elements: HTMLElement[], caption: string): HTMLInputElement {
  return fieldCaptioned(elements, caption).querySelector('input')!;
}

function choose(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

let reload: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  reload.mockRestore();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.appearance;
});

describe('layout', () => {
  it('shows Language, the look, Unit, the sound heading and fields, then More', () => {
    const { tab } = build();
    const elements = tab.elements();
    expect(elements.map((e) => captionOf(e) ?? e.className)).toEqual([
      t('settings.language'),
      t('settings.theme'),
      t('settings.appearance'),
      t('settings.unit'),
      'settings__section',
      t('settings.sound'),
      t('settings.soundGuidance'),
      'settings__hint',
      t('settings.soundSpeech'),
      'settings__hint',
      'settings__advanced settings__more',
    ]);
    expect(elements[4]!.textContent).toBe(t('onboard.sound.h'));
    expect(elements[7]!.textContent).toBe(t('settings.soundGuidance.help'));
  });

  it('hands the wizard its language, look and sound steps', () => {
    const { tab } = build();
    const elements = tab.elements();
    expect(tab.languageField).toBe(elements[0]);
    expect(tab.lookElements()).toEqual(elements.slice(1, 3));
    expect(tab.soundElements()).toEqual(elements.slice(5, 10));
  });

  it('translates the theme and appearance options', () => {
    const { tab } = build();
    const elements = tab.elements();
    expect([...selectIn(elements, t('settings.theme')).options].map((o) => o.textContent)).toEqual([
      t('theme.system'),
      t('theme.light'),
      t('theme.dark'),
    ]);
    expect(
      [...selectIn(elements, t('settings.appearance')).options].map((o) => o.textContent),
    ).toEqual([t('appearance.classic'), t('appearance.modern'), t('appearance.glossy')]);
    const units = [...selectIn(elements, t('settings.unit')).options];
    expect(units.map((o) => o.value)).toEqual(['mm', 'cm', 'in']);
    // Inches are named in the language (#627); mm and cm read the same everywhere.
    expect(units.map((o) => o.textContent)).toEqual(['mm', 'cm', t('settings.unitInches')]);
  });
});

describe('Language', () => {
  it('offers Automatic first, then every language named in itself', () => {
    const { tab } = build();
    const select = tab.languageField.querySelector('select')!;
    expect([...select.options].map((o) => [o.value, o.textContent])).toEqual([
      ['auto', t('settings.language.auto')],
      ...LANGUAGES.map((lang) => [lang, LANGUAGE_NAMES[lang]]),
    ]);
    expect(select.value).toBe('auto');
  });

  it('shows the stored language', () => {
    localStorage.setItem('libell.language', 'de');
    const { tab } = build();
    expect(tab.languageField.querySelector('select')!.value).toBe('de');
  });

  it('stores a language, marks Settings to reopen and reloads', () => {
    const { tab } = build();
    choose(tab.languageField.querySelector('select')!, 'fr');
    expect(localStorage.getItem('libell.language')).toBe('fr');
    expect(takeReopenSettings()).toBe('general');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('Automatic clears the stored language', () => {
    localStorage.setItem('libell.language', 'de');
    const { tab } = build();
    choose(tab.languageField.querySelector('select')!, 'auto');
    expect(localStorage.getItem('libell.language')).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('in a wizard step reloads without reopening Settings', () => {
    const { tab } = build({}, true);
    choose(tab.languageField.querySelector('select')!, 'sv');
    expect(takeReopenSettings()).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('Theme, Appearance and Unit', () => {
  it('Theme previews at once and saves', () => {
    const { tab, changed } = build();
    choose(selectIn(tab.elements(), t('settings.theme')), 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(changed).toHaveBeenCalledOnce();
    expect(read(tab).theme).toBe('dark');
  });

  it('Appearance stores the form, marks Settings to reopen and reloads', () => {
    const { tab, changed } = build();
    choose(selectIn(tab.elements(), t('settings.appearance')), 'glossy');
    expect(document.documentElement.dataset.appearance).toBe('glossy');
    expect(loadSettings().soundGuidance).toBe(true);
    expect(takeReopenSettings()).toBe('general');
    expect(reload).toHaveBeenCalledOnce();
    expect(changed).not.toHaveBeenCalled();
  });

  it('Appearance in a wizard step only previews and hands the change to the form', () => {
    const { tab, changed } = build({}, true);
    choose(selectIn(tab.elements(), t('settings.appearance')), 'classic');
    expect(document.documentElement.dataset.appearance).toBeUndefined();
    expect(changed).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem('libell.settings')).toBeNull();
  });

  it('Unit updates the state and reports the previous unit', () => {
    const { tab, state, actions } = build();
    choose(selectIn(tab.elements(), t('settings.unit')), 'cm');
    expect(state.unit).toBe('cm');
    expect(actions.unitChanged).toHaveBeenCalledExactlyOnceWith('mm');
    expect(read(tab).displayUnit).toBe('cm');
  });
});

describe('read, populate and resyncSound', () => {
  it('reads unit, sounds, theme and appearance', () => {
    const { tab } = build({ theme: 'light', appearance: 'classic', soundOnLevel: false });
    expect(read(tab)).toEqual({
      displayUnit: 'mm',
      soundOnLevel: false,
      soundGuidance: false,
      soundSpeech: false,
      theme: 'light',
      appearance: 'classic',
    });
  });

  it('says on the phone whether spoken guidance can speak (#602)', () => {
    const { tab } = build();
    // The test browser has no speech synthesis, so no offline voice.
    expect(tab.elements()[9]!.textContent).toBe(t('settings.soundSpeech.unavailable'));
  });

  it('populate shows and applies the given settings', () => {
    const { tab } = build();
    tab.populate({
      ...DEFAULT_SETTINGS,
      displayUnit: 'cm',
      theme: 'dark',
      appearance: 'glossy',
      soundOnLevel: false,
      soundGuidance: true,
    });
    const elements = tab.elements();
    expect(selectIn(elements, t('settings.unit')).value).toBe('cm');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.appearance).toBe('glossy');
    expect(read(tab)).toMatchObject({
      theme: 'dark',
      appearance: 'glossy',
      soundOnLevel: false,
      soundGuidance: true,
    });
  });

  it('resyncSound takes a sound choice made outside the form', () => {
    const { tab } = build();
    tab.resyncSound({ soundOnLevel: false, soundGuidance: true, soundSpeech: true });
    const elements = tab.elements();
    expect(checkboxIn(elements, t('settings.sound')).checked).toBe(false);
    expect(checkboxIn(elements, t('settings.soundGuidance')).checked).toBe(true);
    expect(checkboxIn(elements, t('settings.soundSpeech')).checked).toBe(true);
  });
});

describe('More', () => {
  function more(tab: GeneralTab): HTMLDetailsElement {
    return tab.elements().at(-1) as HTMLDetailsElement;
  }

  it('is collapsed, with Fine-tuning, its hints and Reset all settings', () => {
    const { tab } = build();
    const details = more(tab);
    expect(details.tagName).toBe('DETAILS');
    expect(details.open).toBe(false);
    expect([...details.children].map((e) => captionOf(e) ?? e.textContent)).toEqual([
      t('settings.more'),
      t('settings.fineTuning'),
      `${t('settings.stability')} (mm)`,
      t('settings.stability.hint'),
      t('settings.dwellRest'),
      t('settings.dwellMotion'),
      t('settings.dwell.hint'),
      t('settings.resetAll'),
    ]);
  });

  it('offers Stability and both response delays as fine-tuning fields', () => {
    const { tab } = build();
    expect(tab.fineTuning.map((f) => f.key)).toEqual([
      'stabilityMm',
      'dwellRestMs',
      'dwellMotionMs',
    ]);
    expect(tab.fineTuning.map((f) => [f.inUnit, f.allowZero])).toEqual([
      [true, true],
      [false, false],
      [false, false],
    ]);
    expect(tab.fineTuning.map((f) => [f.control.min, f.control.step])).toEqual([
      ['0', '0.5'],
      ['50', '50'],
      ['20', '10'],
    ]);
    expect(tab.fineTuning.every((f) => more(tab).contains(f.element))).toBe(true);
  });

  it('Reset all settings asks the form to reset', () => {
    const { tab, actions } = build();
    more(tab).querySelector<HTMLButtonElement>('.settings__reset-all')!.click();
    expect(actions.resetAll).toHaveBeenCalledOnce();
  });
});
