// @vitest-environment happy-dom
//
// Pins the Ramps tab on its own (#417), before its step editor and
// catalogue move out of `createRampsTab`: the compact form (ramp
// `<select>` and step chips), the Ramps page (selection, custom editor,
// Number of ramps, catalogue with brand filter), and what reaches the
// stored settings. Only the tab's public surface and the DOM it builds are
// used, so the same tests hold after the split.
import { describe, expect, it, vi } from 'vitest';
import { createRampsTab, type RampsTab } from './settingsRampsTab';
import type { RawSettings, SettingsFormContext, SettingsFormState } from './settingsFields';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { RAMP_MODELS } from '../domain/ramps';

setLanguage('en');

const THULE = [44, 78, 112];

interface Built {
  tab: RampsTab;
  state: SettingsFormState;
  changed: ReturnType<typeof vi.fn>;
}

function build(overrides: Partial<LevelSettings> = {}, unit: 'mm' | 'cm' = 'mm'): Built {
  const initial: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides, displayUnit: unit };
  const state: SettingsFormState = {
    unit,
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const changed = vi.fn();
  const context: SettingsFormContext = {
    state,
    compact: false,
    changed,
    relabelAll: vi.fn(),
    currentSettings: () => initial,
  };
  const tab = createRampsTab(initial, context);
  tab.relabel();
  tab.render();
  return { tab, state, changed };
}

function read(tab: RampsTab): RawSettings {
  const raw: RawSettings = {};
  tab.read(raw);
  return raw;
}

function chips(field: HTMLElement): string[] {
  return [...field.querySelectorAll('.steps__chip > span:first-child')].map(
    (c) => c.textContent ?? '',
  );
}

function rampSelect(tab: RampsTab): HTMLSelectElement {
  return tab.stepsField.querySelector<HTMLSelectElement>('.steps__ramp select')!;
}

