// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createSettingsForm } from './settingsPanel';
import { LANGUAGE_NAMES, LANGUAGES, setLanguage, t } from './i18n';
import { loadLanguage, loadSettings, saveSettings } from '../data/settingsStore';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

function input(form: HTMLFormElement, name: string): HTMLInputElement {
  return form.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

// This whole block exercises the flat, single-page Classic layout — its
// select order and field positions only hold for Classic, so it fixes the
// preset explicitly rather than assuming it from DEFAULT_SETTINGS (#136).
const classic: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'classic' };

describe('settings form', () => {
  it('tells the user where to find the measurements', () => {
    const form = createSettingsForm(classic, vi.fn());
    const hint = form.querySelector('.settings__hint');
    expect(hint?.textContent).toContain('registration');
  });

  it('a caravan is told to measure axle to jockey wheel, not wheelbase (#327)', () => {
    const form = createSettingsForm({ ...classic, vehicleType: 'caravan' }, vi.fn());
    const hint = form.querySelector('.settings__hint')!.textContent!;
    expect(hint).toBe(t('settings.measureHint.caravan'));
    expect(hint).not.toContain(t('settings.wheelbase').toLowerCase());
  });

  it('switching to caravan swaps the measurement hint live (#327)', () => {
    const form = createSettingsForm(classic, vi.fn());
    const vehicleSelect = form.querySelectorAll('select')[0] as HTMLSelectElement;
    vehicleSelect.value = 'caravan';
    vehicleSelect.dispatchEvent(new Event('change'));
    expect(form.querySelector('.settings__hint')!.textContent).toBe(
      t('settings.measureHint.caravan'),
    );
  });

  it('has no selectCalibrationTab in Classic — there are no tabs to select (#155)', () => {
    const form = createSettingsForm(classic, vi.fn());
    expect(form.selectCalibrationTab).toBeUndefined();
  });

  it('"Share vehicle setup" (#207) hands the current form values to the host, unsaved edits included', () => {
    const onShareVehicleSetup = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, vi.fn(), undefined, { onShareVehicleSetup });
    input(form, 'wheelbaseMm').value = '4100';
    form.dispatchEvent(new Event('input'));
    const shareButton = [...form.querySelectorAll('button')].find(
      (b) => b.textContent === t('settings.shareVehicle'),
    )!;
    shareButton.click();
    expect(onShareVehicleSetup).toHaveBeenCalledTimes(1);
    expect(onShareVehicleSetup.mock.calls[0]![0].wheelbaseMm).toBe(4100);
  });

  it('is a no-op when no onShareVehicleSetup host is wired', () => {
    const form = createSettingsForm(classic, vi.fn());
    const shareButton = [...form.querySelectorAll('button')].find(
      (b) => b.textContent === t('settings.shareVehicle'),
    )!;
    expect(() => shareButton.click()).not.toThrow();
  });

  it('round-trips an edited field through save', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    input(form, 'wheelbaseMm').value = '4100';
    form.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0]).toEqual({ ...classic, wheelbaseMm: 4100 });
  });

  it('the wizard falls back to defaults for an invalid field instead of saving garbage', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave, undefined, { compact: 'measurements' });
    input(form, 'wheelbaseMm').value = '-5';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
  });

  it('choosing "Custom set" sticks instead of snapping back to the matching model (#91)', () => {
    const form = createSettingsForm(classic, vi.fn());
    // The default steps match Thule Levelers, so the picker shows it.
    const rampSelect = form.querySelectorAll('select')[2] as HTMLSelectElement;
    expect(rampSelect.value).not.toBe('');
    // Explicitly choosing the custom option must hold, even though the
    // steps still match a catalog model.
    rampSelect.value = '';
    rampSelect.dispatchEvent(new Event('change'));
    expect(rampSelect.value).toBe('');
    // Editing the steps keeps the explicit custom choice.
    const removeFirst = form.querySelector<HTMLButtonElement>('.steps__chip-remove')!;
    removeFirst.click();
    expect(rampSelect.value).toBe('');
    // Picking a model again fills its steps and shows the model.
    rampSelect.value = 'Thule Levelers';
    rampSelect.dispatchEvent(new Event('change'));
    expect(rampSelect.value).toBe('Thule Levelers');
  });

  it('round-trips the axle configuration (#81)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    const axleSelect = form.querySelectorAll('select')[1] as HTMLSelectElement;
    axleSelect.value = 'boggie';
    axleSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].rearAxle).toBe('boggie');
  });

  it('round-trips the ramp count and drain position (#93)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    // Select order: vehicle, axle, ramp model, ramp count, drain, unit, theme, appearance.
    const rampCountSelect = form.querySelectorAll('select')[3] as HTMLSelectElement;
    const drainSelect = form.querySelectorAll('select')[4] as HTMLSelectElement;
    expect(rampCountSelect.value).toBe('2'); // ramps are sold in pairs
    expect(drainSelect.value).toBe('none');
    rampCountSelect.value = '4';
    rampCountSelect.dispatchEvent(new Event('change'));
    drainSelect.value = 'left';
    drainSelect.dispatchEvent(new Event('change'));
    expect(onSave.mock.lastCall![0].rampCount).toBe(4);
    expect(onSave.mock.lastCall![0].drainPosition).toBe('left');
  });

  it('hides the ramp count and drain fields for a caravan', () => {
    const caravan: LevelSettings = { ...classic, vehicleType: 'caravan' };
    const form = createSettingsForm(caravan, vi.fn());
    const rampCountSelect = form.querySelectorAll('select')[3] as HTMLSelectElement;
    expect((rampCountSelect.closest('label') as HTMLLabelElement).hidden).toBe(true);
  });

  // Design review, follow-up: Appearance restructures the whole app
  // (Settings' own tabs-vs-flat layout included, #108), a bootstrap-time
  // decision no live preview can restructure in place — so unlike Theme,
  // changing it now saves the current draft and reloads immediately,
  // the same pattern the Language select already uses just below for the
  // same "t()/appearance isn't reactive" reason. No explicit Save/submit
  // needed first.
  it('changing Appearance saves immediately and reloads, independent of theme (#104 follow-up)', () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    localStorage.removeItem('libell.settings');
    const form = createSettingsForm(classic, vi.fn());
    const selects = form.querySelectorAll('select');
    // Order: vehicle, axle, ramp model, ramp count, drain, unit, language
    // (screen-cleanup follow-up), theme, appearance.
    const themeSelect = selects[6] as HTMLSelectElement;
    const appearanceSelect = selects[7] as HTMLSelectElement;
    expect(appearanceSelect.value).toBe('classic');
    appearanceSelect.value = 'modern';
    appearanceSelect.dispatchEvent(new Event('change'));
    expect(reload).toHaveBeenCalledOnce();
    const saved = loadSettings();
    expect(saved.appearance).toBe('modern');
    // theme (light/dark) is untouched by the appearance choice.
    expect(saved.theme).toBe(themeSelect.value);
    reload.mockRestore();
  });

  // A wizard step previews the choice (live colors) like everywhere else,
  // but must never save-and-reload mid-onboarding — the wizard itself
  // decides when settings are actually persisted.
  it('a compact wizard step previews Appearance without saving or reloading', () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    localStorage.removeItem('libell.settings');
    const form = createSettingsForm(classic, vi.fn(), undefined, { compact: 'appearance' });
    const appearanceSelect = form.querySelectorAll('select')[1] as HTMLSelectElement;
    appearanceSelect.value = 'modern';
    appearanceSelect.dispatchEvent(new Event('change'));
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem('libell.settings')).toBeNull();
    reload.mockRestore();
  });

  it('offers Glossy as a third appearance preset (chat-directed restyle)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    const selects = form.querySelectorAll('select');
    const appearanceSelect = selects[7] as HTMLSelectElement;
    const values = Array.from(appearanceSelect.options).map((o) => o.value);
    expect(values).toEqual(['classic', 'modern', 'glossy']);
    appearanceSelect.value = 'glossy';
    appearanceSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].appearance).toBe('glossy');
  });

  it('keeps math in mm while displaying cm', () => {
    const cmSettings: LevelSettings = { ...classic, displayUnit: 'cm' };
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(cmSettings, onSave);
    // The field shows cm (3800 mm -> 380), but the saved value is mm again.
    expect(input(form, 'wheelbaseMm').value).toBe('380');
    input(form, 'wheelbaseMm').value = '400';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4000);
    expect(onSave.mock.calls[0]![0].displayUnit).toBe('cm');
  });

  it('Classic mode has no tab elements (#108)', () => {
    const form = createSettingsForm(classic, vi.fn());
    expect(form.querySelector('.settings__tabs')).toBeNull();
    expect(form.querySelectorAll('[role="tab"]').length).toBe(0);
    // The original flat structure — a section heading straight in the form.
    expect(form.querySelector('.settings__section')?.textContent).toContain('Vehicle');
  });
});

