// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createSettingsForm } from './settingsPanel';
import { setLanguage, t } from './i18n';
import { loadLanguage, loadSettings } from '../data/settingsStore';
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

  it('has no selectCalibrationTab in Classic — there are no tabs to select (#155)', () => {
    const form = createSettingsForm(classic, vi.fn());
    expect(form.selectCalibrationTab).toBeUndefined();
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

  it('falls back to defaults for an invalid field instead of saving garbage', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
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
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].rampCount).toBe(4);
    expect(onSave.mock.calls[0]![0].drainPosition).toBe('left');
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
    const themeSelect = selects[7] as HTMLSelectElement;
    const appearanceSelect = selects[8] as HTMLSelectElement;
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
    const appearanceSelect = selects[8] as HTMLSelectElement;
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

describe('settings form — Advanced disclosure (#157)', () => {
  // Vehicle's own Advanced (Tolerance/Stability/dwell) — not the Ramps
  // tab's separate Drain disclosure (`.settings__advanced--drain` below),
  // which also matches the bare `.settings__advanced` class.
  function advanced(form: HTMLFormElement): HTMLDetailsElement {
    return [...form.querySelectorAll<HTMLDetailsElement>('.settings__advanced')].find(
      (el) => !el.classList.contains('settings__advanced--drain'),
    )!;
  }

  it('Classic: Tolerance/Stability/Appearance/Chime/Continuous audio guidance are collapsed by default', () => {
    const form = createSettingsForm(classic, vi.fn());
    expect(advanced(form).open).toBe(false);
    expect(advanced(form).querySelector('input[name="toleranceMm"]')).not.toBeNull();
    expect(advanced(form).querySelector('input[name="stabilityMm"]')).not.toBeNull();
    expect(advanced(form).querySelector('input[name="dwellRestMs"]')).not.toBeNull();
    expect(advanced(form).querySelector('input[name="dwellMotionMs"]')).not.toBeNull();
    // Fields that stay visible by default are outside the disclosure.
    expect(advanced(form).querySelector('input[name="wheelbaseMm"]')).toBeNull();
  });

  it('round-trips edited response-delay fields through save, not unit-converted (#183)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    input(form, 'dwellRestMs').value = '500';
    input(form, 'dwellMotionMs').value = '120';
    form.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].dwellRestMs).toBe(500);
    expect(onSave.mock.calls[0]![0].dwellMotionMs).toBe(120);
  });

  it('never starts expanded, even when a field inside it holds a non-default value', () => {
    const customized: LevelSettings = { ...classic, toleranceMm: classic.toleranceMm + 15 };
    const form = createSettingsForm(customized, vi.fn());
    expect(advanced(form).open).toBe(false);
  });

  it('Save/Undo still apply to fields inside Advanced while it is collapsed', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(classic, onSave);
    expect(advanced(form).open).toBe(false);
    input(form, 'toleranceMm').value = String(classic.toleranceMm + 5);
    form.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].toleranceMm).toBe(classic.toleranceMm + 5);
  });

  it('Modern: the Vehicle tab collapses the same fields behind Advanced', () => {
    const modern: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };
    const form = createSettingsForm(modern, vi.fn());
    expect(advanced(form).open).toBe(false);
    expect(advanced(form).querySelector('input[name="toleranceMm"]')).not.toBeNull();
    expect(advanced(form).querySelector('input[name="wheelbaseMm"]')).toBeNull();
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

  it('renders five tabs in order, General active by default, and switches on click', () => {
    const form = createSettingsForm(modern, vi.fn());
    const tabs = form.querySelectorAll('.settings__tab');
    expect(tabs.length).toBe(5);
    // General and Kalibrering lead (screen-cleanup follow-up): language/
    // theme color how the rest of the screen reads, and calibration is the
    // other must-do besides the vehicle's own measurements.
    expect([...tabs].map((tab) => tab.getAttribute('data-tab'))).toEqual([
      'general',
      'calibration',
      'vehicle',
      'ramps',
      'targets',
    ]);
    const generalTab = tabButton(form, 'general');
    const rampsTab = tabButton(form, 'ramps');
    const calibrationTab = tabButton(form, 'calibration');
    expect(generalTab.getAttribute('aria-selected')).toBe('true');
    expect(rampsTab.getAttribute('aria-selected')).toBe('false');
    expect(tabPanel(form, 'general').hidden).toBe(false);

    rampsTab.click();
    expect(rampsTab.getAttribute('aria-selected')).toBe('true');
    expect(generalTab.getAttribute('aria-selected')).toBe('false');
    expect(tabPanel(form, 'general').hidden).toBe(true);
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
    expect(tabButton(form, 'general').getAttribute('aria-selected')).toBe('false');
  });

  // Targets folded in as a tab (screen-cleanup follow-up), same
  // embed-and-shortcut pattern as Kalibrering above.
  it("renders a Targets tab with the embedded targets section, and exposes selectTargetsTab for the menu's shortcut", () => {
    const form = createSettingsForm(modern, vi.fn());
    const targetsTab = tabButton(form, 'targets');
    expect(targetsTab.textContent).toBe('Targets');
    expect(typeof form.selectTargetsTab).toBe('function');

    form.selectTargetsTab?.();
    expect(targetsTab.getAttribute('aria-selected')).toBe('true');
    expect(tabButton(form, 'general').getAttribute('aria-selected')).toBe('false');
    expect(tabPanel(form, 'targets').hidden).toBe(false);
    // The embedded targets section (targetsSection.ts, not a copy) renders
    // its "Normal" row even with no host wired (inertTargetsOptions).
    expect(tabPanel(form, 'targets').textContent).toContain('Normal');
  });

  // Language/Theme/Sound folded into a General tab (screen-cleanup
  // follow-up) — promoted out of Vehicle/Advanced since they're common
  // enough to want a visible home of their own.
  it('renders a General tab with language, theme and sound — no longer inside Vehicle/Advanced', () => {
    const form = createSettingsForm(modern, vi.fn());
    const generalTab = tabButton(form, 'general');
    expect(generalTab.textContent).toBe('General');

    const vehiclePanel = tabPanel(form, 'vehicle');
    expect(vehiclePanel.textContent).not.toContain('Theme'); // moved to General

    generalTab.click();
    expect(generalTab.getAttribute('aria-selected')).toBe('true');
    const generalPanel = tabPanel(form, 'general');
    expect(generalPanel.hidden).toBe(false);
    expect(generalPanel.textContent).toContain('Language');
    expect(generalPanel.textContent).toContain('Theme');
    expect(generalPanel.textContent).toContain('Chime when level');
    // "Svenska"/"English" are literal, never translated (a language name
    // names itself regardless of the current UI language).
    expect(generalPanel.textContent).toContain('Svenska');
    expect(generalPanel.textContent).toContain('English');
  });

  // Design review: every tab that edits form fields (General/Fordon/
  // Klossar) gets its own working Save/Undo — General used to have none
  // at all, so editing Language/Theme/Sound had no way to save without
  // switching to another tab first.
  it('the General tab has its own working Save/Undo', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    const generalPanel = tabPanel(form, 'general');
    const generalSave = generalPanel.querySelector<HTMLButtonElement>(
      '.settings__actions button[type="submit"]',
    )!;
    const generalUndo = generalPanel.querySelectorAll<HTMLButtonElement>(
      '.settings__actions button',
    )[1]!;
    expect(generalSave.disabled).toBe(true);
    expect(generalUndo.disabled).toBe(true);

    const themeSelect = generalPanel.querySelectorAll<HTMLSelectElement>('.settings__select')[1]!;
    themeSelect.value = 'dark';
    themeSelect.dispatchEvent(new Event('change'));
    expect(generalSave.disabled).toBe(false);
    expect(generalUndo.disabled).toBe(false);

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0].theme).toBe('dark');
    expect(generalSave.disabled).toBe(true);

    themeSelect.value = 'light';
    themeSelect.dispatchEvent(new Event('change'));
    expect(generalUndo.disabled).toBe(false);
    generalUndo.click();
    expect(themeSelect.value).toBe('dark');
    expect(generalSave.disabled).toBe(true);
  });

  // Design review, then a follow-up: "exakt samma" means every tab —
  // Targets was wrongly skipped as "immediate-apply like Kalibrering"
  // the first time around; only Kalibrering is actually exempt (no
  // "unsaved" form state at all).
  it('General, Fordon, Klossar and Targets all show the exact same three action buttons, Reset/Undo/Save in that order', () => {
    const form = createSettingsForm(modern, vi.fn());
    for (const tab of ['general', 'vehicle', 'ramps', 'targets']) {
      const panel = tabPanel(form, tab);
      const actions = panel.querySelector<HTMLElement>(
        '.settings__actions, .klossar__footer-actions',
      )!;
      const labels = [...actions.querySelectorAll('button')].map((b) => b.textContent);
      // Design review, follow-up: Save (biggest/green, the primary action)
      // moved last — Reset and Undo swapped ahead of it.
      expect(labels).toEqual(['Reset to defaults', 'Undo changes', 'Save']);
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

  // Pre-existing gap found during the Classic split-pages review: Number of
  // ramps / Waste-water drain were never appended anywhere in the Klossar
  // tab, unlike Classic's Ramps page, which has always had them.
  it('includes Number of ramps and Waste-water drain, hidden for a caravan', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rampsPanel = tabPanel(form, 'ramps');
    expect(rampsPanel.textContent).toContain(t('settings.rampCount'));
    expect(rampsPanel.textContent).toContain(t('settings.drain'));

    const caravanModern: LevelSettings = { ...modern, vehicleType: 'caravan' };
    const caravanForm = createSettingsForm(caravanModern, vi.fn());
    const caravanRampsPanel = tabPanel(caravanForm, 'ramps');
    const rampCountField = caravanRampsPanel.querySelector<HTMLLabelElement>('.settings__field');
    expect(rampCountField?.hidden).toBe(true);
  });

  // Design review: Drain side only matters if the owner cares where sink/
  // shower water drains — moved behind its own Advanced disclosure
  // instead of sitting unconditionally in the main Klossar flow.
  it('tucks Waste-water drain behind its own Advanced disclosure, collapsed by default', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rampsPanel = tabPanel(form, 'ramps');
    const drainAdvanced = rampsPanel.querySelector<HTMLDetailsElement>(
      '.settings__advanced--drain',
    )!;
    expect(drainAdvanced.open).toBe(false);
    expect(drainAdvanced.querySelector('select')?.closest('label')?.textContent).toContain(
      t('settings.drain'),
    );
    // The general ramp-placement hint stays visible outside Advanced.
    expect(rampsPanel.textContent).toContain(t('settings.rampHint'));

    const caravanModern: LevelSettings = { ...modern, vehicleType: 'caravan' };
    const caravanForm = createSettingsForm(caravanModern, vi.fn());
    const caravanDrainAdvanced = tabPanel(caravanForm, 'ramps').querySelector<HTMLDetailsElement>(
      '.settings__advanced--drain',
    )!;
    expect(caravanDrainAdvanced.hidden).toBe(true);
  });

  it('shows the pinned card for the default (catalog) model, with its step count', () => {
    const form = createSettingsForm(modern, vi.fn());
    const pinned = form.querySelector<HTMLElement>('.klossar__pinned')!;
    expect(pinned.hidden).toBe(false);
    expect(pinned.querySelector('.klossar__pinned-name')?.textContent).toBe('Thule Levelers');
    expect(pinned.querySelector('.klossar__pinned-sub')?.textContent).toContain('44 / 78 / 112');
    expect(pinned.querySelector('.klossar__pinned-sub')?.textContent).toContain('3 steps');
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

    // The pinned card follows the new selection too.
    expect(form.querySelector('.klossar__pinned-name')?.textContent).toBe('Milenco Quattro Level');
  });

  // R14: every displayed length follows "Show lengths in" — the catalog
  // preview, pinned subtitle and fixed footer had been stuck showing raw mm
  // regardless of that setting; only the chip editor above them converted.
  it('shows the catalog preview, pinned subtitle and footer grid in cm when displayUnit is cm (R14)', () => {
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

    expect(form.querySelector('.klossar__pinned-sub')?.textContent).toContain('4 / 8 / 12 / 16 cm');
    expect(form.querySelector('.klossar__footer-heading')?.textContent).toBe('Step heights (cm)');
    const values = [...form.querySelectorAll('.klossar__grid-value')].map((el) => el.textContent);
    expect(values).toEqual(['4', '8', '12', '16']);
  });

  it('picking "Egen uppsättning" reveals the chip editor and hides the pinned card', () => {
    const form = createSettingsForm(modern, vi.fn());
    const customRow = form.querySelector<HTMLElement>('.klossar__row--custom')!;
    const editor = form.querySelector<HTMLElement>('.klossar__custom-editor')!;
    expect(editor.hidden).toBe(true);
    customRow.click();
    expect(editor.hidden).toBe(false);
    expect(form.querySelector<HTMLElement>('.klossar__pinned')!.hidden).toBe(true);
    expect(form.querySelector('.klossar__footer-model')?.textContent).toBe('Custom set');
  });

  it('Save/Undo in the footer round-trip like the classic form (#108)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    const save = form.querySelector<HTMLButtonElement>(
      '.klossar__footer-actions button[type="submit"]',
    )!;
    const undo = form.querySelectorAll<HTMLButtonElement>('.klossar__footer-actions button')[1]!;
    expect(save.disabled).toBe(true);
    expect(undo.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '4200';
    form.dispatchEvent(new Event('input'));
    expect(save.disabled).toBe(false);
    expect(undo.disabled).toBe(false);

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4200);
    expect(save.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '5000';
    form.dispatchEvent(new Event('input'));
    expect(undo.disabled).toBe(false);
    undo.click();
    expect(input(form, 'wheelbaseMm').value).toBe('4200');
    expect(save.disabled).toBe(true);
  });

  it('the Fordon tab has its own working Save/Undo, kept in sync with the Klossar footer (#140)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    // The Fordon (Vehicle) tab is active by default — its actions bar
    // must be usable without switching to Klossar first. Scoped to
    // [data-tab="vehicle"] specifically since General now has its own
    // Save/Undo row too (#140 follow-up).
    const fordonSave = form.querySelector<HTMLButtonElement>(
      '.settings__tabpanel[data-tab="vehicle"] .settings__actions button[type="submit"]',
    )!;
    const fordonUndo = form.querySelectorAll<HTMLButtonElement>(
      '.settings__tabpanel[data-tab="vehicle"] .settings__actions button',
    )[1]!;
    const klossarSave = form.querySelector<HTMLButtonElement>(
      '.klossar__footer-actions button[type="submit"]',
    )!;
    expect(fordonSave.disabled).toBe(true);
    expect(fordonUndo.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '4200';
    form.dispatchEvent(new Event('input'));
    expect(fordonSave.disabled).toBe(false);
    expect(fordonUndo.disabled).toBe(false);
    expect(klossarSave.disabled).toBe(false); // the two pairs stay in sync

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4200);
    expect(fordonSave.disabled).toBe(true);
    expect(klossarSave.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '5000';
    form.dispatchEvent(new Event('input'));
    fordonUndo.click();
    expect(input(form, 'wheelbaseMm').value).toBe('4200');
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

  it('General, Vehicle, Ramps and Targets all show the exact same three action buttons, Reset/Undo/Save in that order', () => {
    const targetsOptions = {
      getTargetPresets: () => [],
      getActiveTargetId: () => null,
      selectTarget: () => {},
      addTargetPreset: () => null,
      deleteTargetPreset: () => {},
      getCalibration: () => null,
      getVehicleCalibration: () => null,
      getActiveTargetName: () => null,
    };
    const form = createSettingsForm(
      classicSplit,
      vi.fn(),
      undefined,
      { splitPages: true },
      targetsOptions,
    );
    for (const page of ['general', 'vehicle', 'ramps', 'targets'] as const) {
      const body = form.classicPages![page];
      const labels = [...body.querySelectorAll('.settings__actions button')].map(
        (b) => b.textContent,
      );
      expect(labels).toEqual(['Reset to defaults', 'Undo changes', 'Save']);
    }
  });

  it('renders the embedded targets section in the Targets page (not a copy)', () => {
    const form = createSettingsForm(classicSplit, vi.fn(), undefined, { splitPages: true });
    // No host wired — inertTargetsOptions still renders the "Normal" row.
    expect(form.classicPages!.targets.textContent).toContain('Normal');
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
      expect(buttonTexts).not.toContain(t('settings.save'));
      expect(buttonTexts).not.toContain(t('settings.undo'));
      expect(buttonTexts).not.toContain(t('settings.reset'));
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

  it('keeps Save disabled after a resync that matches the new baseline', () => {
    const settings: LevelSettings = { ...classic, soundOnLevel: true, soundGuidance: true };
    const form = createSettingsForm(settings, vi.fn());
    const save = [...form.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === t('settings.save'),
    )!;
    expect(save.disabled).toBe(true); // nothing edited yet

    form.resyncSoundFields?.({ soundOnLevel: false, soundGuidance: false });
    expect(save.disabled).toBe(true); // resync is not an unsaved edit

    const [chime] = soundCheckboxes(form);
    chime!.checked = true;
    chime!.dispatchEvent(new Event('input', { bubbles: true }));
    expect(save.disabled).toBe(false); // a genuine edit still enables it
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
