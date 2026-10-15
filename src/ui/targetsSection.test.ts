// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createTargetsSection, type TargetsOptions } from './targetsSection';
import { setLanguage, t } from './i18n';
import type { TargetPreset } from '../domain/targetPresets';

setLanguage('en');

function makeOptions(overrides: Partial<TargetsOptions> = {}): TargetsOptions {
  return {
    getTargetPresets: () => [],
    getActiveTargetId: () => null,
    selectTarget: () => {},
    addTargetPreset: () => null,
    deleteTargetPreset: () => {},
    ...overrides,
  };
}

const SHOWER: TargetPreset = {
  id: 'shower',
  name: 'Shower drain',
  offset: { rollDeg: 2, pitchDeg: 0 },
};

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === text)!;
}

function nameInput(section: { element: HTMLElement }): HTMLInputElement {
  return section.element.querySelector<HTMLInputElement>('.name-prompt__input')!;
}

describe('targets section (#122, ADR 0013)', () => {
  it('always lists Normal first, marked active when no preset is selected', () => {
    const section = createTargetsSection(makeOptions({ getTargetPresets: () => [SHOWER] }));
    const rows = [...section.element.querySelectorAll('.targets__row-label')].map(
      (el) => el.textContent,
    );
    expect(rows).toEqual([t('targets.normal'), 'Shower drain']);
    const normalSelect = section.element.querySelector('.targets__row-select');
    expect(normalSelect?.classList.contains('targets__row-select--active')).toBe(true);
  });

  it('marks the active preset instead of Normal when one is selected', () => {
    const section = createTargetsSection(
      makeOptions({ getTargetPresets: () => [SHOWER], getActiveTargetId: () => 'shower' }),
    );
    const active = [...section.element.querySelectorAll('.targets__row-select--active')];
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toContain('Shower drain');
  });

  it('selecting a row calls selectTarget with its id (Normal -> null)', () => {
    const selectTarget = vi.fn();
    const section = createTargetsSection(
      makeOptions({ getTargetPresets: () => [SHOWER], selectTarget }),
    );
    const selects = [
      ...section.element.querySelectorAll<HTMLButtonElement>('.targets__row-select'),
    ];
    selects[1]!.click();
    expect(selectTarget).toHaveBeenCalledWith('shower');
    selects[0]!.click();
    expect(selectTarget).toHaveBeenCalledWith(null);
  });

  it('Normal has no delete button; presets do', () => {
    const section = createTargetsSection(makeOptions({ getTargetPresets: () => [SHOWER] }));
    const rows = [...section.element.querySelectorAll('.targets__row')];
    expect(rows[0]?.querySelector('.targets__row-delete')).toBeNull();
    expect(rows[1]?.querySelector('.targets__row-delete')).not.toBeNull();
  });

  it('deleting a preset calls deleteTargetPreset with its id', () => {
    const deleteTargetPreset = vi.fn();
    const section = createTargetsSection(
      makeOptions({ getTargetPresets: () => [SHOWER], deleteTargetPreset }),
    );
    section.element.querySelector<HTMLButtonElement>('.targets__row-delete')!.click();
    expect(deleteTargetPreset).toHaveBeenCalledWith('shower');
  });

  // #613: no name field until a target is being saved.
  it('shows only the add button until it is tapped, then asks for the name', () => {
    const section = createTargetsSection(makeOptions());
    const prompt = section.element.querySelector<HTMLElement>('.name-prompt')!;
    const addButton = buttonByText(section.element, t('targets.add'));
    expect(prompt.hidden).toBe(true);
    addButton.click();
    expect(prompt.hidden).toBe(false);
    expect(addButton.hidden).toBe(true);
    buttonByText(section.element, t('namePrompt.cancel')).click();
    expect(prompt.hidden).toBe(true);
    expect(addButton.hidden).toBe(false);
  });

  it('captures with the typed name and closes the field', () => {
    const addTargetPreset = vi.fn<() => string | null>(() => null);
    const section = createTargetsSection(makeOptions({ addTargetPreset }));
    buttonByText(section.element, t('targets.add')).click();
    nameInput(section).value = 'Grey-water drainage';
    buttonByText(section.element, t('namePrompt.save')).click();
    expect(addTargetPreset).toHaveBeenCalledWith('Grey-water drainage');
    expect(section.element.querySelector<HTMLElement>('.name-prompt')!.hidden).toBe(true);
  });

  // #329: nothing is disabled — an unnamed target still gets saved, under
  // the next free "Target N", which the field also suggests (#613).
  it('suggests and saves an unnamed target as "Target N", the next free number', () => {
    const addTargetPreset = vi.fn<() => string | null>(() => null);
    const presets: TargetPreset[] = [
      { ...SHOWER, id: 'a', name: t('targets.defaultName', { n: 1 }) },
      { ...SHOWER, id: 'b', name: t('targets.defaultName', { n: 3 }) },
    ];
    const section = createTargetsSection(
      makeOptions({ addTargetPreset, getTargetPresets: () => presets }),
    );
    buttonByText(section.element, t('targets.add')).click();
    expect(nameInput(section).value).toBe('Target 2');
    nameInput(section).value = '';
    buttonByText(section.element, t('namePrompt.save')).click();
    expect(addTargetPreset).toHaveBeenCalledWith('Target 2');
  });

  it('surfaces a reading error without clearing the name field', () => {
    const section = createTargetsSection(makeOptions({ addTargetPreset: () => 'no sensor' }));
    buttonByText(section.element, t('targets.add')).click();
    nameInput(section).value = 'Drain';
    buttonByText(section.element, t('namePrompt.save')).click();
    expect(section.element.textContent).toContain('no sensor');
    expect(buttonByText(section.element, t('targets.anyway')).hidden).toBe(true);
    expect(nameInput(section).value).toBe('Drain');
  });

  // #425: "Varning är rätt. Aldrig stopp."
  it('warns about a too-steep capture and saves it anyway, under the same name', () => {
    const addTargetPreset = vi.fn((_name: string, anyway?: boolean) =>
      anyway ? null : { warning: 'Steeper than a target' },
    );
    const section = createTargetsSection(makeOptions({ addTargetPreset }));
    buttonByText(section.element, t('targets.add')).click();
    nameInput(section).value = 'Too steep';
    buttonByText(section.element, t('namePrompt.save')).click();
    expect(section.element.textContent).toContain('Steeper than a target');
    expect(nameInput(section).value).toBe('Too steep');
    const anyway = buttonByText(section.element, t('targets.anyway'));
    expect(anyway.hidden).toBe(false);
    anyway.click();
    expect(addTargetPreset).toHaveBeenLastCalledWith('Too steep', true);
    expect(anyway.hidden).toBe(true);
    expect(nameInput(section).value).toBe('');
    expect(section.element.textContent).not.toContain('Steeper than a target');
  });
});

// #329: the "Level is computed from: sensor – · vehicle zero – · …" line
// (#160) is gone — it explained the math rather than helping anyone level.
it('shows no offset summary line or intro text (#329)', () => {
  const section = createTargetsSection(makeOptions({ getTargetPresets: () => [SHOWER] }));
  expect(section.element.querySelectorAll('.menu__text:not(.menu__text--status)')).toHaveLength(0);
  expect(section.element.textContent).not.toContain('vehicle zero');
});