// #329: Stability and both response delays are tuned rarely if ever, so
// they live under General › More › Fine-tuning — collapsed, and the only
// collapsed settings left (#157's Advanced on Vehicle and Ramps is gone).
describe('settings form — Fine-tuning under General › More (#329)', () => {
  function more(form: HTMLFormElement): HTMLDetailsElement {
    return form.querySelector<HTMLDetailsElement>('.settings__more')!;
  }

  for (const appearance of ['classic', 'modern'] as const) {
    it(`${appearance}: Stability and both response delays sit in More, collapsed`, () => {
      const form = createSettingsForm({ ...DEFAULT_SETTINGS, appearance }, vi.fn());
      expect(more(form).open).toBe(false);
      for (const name of ['stabilityMm', 'dwellRestMs', 'dwellMotionMs']) {
        expect(more(form).querySelector(`input[name="${name}"]`), name).not.toBeNull();
      }
      expect(more(form).textContent).toContain(t('settings.fineTuning'));
      expect(more(form).querySelector('input[name="toleranceMm"]')).toBeNull();
      // No other Advanced disclosure is left (the ramp picker's own
      // "Change ramp" disclosure is navigation, not settings).
      const others = [...form.querySelectorAll('.settings__advanced')].filter(
        (el) =>
          !el.classList.contains('settings__more') &&
          !el.classList.contains('klossar__picker-details'),
      );
      expect(others).toHaveLength(0);
    });
  }

  it('round-trips edited response-delay fields through save, not unit-converted (#183)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    input(form, 'dwellRestMs').value = '500';
    input(form, 'dwellMotionMs').value = '120';
    form.dispatchEvent(new Event('change'));
    expect(onSave.mock.lastCall![0].dwellRestMs).toBe(500);
    expect(onSave.mock.lastCall![0].dwellMotionMs).toBe(120);
  });

  it('never starts expanded, even when a field inside it holds a non-default value', () => {
    const customized: LevelSettings = { ...classic, stabilityMm: classic.stabilityMm + 2 };
    const form = createSettingsForm(customized, vi.fn());
    expect(more(form).open).toBe(false);
  });

  it('a change inside More is saved while it is collapsed', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    input(form, 'stabilityMm').value = String(classic.stabilityMm + 1);
    form.dispatchEvent(new Event('change'));
    expect(onSave.mock.lastCall![0].stabilityMm).toBe(classic.stabilityMm + 1);
  });
});