function choose(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

function addStep(field: HTMLElement, value: string): HTMLButtonElement {
  const input = field.querySelector<HTMLInputElement>('.steps__add input')!;
  const button = field.querySelector<HTMLButtonElement>('.steps__add button')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  return button;
}

/** The visible "must be positive" text under the add row, if any. */
function stepError(field: HTMLElement): HTMLElement | null {
  const error = field.querySelector<HTMLElement>('.settings__error');
  return error && !error.hidden ? error : null;
}

function removeChip(field: HTMLElement, label: string): void {
  const chip = [...field.querySelectorAll('.steps__chip')].find(
    (c) => c.firstElementChild?.textContent === label,
  )!;
  chip.querySelector<HTMLButtonElement>('.steps__chip-remove')!.click();
}

describe('the compact form', () => {
  it('shows the caption, the ramp select, the chips and the add row, in that order', () => {
    const { tab } = build();
    const [caption, ramp, chipList, addRow] = [...tab.stepsField.children] as HTMLElement[];
    expect(tab.stepsField.className).toBe('settings__field settings__field--wide');
    expect(caption!.textContent).toBe(`${t('settings.steps')} (mm)`);
    expect(ramp!.className).toBe('steps__ramp');
    expect(ramp!.firstElementChild!.textContent).toBe(t('settings.ramp'));
    expect(chipList!.className).toBe('steps__chips');
    expect(addRow!.className).toBe('steps__add');
    expect(addRow!.querySelector('button')!.textContent).toBe(`+ ${t('settings.steps.add')}`);
  });

  it('offers Custom set and Stepless wedge first, then every catalog model with its mm figures', () => {
    const { tab } = build();
    const options = [...rampSelect(tab).options];
    expect(options[0]!.value).toBe('');
    expect(options[0]!.textContent).toBe(t('settings.ramp.custom'));
    expect(options[1]!.value).toBe('stepless');
    expect(options[1]!.textContent).toBe(t('settings.ramp.stepless'));
    expect(options.slice(2).map((o) => o.value)).toEqual(RAMP_MODELS.map((m) => m.name));
    expect(options[2]!.textContent).toBe('Thule Levelers (44/78/112 mm)');
    expect(options.find((o) => o.value === 'Andersen Camper Leveler')!.textContent).toBe(
      t('settings.ramp.steplessModel', { name: 'Andersen Camper Leveler', max: 101 }),
    );
  });

  it('shows the stored steps as sorted chips in the display unit, and the matching model', () => {
    const { tab } = build({ rampStepHeightsMm: [112, 44, 78] }, 'cm');
    expect(chips(tab.stepsField)).toEqual(['4.4 cm', '7.8 cm', '11.2 cm']);
    expect(rampSelect(tab).value).toBe('Thule Levelers');
    const input = tab.stepsField.querySelector<HTMLInputElement>('.steps__add input')!;
    expect(input.placeholder).toBe('4');
  });

  it('shows "Custom set" for steps no model has', () => {
    const { tab } = build({ rampStepHeightsMm: [30, 60] });
    expect(rampSelect(tab).value).toBe('');
  });

  it('picking a model fills its steps, saves, and is what is stored', () => {
    const { tab, changed } = build();
    choose(rampSelect(tab), 'Milenco Quattro Level');
    expect(chips(tab.stepsField)).toEqual(['40 mm', '80 mm', '120 mm', '160 mm']);
    expect(changed).toHaveBeenCalledOnce();
    expect(read(tab).rampStepHeightsMm).toEqual([40, 80, 120, 160]);
  });

  it('keeps an explicitly chosen Custom set even while the steps still match a model (#91)', () => {
    const { tab, changed } = build();
    choose(rampSelect(tab), '');
    expect(rampSelect(tab).value).toBe('');
    expect(changed).toHaveBeenCalledOnce();
    expect(read(tab).rampStepHeightsMm).toEqual(THULE);
  });

  it('keeps the picked model of two with the same steps (Fiamma and Biltema)', () => {
    const { tab } = build();
    choose(rampSelect(tab), 'Biltema nivåkloss');
    tab.render();
    expect(rampSelect(tab).value).toBe('Biltema nivåkloss');
  });

  it('adds a positive number in mm, sorted, once, and clears the field', () => {
    const { tab, changed } = build({}, 'cm');
    const button = addStep(tab.stepsField, '6');
    expect(button.disabled).toBe(false);
    button.click();
    expect(read(tab).rampStepHeightsMm).toEqual([44, 60, 78, 112]);
    expect(chips(tab.stepsField)).toEqual(['4.4 cm', '6 cm', '7.8 cm', '11.2 cm']);
    expect(tab.stepsField.querySelector<HTMLInputElement>('.steps__add input')!.value).toBe('');
    expect(rampSelect(tab).value).toBe('');
    expect(changed).toHaveBeenCalledOnce();
    expect(stepError(tab.stepsField)).toBeNull();

    addStep(tab.stepsField, '6').click();
    expect(read(tab).rampStepHeightsMm).toEqual([44, 60, 78, 112]);
  });

  it.each(['', '0', '-2'])(
    'keeps Add enabled and explains, rather than adds, for %j (#514)',
    (value) => {
      const { tab, changed } = build({}, 'cm');
      const button = addStep(tab.stepsField, value);
      expect(button.disabled).toBe(false);
      button.click();
      expect(changed).not.toHaveBeenCalled();
      expect(read(tab).rampStepHeightsMm).toEqual(THULE);
      const error = stepError(tab.stepsField)!;
      expect(error.textContent).toBe(t('settings.err.positive'));
      expect(error.getAttribute('role')).toBe('alert');
      expect(tab.stepsField.querySelector<HTMLInputElement>('.steps__add input')!.value).toBe(
        value,
      );
    },
  );

  it('explains, rather than adds, a step above the plausible range (#541)', () => {
    const { tab, changed } = build({}, 'cm');
    addStep(tab.stepsField, '51').click();
    expect(changed).not.toHaveBeenCalled();
    expect(read(tab).rampStepHeightsMm).toEqual(THULE);
    expect(stepError(tab.stepsField)!.textContent).toBe(
      t('settings.err.range', { min: 0.1, max: 50 }),
    );
  });

  it('hides the explanation once the field is typed in again (#514)', () => {
    const { tab } = build();
    addStep(tab.stepsField, '').click();
    expect(stepError(tab.stepsField)).not.toBeNull();
    addStep(tab.stepsField, '5');
    expect(stepError(tab.stepsField)).toBeNull();
  });

  it('removes a step with its chip button, labelled with the value', () => {
    const { tab, changed } = build();
    const remove = tab.stepsField.querySelector('.steps__chip-remove')!;
    expect(remove.textContent).toBe('−');
    expect(remove.getAttribute('aria-label')).toBe(t('settings.steps.remove', { value: '44 mm' }));
    removeChip(tab.stepsField, '78 mm');
    expect(read(tab).rampStepHeightsMm).toEqual([44, 112]);
    expect(chips(tab.stepsField)).toEqual(['44 mm', '112 mm']);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('removing a step and adding it back finds the model again', () => {
    const { tab } = build();
    removeChip(tab.stepsField, '78 mm');
    expect(rampSelect(tab).value).toBe('');
    addStep(tab.stepsField, '78').click();
    expect(rampSelect(tab).value).toBe('Thule Levelers');
  });
});

describe('Number of ramps and the hints', () => {
  it('offers 1 to 4, stores the choice and saves on change', () => {
    const { tab, changed } = build({ rampCount: 3 });
    const select = tab.rampCountField.querySelector('select')!;
    expect([...select.options].map((o) => o.value)).toEqual(['1', '2', '3', '4']);
    expect(read(tab).rampCount).toBe(3);
    choose(select, '4');
    expect(read(tab).rampCount).toBe(4);
    expect(changed).toHaveBeenCalledOnce();
    expect(tab.rampCountField.firstElementChild!.textContent).toBe(t('settings.rampCount'));
    expect(tab.rampHint.textContent).toBe(t('settings.rampHint'));
  });

  it('are hidden for a caravan and shown again for a motorhome', () => {
    const { tab, state } = build();
    const panel = document.createElement('div');
    tab.buildPage(panel);
    const countHint = tab.rampCountField.nextElementSibling as HTMLElement;
    state.vehicle = 'caravan';
    tab.relabel();
    expect(tab.rampCountField.hidden).toBe(true);
    expect(countHint.hidden).toBe(true);
    expect(tab.rampHint.hidden).toBe(true);
    state.vehicle = 'motorhome';
    tab.relabel();
    expect(tab.rampCountField.hidden).toBe(false);
    expect(countHint.hidden).toBe(false);
    expect(countHint.textContent).toBe(t('settings.rampCountHint'));
    expect(tab.rampHint.hidden).toBe(false);
  });
});

describe('populate and showSteps', () => {
  it('populate takes the steps, the count and re-matches the model', () => {
    const { tab } = build({ rampStepHeightsMm: [30, 60] });
    tab.populate({ ...DEFAULT_SETTINGS, rampStepHeightsMm: [40, 80, 120], rampCount: 1 });
    tab.render();
    expect(rampSelect(tab).value).toBe('Milenco Triple Level');
    expect(read(tab)).toEqual({
      rampStepHeightsMm: [40, 80, 120],
      rampStepless: false,
      rampCount: 1,
    });
  });

  it('showSteps redraws the given steps and keeps an explicit Custom set', () => {
    const { tab } = build();
    choose(rampSelect(tab), '');
    tab.showSteps([40, 70, 100], false);
    expect(chips(tab.stepsField)).toEqual(['40 mm', '70 mm', '100 mm']);
    expect(rampSelect(tab).value).toBe('');
  });

  it('read hands over a copy, not the live list', () => {
    const { tab } = build();
    const steps = read(tab).rampStepHeightsMm as number[];
    steps.push(999);
    expect(read(tab).rampStepHeightsMm).toEqual(THULE);
  });
});

describe('the Ramps page', () => {
  function page(overrides: Partial<LevelSettings> = {}, unit: 'mm' | 'cm' = 'mm') {
    const built = build(overrides, unit);
    const panel = document.createElement('div');
    built.tab.buildPage(panel);
    built.tab.render();
    const selected = panel.querySelector<HTMLElement>('.klossar__selected')!;
    const customEditor = panel.querySelector<HTMLElement>('.klossar__custom-editor')!;
    const catalogue = panel.querySelector<HTMLDetailsElement>('.klossar__picker-details')!;
    const rows = [...catalogue.querySelectorAll<HTMLButtonElement>('.klossar__row')];
    const row = (name: string): HTMLButtonElement =>
      rows.find((r) => r.querySelector('.klossar__row-name')!.textContent === name)!;
    const brand = (label: string): HTMLButtonElement =>
      [...catalogue.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
        (c) => c.textContent === label,
      )!;
    const selectedRows = (): string[] =>
      rows
        .filter((r) => r.classList.contains('klossar__row--selected'))
        .map((r) => r.querySelector('.klossar__row-name')!.textContent ?? '');
    return { ...built, panel, selected, customEditor, catalogue, rows, row, brand, selectedRows };
  }

  it('shows the selection, the custom editor, Number of ramps and its hint, then the catalogue', () => {
    const { panel, tab, selected, customEditor, catalogue } = page();
    const children = [...panel.children];
    expect(children).toEqual([
      selected,
      customEditor,
      tab.rampCountField,
      tab.rampCountField.nextElementSibling,
      catalogue,
    ]);
    expect((children[3] as HTMLElement).className).toBe('settings__hint');
  });

  it('moves the chip editor under the custom row, shown only for a custom set', () => {
    const { tab, customEditor } = page();
    expect(customEditor.querySelector('.steps__chips')).not.toBeNull();
    expect(customEditor.querySelector('.steps__add')).not.toBeNull();
    expect(tab.stepsField.querySelector('.steps__chips')).toBeNull();
    expect(customEditor.hidden).toBe(true);
  });

  it('states the chosen model and its step heights in the display unit', () => {
    const { selected } = page({}, 'cm');
    expect(selected.querySelector('.klossar__footer-label')!.textContent).toBe(
      t('settings.klossar.selected'),
    );
    expect(selected.querySelector('.klossar__footer-model')!.textContent).toBe('Thule Levelers');
    expect(selected.querySelector('.klossar__footer-heading')!.textContent).toBe(
      `${t('settings.klossar.stepsHeading')} (cm)`,
    );
    const cells = [...selected.querySelectorAll('.klossar__grid-cell')].map((c) => [
      c.querySelector('.klossar__grid-label')!.textContent,
      c.querySelector('.klossar__grid-value')!.textContent,
    ]);
    expect(cells).toEqual([
      [t('diagram.step', { n: 1 }), '4.4'],
      [t('diagram.step', { n: 2 }), '7.8'],
      [t('diagram.step', { n: 3 }), '11.2'],
    ]);
    expect(selected.querySelector<HTMLElement>('.klossar__grid')!.style.gridTemplateColumns).toBe(
      'repeat(3, 1fr)',
    );
  });

  it('keeps the catalogue collapsed behind "Change ramp"', () => {
    const { catalogue } = page();
    expect(catalogue.open).toBe(false);
    expect(catalogue.querySelector('summary')!.textContent).toBe(t('settings.klossar.changeRamp'));
  });

  it('lists Custom set first, then every model with its steps, the chosen one selected', () => {
    const { rows, selectedRows, row } = page();
    expect(rows.map((r) => r.querySelector('.klossar__row-name')!.textContent)).toEqual([
      t('settings.ramp.custom'),
      t('settings.ramp.stepless'),
      ...RAMP_MODELS.map((m) => m.name),
    ]);
    expect(rows[0]!.classList.contains('klossar__row--custom')).toBe(true);
    expect(row('Thule Levelers').querySelector('.klossar__row-mm')!.textContent).toBe(
      '44/78/112 mm',
    );
    expect(selectedRows()).toEqual(['Thule Levelers']);
    expect(
      row('Thule Levelers')
        .querySelector('.klossar__radio')!
        .classList.contains('klossar__radio--selected'),
    ).toBe(true);
  });

  it('picking a model in the catalogue fills its steps, selects it and saves', () => {
    const { tab, row, selected, selectedRows, changed } = page();
    row('Froli trappkil XL').click();
    expect(selectedRows()).toEqual(['Froli trappkil XL']);
    expect(selected.querySelector('.klossar__footer-model')!.textContent).toBe('Froli trappkil XL');
    expect(read(tab).rampStepHeightsMm).toEqual([65, 115]);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('picking Custom set keeps the steps and shows the chip editor', () => {
    const { tab, row, selected, selectedRows, customEditor } = page();
    row(t('settings.ramp.custom')).click();
    expect(selectedRows()).toEqual([t('settings.ramp.custom')]);
    expect(customEditor.hidden).toBe(false);
    expect(selected.querySelector('.klossar__footer-model')!.textContent).toBe(
      t('settings.ramp.custom'),
    );
    expect(read(tab).rampStepHeightsMm).toEqual(THULE);
  });

  it('the brand filter narrows the models but never hides Custom set', () => {
    const { brand, rows } = page();
    expect(brand(t('settings.klossar.brandAll')).getAttribute('aria-pressed')).toBe('true');
    brand('Milenco').click();
    const shown = rows
      .filter((r) => !r.hidden)
      .map((r) => r.querySelector('.klossar__row-name')!.textContent);
    expect(shown).toEqual([
      t('settings.ramp.custom'),
      t('settings.ramp.stepless'),
      ...RAMP_MODELS.filter((m) => m.name.startsWith('Milenco')).map((m) => m.name),
    ]);
    expect(brand('Milenco').getAttribute('aria-pressed')).toBe('true');
    expect(brand(t('settings.klossar.brandAll')).getAttribute('aria-pressed')).toBe('false');
    brand(t('settings.klossar.brandAll')).click();
    expect(rows.every((r) => !r.hidden)).toBe(true);
  });

  it('offers one brand chip per brand, after All', () => {
    const { catalogue } = page();
    expect([...catalogue.querySelectorAll('.klossar__chip')].map((c) => c.textContent)).toEqual([
      t('settings.klossar.brandAll'),
      'Thule',
      'Fiamma',
      'Milenco',
      'Froli',
      'Biltema',
      'Andersen',
    ]);
  });

  it('editing a custom set on the page redraws the selection grid', () => {
    const { row, customEditor, selected } = page();
    row(t('settings.ramp.custom')).click();
    addStep(customEditor, '150').click();
    expect(
      [...selected.querySelectorAll('.klossar__grid-value')].map((c) => c.textContent),
    ).toEqual(['44', '78', '112', '150']);
  });

  it('shows a custom set that matches no model as Custom set, editor open', () => {
    const { selectedRows, customEditor, selected } = page({ rampStepHeightsMm: [30, 60] });
    expect(selectedRows()).toEqual([t('settings.ramp.custom')]);
    expect(customEditor.hidden).toBe(false);
    expect(selected.querySelector<HTMLElement>('.klossar__grid')!.style.gridTemplateColumns).toBe(
      'repeat(2, 1fr)',
    );
  });
});

describe('a stepless wedge (#600)', () => {
  const cells = (panel: HTMLElement): string[] =>
    [...panel.querySelectorAll('.klossar__grid-cell')].map((c) => c.textContent ?? '');

  it('picking Stepless wedge keeps the tallest step as its maximum and is stored', () => {
    const { tab, changed } = build();
    choose(rampSelect(tab), 'stepless');
    expect(rampSelect(tab).value).toBe('stepless');
    expect(chips(tab.stepsField)).toEqual(['112 mm']);
    expect(read(tab)).toMatchObject({ rampStepHeightsMm: [112], rampStepless: true });
    expect(changed).toHaveBeenCalled();
  });

  it('sets the maximum rather than adding a step, and offers no remove button', () => {
    const { tab } = build({ rampStepHeightsMm: [90], rampStepless: true });
    const button = addStep(tab.stepsField, '120');
    expect(button.textContent).toBe(t('settings.stepless.set'));
    button.click();
    expect(chips(tab.stepsField)).toEqual(['120 mm']);
    expect(tab.stepsField.querySelector('.steps__chip-remove')).toBeNull();
    expect(read(tab)).toMatchObject({ rampStepHeightsMm: [120], rampStepless: true });
  });

  it('picking a stepless model selects it with its maximum', () => {
    const { tab } = build();
    choose(rampSelect(tab), 'Andersen Camper Leveler');
    expect(rampSelect(tab).value).toBe('Andersen Camper Leveler');
    expect(read(tab)).toMatchObject({ rampStepHeightsMm: [101], rampStepless: true });
  });

  it('going back to Custom set turns the wedge into one step', () => {
    const { tab } = build({ rampStepHeightsMm: [90], rampStepless: true });
    choose(rampSelect(tab), '');
    expect(read(tab)).toMatchObject({ rampStepHeightsMm: [90], rampStepless: false });
    expect(addStep(tab.stepsField, '40').textContent).toBe(`+ ${t('settings.steps.add')}`);
  });

  it('shows the Ramps page selection as its Max height alone', () => {
    const { tab } = build({ rampStepHeightsMm: [90], rampStepless: true });
    const panel = document.createElement('div');
    tab.buildPage(panel);
    tab.render();
    expect(panel.querySelector('.klossar__footer-model')!.textContent).toBe(
      t('settings.ramp.stepless'),
    );
    expect(panel.querySelector('.klossar__footer-heading')!.textContent).toBe(
      `${t('settings.stepless.maxHeading')} (mm)`,
    );
    expect(cells(panel)).toEqual(['90']);
  });

  it('turns an emptied custom set into a wedge still waiting for its height', () => {
    const { tab } = build({ rampStepHeightsMm: [55] });
    choose(rampSelect(tab), '');
    removeChip(tab.stepsField, '55 mm');
    choose(rampSelect(tab), 'stepless');
    expect(read(tab)).toMatchObject({ rampStepHeightsMm: [], rampStepless: true });
    expect(addStep(tab.stepsField, '90').textContent).toBe(t('settings.stepless.set'));
  });

  it('showSteps redraws a stored wedge', () => {
    const { tab } = build();
    tab.showSteps([75], true);
    expect(rampSelect(tab).value).toBe('stepless');
    expect(chips(tab.stepsField)).toEqual(['75 mm']);
  });
});
