// @vitest-environment happy-dom
//
// Pins the building blocks every Settings tab shares (#417): the
// captioned field row, select/checkbox/number fields, the mm ↔ display
// unit conversion and what counts as a usable number.
import { describe, expect, it } from 'vitest';
import {
  createCheckboxField,
  createHint,
  createLengthField,
  createPlainNumberField,
  createSectionHeading,
  createSelectField,
  type SettingsFormState,
} from './settingsFields';
import { setLanguage, t } from './i18n';

setLanguage('en');

function stateIn(unit: 'mm' | 'cm'): SettingsFormState {
  return { unit, vehicle: 'motorhome', axle: 'single' };
}

describe('createSelectField', () => {
  it('builds a captioned label holding a select with the options, the given one selected', () => {
    const field = createSelectField(
      [
        { value: 'a', text: 'A' },
        { value: 'b', text: 'B' },
      ],
      'b',
    );
    expect(field.element.tagName).toBe('LABEL');
    expect(field.element.className).toBe('settings__field');
    expect(field.element.firstElementChild).toBe(field.caption);
    expect(field.caption.textContent).toBe('');
    expect(field.control.className).toBe('settings__select');
    expect([...field.control.options].map((o) => [o.value, o.textContent])).toEqual([
      ['a', 'A'],
      ['b', 'B'],
    ]);
    expect(field.value()).toBe('b');
  });

  it('translates only the options that carry a message key, and only on relabelOptions', () => {
    const field = createSelectField(
      [
        { value: 'light', label: 'theme.light' },
        { value: 'mm', text: 'mm' },
      ],
      'mm',
    );
    expect(field.control.options[0]!.textContent).toBe('');
    field.relabelOptions();
    expect(field.control.options[0]!.textContent).toBe(t('theme.light'));
    expect(field.control.options[1]!.textContent).toBe('mm');
  });
});

describe('createCheckboxField', () => {
  it('builds a captioned checkbox with the given state', () => {
    const on = createCheckboxField(true);
    expect(on.control.type).toBe('checkbox');
    expect(on.control.className).toBe('settings__checkbox');
    expect(on.control.checked).toBe(true);
    expect(createCheckboxField(false).control.checked).toBe(false);
  });
});

describe('createLengthField', () => {
  it('shows and reads in the display unit, storing mm', () => {
    const state = stateIn('cm');
    const field = createLengthField(
      'wheelbaseMm',
      { label: () => 'settings.wheelbase', stepMm: 10 },
      state,
    );
    expect(field.key).toBe('wheelbaseMm');
    expect(field.inUnit).toBe(true);
    expect(field.control.name).toBe('wheelbaseMm');
    expect(field.control.type).toBe('number');
    field.show(3800);
    expect(field.control.value).toBe('380');
    field.control.value = '412';
    expect(field.read()).toBe(4120);
    state.unit = 'mm';
    expect(field.read()).toBe(412);
  });

  it('captions with the unit and sets step and min from the unit on relabel', () => {
    const state = stateIn('mm');
    const field = createLengthField(
      'wheelbaseMm',
      { label: () => 'settings.wheelbase', stepMm: 10 },
      state,
    );
    field.relabel();
    expect(field.caption.textContent).toBe(`${t('settings.wheelbase')} (mm)`);
    expect(field.control.step).toBe('10');
    expect(field.control.min).toBe('10');
    state.unit = 'cm';
    field.relabel();
    expect(field.caption.textContent).toBe(`${t('settings.wheelbase')} (cm)`);
    expect(field.control.step).toBe('1');
    expect(field.control.min).toBe('1');
  });

  it('re-reads the label on every relabel, so the caption can follow the vehicle', () => {
    let caravan = false;
    const field = createLengthField(
      'wheelbaseMm',
      {
        label: () => (caravan ? 'settings.axleToJockey' : 'settings.wheelbase'),
        stepMm: 10,
      },
      stateIn('mm'),
    );
    field.relabel();
    expect(field.caption.textContent).toBe(`${t('settings.wheelbase')} (mm)`);
    caravan = true;
    field.relabel();
    expect(field.caption.textContent).toBe(`${t('settings.axleToJockey')} (mm)`);
  });

  it('must be positive unless its min is 0, and is unusable when empty', () => {
    const positive = createLengthField(
      'toleranceMm',
      { label: () => 'settings.tolerance', stepMm: 1 },
      stateIn('mm'),
    );
    expect(positive.allowZero).toBe(false);
    positive.control.value = '0';
    expect(positive.isUsable()).toBe(false);
    positive.control.value = '1';
    expect(positive.isUsable()).toBe(true);
    positive.control.value = '';
    expect(Number.isNaN(positive.read())).toBe(true);
    expect(positive.isUsable()).toBe(false);

    const zeroOk = createLengthField(
      'stabilityMm',
      { label: () => 'settings.stability', stepMm: 0.5, min: 0 },
      stateIn('mm'),
    );
    zeroOk.relabel();
    expect(zeroOk.allowZero).toBe(true);
    expect(zeroOk.control.min).toBe('0');
    zeroOk.control.value = '0';
    expect(zeroOk.isUsable()).toBe(true);
    zeroOk.control.value = '-1';
    expect(zeroOk.isUsable()).toBe(false);
  });
});

describe('createPlainNumberField', () => {
  it('shows and reads the stored value whatever the display unit', () => {
    const field = createPlainNumberField(
      'dwellRestMs',
      { label: 'settings.dwellRest', min: 50, step: 50 },
      stateIn('cm'),
    );
    expect(field.inUnit).toBe(false);
    expect(field.allowZero).toBe(false);
    expect(field.control.min).toBe('50');
    expect(field.control.step).toBe('50');
    field.show(600);
    expect(field.control.value).toBe('600');
    field.control.value = '700';
    expect(field.read()).toBe(700);
  });

  it('captions without a unit', () => {
    const field = createPlainNumberField(
      'dwellRestMs',
      { label: 'settings.dwellRest', min: 50, step: 50 },
      stateIn('mm'),
    );
    field.relabel();
    expect(field.caption.textContent).toBe(t('settings.dwellRest'));
  });
});

describe('hints and headings', () => {
  it('are empty paragraphs with their own class', () => {
    const hint = createHint();
    expect(hint.tagName).toBe('P');
    expect(hint.className).toBe('settings__hint');
    expect(hint.textContent).toBe('');
    const heading = createSectionHeading();
    expect(heading.tagName).toBe('P');
    expect(heading.className).toBe('settings__section');
  });
});