describe('settings form — Modern tabs (#108)', () => {
  const modern: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };

  function tabButton(form: HTMLFormElement, id: string): HTMLButtonElement {
    return form.querySelector<HTMLButtonElement>(`.settings__tab[data-tab="${id}"]`)!;
  }

  function tabPanel(form: HTMLFormElement, id: string): HTMLElement {
    return form.querySelector<HTMLElement>(`.settings__tabpanel[data-tab="${id}"]`)!;
  }

  // #329: type, axle, the three measurements, one hint and a quiet share
  // link — no Advanced section, no unit field.
  it('the Vehicle tab holds only the vehicle, with a quiet share link', () => {
    const form = createSettingsForm(modern, vi.fn());
    const panel = tabPanel(form, 'vehicle');
    const share = panel.querySelector<HTMLButtonElement>('button.link-button');
    expect(share?.textContent).toBe(t('settings.shareVehicle'));
    expect(panel.querySelector('.settings__advanced')).toBeNull();
    expect(panel.textContent).not.toContain(t('settings.unit'));
    expect(panel.querySelector('input[name="toleranceMm"]')).toBeNull();
    expect(panel.querySelectorAll('.settings__hint')).toHaveLength(1);
  });

  it('renders five tabs in order, Vehicle active by default, and switches on click (#329)', () => {
    const form = createSettingsForm(modern, vi.fn());
    const tabs = form.querySelectorAll('.settings__tab');
    expect(tabs.length).toBe(5);
    // The order a new owner sets things up in: the vehicle, its ramps,
    // calibration, what counts as level, then the rest.
    expect([...tabs].map((tab) => tab.getAttribute('data-tab'))).toEqual([
      'vehicle',
      'ramps',
      'calibration',
      'targets',
      'general',
    ]);
    const vehicleTab = tabButton(form, 'vehicle');
    const rampsTab = tabButton(form, 'ramps');
    const calibrationTab = tabButton(form, 'calibration');
    expect(vehicleTab.getAttribute('aria-selected')).toBe('true');
    expect(rampsTab.getAttribute('aria-selected')).toBe('false');
    expect(tabPanel(form, 'vehicle').hidden).toBe(false);

    rampsTab.click();
    expect(rampsTab.getAttribute('aria-selected')).toBe('true');
    expect(vehicleTab.getAttribute('aria-selected')).toBe('false');
    expect(tabPanel(form, 'vehicle').hidden).toBe(true);
    expect(tabPanel(form, 'ramps').hidden).toBe(false);

    calibrationTab.click();
    expect(tabPanel(form, 'calibration').hidden).toBe(false);
    // The embedded calibration section (#109's component, not a copy) renders.
    expect(tabPanel(form, 'calibration').querySelector('.menu__action')).not.toBeNull();
  });

  it("exposes selectCalibrationTab so the menu's Calibration shortcut can jump here (#155)", () => {
    const form = createSettingsForm(modern, vi.fn());
    expect(typeof form.selectCalibrationTab).toBe('function');
    form.selectCalibrationTab?.();
    expect(tabButton(form, 'calibration').getAttribute('aria-selected')).toBe('true');
    expect(tabButton(form, 'vehicle').getAttribute('aria-selected')).toBe('false');
  });

  // #329: the Level tab (id still 'targets', which the main screen's
  // target badge opens) holds Tolerance, Drain side and the saved targets.
  it("renders a Level tab with Tolerance, Drain side and the saved targets, and exposes selectTargetsTab for the menu's shortcut", () => {
    const form = createSettingsForm(modern, vi.fn());
    const levelTab = tabButton(form, 'targets');
    expect(levelTab.textContent).toBe(t('settings.tab.level'));
    expect(typeof form.selectTargetsTab).toBe('function');

    form.selectTargetsTab?.();
    expect(levelTab.getAttribute('aria-selected')).toBe('true');
    expect(tabButton(form, 'vehicle').getAttribute('aria-selected')).toBe('false');
    const panel = tabPanel(form, 'targets');
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector('input[name="toleranceMm"]')).not.toBeNull();
    expect(panel.textContent).toContain(t('settings.drain'));
    // The embedded targets section (targetsSection.ts, not a copy) renders
    // its "Normal" row even with no host wired (inertTargetsOptions).
    expect(panel.textContent).toContain(t('targets.normal'));
    expect(panel.querySelector('.settings__advanced')).toBeNull();
  });

  it('hides Drain side on the Level tab for a caravan, keeping Tolerance', () => {
    const form = createSettingsForm({ ...modern, vehicleType: 'caravan' }, vi.fn());
    const panel = tabPanel(form, 'targets');
    const drain = [...panel.querySelectorAll<HTMLElement>('.settings__field')].find((f) =>
      f.textContent?.includes(t('settings.drain')),
    )!;
    expect(drain.hidden).toBe(true);
    expect(input(form, 'toleranceMm').closest<HTMLElement>('.settings__field')!.hidden).toBe(false);
  });

  it('renders a General tab with language, theme, appearance, unit and sound', () => {
    const form = createSettingsForm(modern, vi.fn());
    const generalTab = tabButton(form, 'general');
    expect(generalTab.textContent).toBe('General');

    expect(tabPanel(form, 'vehicle').textContent).not.toContain('Theme');

    generalTab.click();
    expect(generalTab.getAttribute('aria-selected')).toBe('true');
    const generalPanel = tabPanel(form, 'general');
    expect(generalPanel.hidden).toBe(false);
    expect(generalPanel.textContent).toContain('Language');
    expect(generalPanel.textContent).toContain('Theme');
    expect(generalPanel.textContent).toContain(t('settings.unit'));
    expect(generalPanel.textContent).toContain('Chime when level');
    // #329: no "the app reloads" hint under Appearance.
    expect(generalPanel.textContent).not.toContain('reload');
    // Language names are literal, never translated (a language name names
    // itself regardless of the current UI language) — all five of them (#178).
    for (const name of ['Svenska', 'English', 'Français', 'Español', 'Deutsch']) {
      expect(generalPanel.textContent, name).toContain(name);
    }
  });

  it('no tab shows a Save, Undo or Reset row (#328)', () => {
    const form = createSettingsForm(modern, vi.fn());
    expect(form.querySelector('.settings__actions, .klossar__footer-actions')).toBeNull();
    for (const tab of ['vehicle', 'ramps', 'targets', 'general']) {
      const labels = [...tabPanel(form, tab).querySelectorAll('button')].map((b) => b.textContent);
      expect(labels).not.toContain(t('settings.undo'));
    }
  });

  describe('the Language select persists the choice and reloads', () => {
    function languageSelect(form: HTMLFormElement): HTMLSelectElement {
      return tabPanel(form, 'general').querySelector<HTMLSelectElement>('.settings__select')!;
    }

    beforeEach(() => {
      localStorage.removeItem('libell.language');
    });

    it('picking Svenska saves "sv"', () => {
      const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const form = createSettingsForm(modern, vi.fn());
      const select = languageSelect(form);
      select.value = 'sv';
      select.dispatchEvent(new Event('change'));
      expect(loadLanguage()).toBe('sv');
      expect(reload).toHaveBeenCalledOnce();
      reload.mockRestore();
    });

    it('picking English saves "en"', () => {
      const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const form = createSettingsForm(modern, vi.fn());
      const select = languageSelect(form);
      select.value = 'en';
      select.dispatchEvent(new Event('change'));
      expect(loadLanguage()).toBe('en');
      reload.mockRestore();
    });

    // #178: the picker is built from `LANGUAGES`, so every shipped language
    // is offered and saves its own code — not just the original sv/en pair.
    it('offers every shipped language plus Automatic', () => {
      const form = createSettingsForm(modern, vi.fn());
      const values = [...languageSelect(form).options].map((option) => option.value);
      expect(values).toEqual(['auto', ...LANGUAGES]);
    });

    // Automatic is pinned to the top and never sorted in among the
    // languages, whichever language is in effect — the alphabetical order
    // below it is asserted in i18n.test.ts.
    it.each(LANGUAGES)('keeps Automatic first with the UI in %s', (lang) => {
      setLanguage(lang);
      try {
        const options = [...languageSelect(createSettingsForm(modern, vi.fn())).options];
        expect(options[0]!.value).toBe('auto');
        expect(options[0]!.textContent).toBe(t('settings.language.auto'));
        expect(options.slice(1).map((option) => option.textContent)).toEqual(
          LANGUAGES.map((l) => LANGUAGE_NAMES[l]),
        );
      } finally {
        setLanguage('en');
      }
    });

    it.each(LANGUAGES)('picking %s saves that language', (lang) => {
      const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const form = createSettingsForm(modern, vi.fn());
      const select = languageSelect(form);
      select.value = lang;
      select.dispatchEvent(new Event('change'));
      expect(loadLanguage()).toBe(lang);
      expect(reload).toHaveBeenCalledOnce();
      reload.mockRestore();
    });

    it('picking Automatic clears any stored override', () => {
      const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      localStorage.setItem('libell.language', 'sv');
      const form = createSettingsForm(modern, vi.fn());
      const select = languageSelect(form);
      select.value = 'auto';
      select.dispatchEvent(new Event('change'));
      expect(loadLanguage()).toBeNull();
      reload.mockRestore();
    });

    it('preselects the select to the currently stored language', () => {
      localStorage.setItem('libell.language', 'en');
      const form = createSettingsForm(modern, vi.fn());
      expect(languageSelect(form).value).toBe('en');
    });
  });

  it('includes Number of ramps, hidden for a caravan, and no Advanced section (#329)', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rampsPanel = tabPanel(form, 'ramps');
    expect(rampsPanel.textContent).toContain(t('settings.rampCount'));
    expect(rampsPanel.textContent).not.toContain(t('settings.drain'));
    expect(
      rampsPanel.querySelector('.settings__advanced:not(.klossar__picker-details)'),
    ).toBeNull();
    // One help text, next to "Number of ramps" (#246).
    expect(rampsPanel.textContent).toContain(t('settings.rampCountHint'));
    expect(rampsPanel.querySelectorAll('.settings__hint')).toHaveLength(1);

    const caravanModern: LevelSettings = { ...modern, vehicleType: 'caravan' };
    const caravanForm = createSettingsForm(caravanModern, vi.fn());
    const caravanRampsPanel = tabPanel(caravanForm, 'ramps');
    const rampCountField = caravanRampsPanel.querySelector<HTMLLabelElement>('.settings__field');
    expect(rampCountField?.hidden).toBe(true);
  });

  it('names the chosen model under the picker, labelled as the selection', () => {
    const form = createSettingsForm(modern, vi.fn());
    const selected = form.querySelector<HTMLElement>('.klossar__selected')!;
    expect(selected.querySelector('.klossar__footer-label')?.textContent).toBe('Selected');
    expect(selected.querySelector('.klossar__footer-model')?.textContent).toBe('Thule Levelers');
  });

  // #246: the chosen ramp used to be on screen three times over — a pinned
  // card above the list, its own row inside the list, and the footer, with
  // the card and the footer both spelling out the same step heights. The
  // list is the picker; exactly one place outside it says what is chosen.
  it('says what is chosen in exactly one place outside the picker', () => {
    const form = createSettingsForm(modern, vi.fn());
    expect(form.querySelector('.klossar__pinned')).toBeNull();

    const outsideThePicker = [
      ...form.querySelectorAll('.klossar__selected, .klossar__footer, .klossar__pinned'),
    ];
    const namingTheModel = outsideThePicker.filter((el) =>
      el.textContent?.includes('Thule Levelers'),
    );
    expect(namingTheModel).toHaveLength(1);

    // And the step heights are spelled out once, in that same place.
    const spellingOutTheSteps = outsideThePicker
      .filter((el) => /44/.test(el.textContent ?? ''))
      .filter((el) => /78/.test(el.textContent ?? ''));
    expect(spellingOutTheSteps).toHaveLength(1);
  });

  it('the brand filter narrows the visible catalog rows', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rows = [
      ...form.querySelectorAll<HTMLElement>('.klossar__row:not(.klossar__row--custom)'),
    ];
    const froliChip = [...form.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
      (c) => c.textContent === 'Froli',
    )!;
    expect(rows.every((r) => !r.hidden)).toBe(true);
    froliChip.click();
    const visible = rows.filter((r) => !r.hidden);
    expect(visible.length).toBe(2);
    for (const row of visible) {
      expect(row.querySelector('.klossar__row-name')?.textContent).toContain('Froli');
    }
    // "Alla" brings everything back.
    const allChip = [...form.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
      (c) => c.textContent === 'All',
    )!;
    allChip.click();
    expect(rows.every((r) => !r.hidden)).toBe(true);
  });

  it('picking a model updates the fixed footer step preview immediately', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rows = [
      ...form.querySelectorAll<HTMLElement>('.klossar__row:not(.klossar__row--custom)'),
    ];
    const milenco = rows.find(
      (r) => r.querySelector('.klossar__row-name')?.textContent === 'Milenco Quattro Level',
    )!;
    milenco.click();

    const footerModel = form.querySelector('.klossar__footer-model');
    expect(footerModel?.textContent).toBe('Milenco Quattro Level');
    const values = [...form.querySelectorAll('.klossar__grid-value')].map((el) => el.textContent);
    expect(values).toEqual(['40', '80', '120', '160']);
  });

  // R14: every displayed length follows "Show lengths in" — the catalog
  // preview and the fixed footer had been stuck showing raw mm regardless
  // of that setting; only the chip editor above them converted.
  it('shows the catalog preview and footer grid in cm when displayUnit is cm (R14)', () => {
    const cmModern: LevelSettings = { ...modern, displayUnit: 'cm' };
    const form = createSettingsForm(cmModern, vi.fn());

    const rows = [
      ...form.querySelectorAll<HTMLElement>('.klossar__row:not(.klossar__row--custom)'),
    ];
    const milenco = rows.find(
      (r) => r.querySelector('.klossar__row-name')?.textContent === 'Milenco Quattro Level',
    )!;
    expect(milenco.querySelector('.klossar__row-mm')?.textContent).toBe('4/8/12/16 cm');

    milenco.click();

    expect(form.querySelector('.klossar__footer-heading')?.textContent).toBe('Step heights (cm)');
    const values = [...form.querySelectorAll('.klossar__grid-value')].map((el) => el.textContent);
    expect(values).toEqual(['4', '8', '12', '16']);
  });

  // #246: "Custom set" is one of the choices, so it lives in the list of
  // choices — it used to sit outside and below the picker, as though it
  // were a different kind of thing.
  // #246: the filter and the catalogue it narrows are one disclosure, not
  // a filter on the tab and the thing it filters somewhere else. Closed by
  // default, because the tab's common errand is checking what is set.
  it('keeps the filter and the catalogue together in one collapsed disclosure', () => {
    const form = createSettingsForm(modern, vi.fn());
    const picker = form.querySelector<HTMLDetailsElement>('.klossar__picker-details')!;
    expect(picker.open).toBe(false);
    expect(picker.contains(form.querySelector('.klossar__filter')!)).toBe(true);
    expect(picker.contains(form.querySelector('.klossar__list')!)).toBe(true);
    // And it says what it does, rather than naming only the filter.
    expect(picker.querySelector('summary')?.textContent).toBe('Change ramp');
  });

  it('offers "Custom set" as the first entry of the picker itself', () => {
    const form = createSettingsForm(modern, vi.fn());
    const list = form.querySelector<HTMLElement>('.klossar__list')!;
    const custom = form.querySelector<HTMLElement>('.klossar__row--custom')!;
    expect(list.contains(custom)).toBe(true);
    // It leads: the one entry relevant whatever brand you own.
    expect(list.firstElementChild).toBe(custom);
  });

  it('keeps "Custom set" offered when the brand filter narrows the models', () => {
    const form = createSettingsForm(modern, vi.fn());
    const custom = form.querySelector<HTMLElement>('.klossar__row--custom')!;
    const froli = [...form.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
      (c) => c.textContent === 'Froli',
    )!;
    froli.click();
    // Narrowing to a brand says which ready-made models to show; it does
    // not withdraw the option of entering your own step heights.
    expect(custom.hidden).toBe(false);
  });

  // #246: the answer comes first and the means of changing it below —
  // what is set, the settings that follow from it, then the picker.
  it('puts the selection first and the picker last', () => {
    const form = createSettingsForm(modern, vi.fn());
    const panel = form.querySelector<HTMLElement>('.settings__tabpanel--klossar')!;
    const children = [...panel.children];
    const indexOf = (el: Element) => children.findIndex((c) => c === el || c.contains(el));
    const order = [
      panel.querySelector('.klossar__selected')!,
      panel.querySelector('.settings__field')!,
      panel.querySelector('.klossar__picker-details')!,
    ].map(indexOf);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // And every one of them is actually on the panel, so a missing
    // element cannot make the sequence trivially true.
    expect(order.every((i) => i >= 0)).toBe(true);
  });

  it('picking "Egen uppsättning" reveals the chip editor, and the footer says so', () => {
    const form = createSettingsForm(modern, vi.fn());
    const customRow = form.querySelector<HTMLElement>('.klossar__row--custom')!;
    const editor = form.querySelector<HTMLElement>('.klossar__custom-editor')!;
    expect(editor.hidden).toBe(true);
    customRow.click();
    expect(editor.hidden).toBe(false);
    expect(form.querySelector('.klossar__footer-model')?.textContent).toBe('Custom set');
  });

  it('shows the calibration tab as a two-step checklist (#330)', () => {
    const form = createSettingsForm(modern, vi.fn());
    const steps = tabPanel(form, 'calibration').querySelectorAll('.box-step');
    expect(steps).toHaveLength(2);
  });

  it('embeds a working calibration section in the Kalibrering tab (#109)', () => {
    const calibrate = vi.fn(() => null);
    const form = createSettingsForm(modern, vi.fn(), {
      appearance: modern.appearance,
      getCalibration: () => null,
      calibrate,
      readTilt: () => 'no sensor',
      applyCalibration: () => {},
      clearCalibration: () => {},
      getVehicleCalibration: () => null,
      calibrateVehicle: () => null,
      getCalibrationCapturedAt: () => null,
      getVehicleCalibrationCapturedAt: () => null,
      checkCalibration: () => '',
      checkVehicleCalibration: () => '',
      clearVehicleCalibration: () => {},
    });
    tabButton(form, 'calibration').click();
    const calibrationPanel = tabPanel(form, 'calibration');
    const calibrateButton = [
      ...calibrationPanel.querySelectorAll<HTMLButtonElement>('button'),
    ].find((b) => b.textContent === 'Calibrate now')!;
    calibrateButton.click();
    expect(calibrate).toHaveBeenCalledTimes(1);
  });
});

