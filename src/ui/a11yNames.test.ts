// @vitest-environment happy-dom
// Accessible names and states (#535): the page's language, which list row
// is selected, what a field wants, and names that start with what is seen.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { attachUpdateCheck } from './appUpdate';
import { LANGUAGES, setLanguage, t } from './i18n';
import { createIndicators } from './indicators';
import { createRampsTab } from './settingsRampsTab';
import type { SettingsFormContext, SettingsFormState } from './settingsFields';
import { createTargetsSection } from './targetsSection';

afterEach(() => setLanguage('en'));

describe('the page language', () => {
  it('follows the app language, so a reader uses the right voice', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      expect(document.documentElement.lang).toBe(lang);
    }
  });
});

describe('single-choice lists say which row is selected', () => {
  it('marks the active target row pressed and the others not', () => {
    const section = createTargetsSection({
      getTargetPresets: () => [{ id: 'p', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } }],
      getActiveTargetId: () => 'p',
      selectTarget: () => {},
      addTargetPreset: () => null,
      deleteTargetPreset: () => {},
    });
    const rows = [...section.element.querySelectorAll('.choice__row-select')];
    expect(rows.map((row) => row.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
  });

  it('marks the chosen catalogue row pressed, and moves it with the choice', () => {
    const { panel } = rampsPage();
    const rows = [...panel.querySelectorAll<HTMLButtonElement>('.klossar__row')];
    const pressed = () =>
      rows.filter((row) => row.getAttribute('aria-pressed') === 'true').map(nameOf);
    expect(pressed()).toEqual(['Thule Levelers']);
    rows.find((row) => nameOf(row) !== 'Thule Levelers' && row.dataset.model !== 'custom')!.click();
    expect(pressed()).not.toContain('Thule Levelers');
    expect(pressed()).toHaveLength(1);
  });
});

describe('fields say what to type', () => {
  it('names the target-name field in the chosen language', () => {
    setLanguage('sv');
    const section = createTargetsSection({
      getTargetPresets: () => [],
      getActiveTargetId: () => null,
      selectTarget: () => {},
      addTargetPreset: () => null,
      deleteTargetPreset: () => {},
    });
    const input = section.element.querySelector('.name-prompt__input');
    expect(input?.getAttribute('aria-label')).toBe(t('targets.name.label'));
    expect(t('targets.name.label')).toBe('Namn på det nya målet');
  });

  it('names the add-step field with its unit, and renames it when the unit changes', () => {
    const { tab, state, panel } = rampsPage();
    // The Ramps page's custom editor holds the step editor once it is built.
    const input = panel.querySelector('.steps__add input');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('aria-label')).toBe('New step height (mm)');
    state.unit = 'cm';
    tab.relabel();
    expect(input?.getAttribute('aria-label')).toBe('New step height (cm)');
  });
});

describe('names start with what is seen', () => {
  it('starts each lamp’s name with its own words, then says what is missing', () => {
    const indicators = createIndicators(vi.fn());
    indicators.update({ settingsSaved: false, calibrationLamp: 'calibrate' });
    for (const lamp of indicators.element.querySelectorAll<HTMLButtonElement>(
      '.indicators__lamp',
    )) {
      const name = lamp.getAttribute('aria-label') ?? '';
      expect(name.startsWith(lamp.textContent ?? '')).toBe(true);
      expect(name).toContain(lamp.title);
    }
  });

  it('starts the version title’s name with the name and version shown', () => {
    const identity = document.createElement('div');
    const title = document.createElement('h1');
    title.textContent = 'Libell';
    const version = document.createElement('p');
    version.textContent = 'v1.2.0 – CR99';
    identity.append(title, '\n  ', version);
    attachUpdateCheck(identity, { getRegistration: async () => undefined, isOnline: () => true });
    expect(identity.getAttribute('aria-label')).toBe(`Libell v1.2.0 – CR99. ${t('update.check')}`);
  });
});

function nameOf(row: HTMLElement): string {
  return row.querySelector('.klossar__row-name')?.textContent ?? '';
}

function rampsPage() {
  const initial = { ...DEFAULT_SETTINGS, displayUnit: 'mm' as const };
  const state: SettingsFormState = {
    unit: 'mm',
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const context: SettingsFormContext = {
    state,
    compact: false,
    changed: vi.fn(),
    relabelAll: vi.fn(),
    currentSettings: () => initial,
  };
  const tab = createRampsTab(initial, context);
  const panel = document.createElement('div');
  tab.buildPage(panel);
  tab.relabel();
  tab.render();
  return { tab, state, panel };
}