// Classic split pages (screen-cleanup follow-up): mirrors Modern's tabs
// one-for-one, but as `classicPages` bodies instead. General/Fordon/Klossar/
// Targets must show the exact same Reset/Undo/Save row Modern's equivalent
// tabs show — a gap here (Reset missing from General/Ramps, and Targets
// having no row at all) is exactly the "settings look different between
// Classic and Modern" regression this locks down.
describe('settings form — Classic split pages (screen-cleanup follow-up)', () => {
  const classicSplit: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'classic' };

  it('no page shows a Save, Undo or Reset row (#328)', () => {
    const form = createSettingsForm(classicSplit, vi.fn(), undefined, { splitPages: true });
    for (const page of ['general', 'vehicle', 'ramps', 'targets'] as const) {
      expect(form.classicPages![page].querySelector('.settings__actions')).toBeNull();
    }
  });

  // Same groups as Modern's tabs (#329), as ☰ pages.
  it('groups the pages like the Modern tabs', () => {
    const form = createSettingsForm(classicSplit, vi.fn(), undefined, { splitPages: true });
    const pages = form.classicPages!;
    // The Level page: Tolerance, Drain side and the targets section.
    expect(pages.targets.querySelector('input[name="toleranceMm"]')).not.toBeNull();
    expect(pages.targets.textContent).toContain(t('settings.drain'));
    expect(pages.targets.textContent).toContain(t('targets.normal'));
    // Vehicle: no Advanced, no unit field, quiet share link.
    expect(pages.vehicle.querySelector('.settings__advanced')).toBeNull();
    expect(pages.vehicle.textContent).not.toContain(t('settings.unit'));
    expect(pages.vehicle.querySelector('button.link-button')).not.toBeNull();
    // General: unit, and More holding Fine-tuning.
    expect(pages.general.textContent).toContain(t('settings.unit'));
    expect(pages.general.querySelector('.settings__more input[name="stabilityMm"]')).not.toBeNull();
    // Ramps: no Advanced besides the ramp picker itself.
    expect(
      pages.ramps.querySelector('.settings__advanced:not(.klossar__picker-details)'),
    ).toBeNull();
  });

  // #331: Classic and Glossy get Modern's Ramps page, only styled
  // differently — not the wizard's compact select.
  for (const appearance of ['classic', 'glossy'] as const) {
    it(`${appearance}: ☰ → Ramps is the same page as Modern's Ramps tab`, () => {
      const form = createSettingsForm({ ...DEFAULT_SETTINGS, appearance }, vi.fn(), undefined, {
        splitPages: true,
      });
      const page = form.classicPages!.ramps;
      expect(page.querySelector('.klossar__selected')?.textContent).toContain(
        t('settings.klossar.selected'),
      );
      expect(page.textContent).toContain(t('settings.rampCount'));
      const picker = page.querySelector<HTMLDetailsElement>('.klossar__picker-details')!;
      expect(picker.open).toBe(false);
      expect(picker.querySelector('.klossar__filter')).not.toBeNull();
      expect(picker.querySelector('.klossar__row')?.classList).toContain('klossar__row--custom');
      // No ready-made-ramp <select>: the catalogue is the picker.
      expect(page.textContent).not.toContain(t('settings.ramp'));
    });
  }

  it('a ramp picked on the Classic Ramps page is saved at once', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classicSplit, onSave, undefined, { splitPages: true });
    const rows = [...form.classicPages!.ramps.querySelectorAll<HTMLButtonElement>('.klossar__row')];
    const other = rows.find(
      (r) =>
        !r.classList.contains('klossar__row--custom') &&
        !r.classList.contains('klossar__row--selected'),
    )!;
    other.click();
    expect(onSave).toHaveBeenCalled();
    expect(onSave.mock.lastCall![0].rampStepHeightsMm).not.toEqual(
      DEFAULT_SETTINGS.rampStepHeightsMm,
    );
  });
});

describe('settings form — compact mode (#156)', () => {
  it('renders only Wheelbase and Track width front/rear, no tabs, no Advanced', () => {
    for (const settings of [classic, { ...classic, appearance: 'modern' as const }]) {
      const form = createSettingsForm(settings, vi.fn(), undefined, { compact: 'measurements' });
      expect(form.querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
      expect(form.querySelector('input[name="trackWidthFrontMm"]')).not.toBeNull();
      expect(form.querySelector('input[name="trackWidthRearMm"]')).not.toBeNull();
      expect(form.querySelector('input[name="toleranceMm"]')).toBeNull();
      expect(form.querySelector('.settings__tabs')).toBeNull();
      expect(form.querySelector('.settings__advanced')).toBeNull();
      expect(form.querySelector('select')).toBeNull();
    }
  });

  it('still round-trips a compact field through Save', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave, undefined, { compact: 'measurements' });
    input(form, 'wheelbaseMm').value = '4100';
    form.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4100);
  });

  it('defaults to the full (non-compact) render when no formOptions are passed', () => {
    const form = createSettingsForm(classic, vi.fn());
    expect(form.querySelector('select')).not.toBeNull();
  });

  // Design review: a compact form's own Save/Undo/Reset row used to render
  // right alongside the wizard's Next/Skip/Back — two "confirm" controls
  // per screen, one of which (Reset) could silently stage every field back
  // to factory defaults, including fields this reduced form never shows.
  // Removing the row (not just fixing Reset's scope) is the actual fix:
  // there is nothing left here for a first-time user to parse but the
  // fields themselves — Next (tested via onboarding.ts) is the only save
  // path. Save/Undo/Reset are unaffected on the full, non-compact form.
  it('renders no Save/Undo/Reset row in any compact mode', () => {
    for (const compact of ['measurements', 'language', 'appearance', 'sound', 'ramps'] as const) {
      const form = createSettingsForm(classic, vi.fn(), undefined, { compact });
      expect(form.querySelector('.settings__actions')).toBeNull();
      const buttonTexts = [...form.querySelectorAll('button')].map((b) => b.textContent);
      expect(buttonTexts).not.toContain(t('settings.undo'));
      expect(buttonTexts).not.toContain(t('settings.resetAll'));
    }
  });
});

describe('settings form — resyncSoundFields (#161)', () => {
  function soundCheckboxes(form: HTMLFormElement): HTMLInputElement[] {
    return [...form.querySelectorAll<HTMLInputElement>('.settings__checkbox')];
  }

  it('updates the Chime/Continuous-audio-guidance checkboxes from an external change', () => {
    const settings: LevelSettings = { ...classic, soundOnLevel: true, soundGuidance: false };
    const form = createSettingsForm(settings, vi.fn());
    const [chime, guidance] = soundCheckboxes(form);
    expect(chime!.checked).toBe(true);
    expect(guidance!.checked).toBe(false);

    form.resyncSoundFields?.({ soundOnLevel: false, soundGuidance: true });
    expect(chime!.checked).toBe(false);
    expect(guidance!.checked).toBe(true);
  });

  it('a resync is not a change: nothing is saved until the user edits (#328)', () => {
    const settings: LevelSettings = { ...classic, soundOnLevel: true, soundGuidance: true };
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(settings, onSave);
    form.resyncSoundFields?.({ soundOnLevel: false, soundGuidance: false });
    expect(onSave).not.toHaveBeenCalled();

    const [chime] = soundCheckboxes(form);
    chime!.checked = true;
    chime!.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.lastCall![0]).toMatchObject({ soundOnLevel: true, soundGuidance: false });
  });

  it('exists in Modern and compact too, not just Classic', () => {
    const modern: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };
    expect(typeof createSettingsForm(modern, vi.fn()).resyncSoundFields).toBe('function');
    expect(
      typeof createSettingsForm(classic, vi.fn(), undefined, { compact: 'measurements' })
        .resyncSoundFields,
    ).toBe('function');
  });
});

describe('settings form — every change is saved at once (#328)', () => {
  const modern: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };

  beforeEach(() => {
    localStorage.clear();
    for (const toast of document.querySelectorAll('.toast')) toast.remove();
  });

  function change(element: HTMLElement): void {
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function undoButton(): HTMLButtonElement {
    return document.querySelector<HTMLButtonElement>('.toast__action')!;
  }

  it('stores a changed select at once and says so, with Undo', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    const theme = [...form.querySelectorAll<HTMLSelectElement>('select')].find((s) =>
      [...s.options].some((o) => o.value === 'dark'),
    )!;
    theme.value = 'dark';
    change(theme);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.lastCall![0].theme).toBe('dark');
    expect(loadSettings().theme).toBe('dark');
    expect(document.querySelector('.toast')?.textContent).toContain(t('settings.saved'));
    expect(undoButton().textContent).toBe(t('settings.undo'));
  });

  it('saves a number when the field is left, never half-typed', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    input(form, 'wheelbaseMm').value = '42';
    input(form, 'wheelbaseMm').dispatchEvent(new Event('input', { bubbles: true }));
    expect(onSave).not.toHaveBeenCalled();
    input(form, 'wheelbaseMm').value = '4200';
    change(input(form, 'wheelbaseMm'));
    expect(onSave.mock.lastCall![0].wheelbaseMm).toBe(4200);
  });

  it('Undo puts the previous value back and stores it', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    input(form, 'wheelbaseMm').value = '4200';
    change(input(form, 'wheelbaseMm'));
    undoButton().click();
    expect(input(form, 'wheelbaseMm').value).toBe(String(modern.wheelbaseMm));
    expect(onSave.mock.lastCall![0].wheelbaseMm).toBe(modern.wheelbaseMm);
    expect(loadSettings().wheelbaseMm).toBe(modern.wheelbaseMm);
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('keeps the value in effect when a typed number cannot be used, and says why', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    input(form, 'wheelbaseMm').value = '-5';
    change(input(form, 'wheelbaseMm'));
    expect(onSave).not.toHaveBeenCalled();
    expect(input(form, 'wheelbaseMm').value).toBe(String(modern.wheelbaseMm));
    const error = form.querySelector<HTMLElement>('.settings__error')!;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe(t('settings.err.positive'));

    input(form, 'wheelbaseMm').value = '4000';
    change(input(form, 'wheelbaseMm'));
    expect(error.hidden).toBe(true);
    expect(onSave.mock.lastCall![0].wheelbaseMm).toBe(4000);
  });

  it('never puts back an older sensor choice made while the page was open', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    saveSettings({ ...modern, sensorSource: 'xparkle' });
    input(form, 'wheelbaseMm').value = '4200';
    change(input(form, 'wheelbaseMm'));
    expect(onSave.mock.lastCall![0].sensorSource).toBe('xparkle');
    expect(loadSettings().sensorSource).toBe('xparkle');
  });

  it('"Reset all settings" sits under General › More, resets every tab and can be undone', () => {
    const custom: LevelSettings = { ...modern, wheelbaseMm: 4500, theme: 'dark' };
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(custom, onSave);
    const more = form.querySelector<HTMLDetailsElement>(
      '.settings__tabpanel[data-tab="general"] .settings__more',
    )!;
    const reset = more.querySelector<HTMLButtonElement>('.settings__reset-all')!;
    expect(reset.textContent).toBe(t('settings.resetAll'));
    reset.click();
    expect(onSave.mock.lastCall![0]).toMatchObject({
      wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm,
      theme: DEFAULT_SETTINGS.theme,
      appearance: 'modern',
    });
    undoButton().click();
    expect(onSave.mock.lastCall![0]).toMatchObject({ wheelbaseMm: 4500, theme: 'dark' });
  });
});
