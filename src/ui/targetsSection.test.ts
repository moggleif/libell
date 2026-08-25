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

  it('the add button is disabled until a name is typed, then captures and clears the field', () => {
    const addTargetPreset = vi.fn<() => string | null>(() => null);
    const section = createTargetsSection(makeOptions({ addTargetPreset }));
    const input = section.element.querySelector<HTMLInputElement>('.targets__name-input')!;
    const addButton = [...section.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('targets.add'),
    ) as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);
    input.value = 'Grey-water drainage';
    input.dispatchEvent(new Event('input'));
    expect(addButton.disabled).toBe(false);
    addButton.click();
    expect(addTargetPreset).toHaveBeenCalledWith('Grey-water drainage');
    expect(input.value).toBe('');
    expect(addButton.disabled).toBe(true);
  });

  it('surfaces a rejection from a too-steep capture without clearing the name field', () => {
    const section = createTargetsSection(
      makeOptions({ addTargetPreset: () => t('targets.err.tooSteep') }),
    );
    const input = section.element.querySelector<HTMLInputElement>('.targets__name-input')!;
    const addButton = [...section.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('targets.add'),
    ) as HTMLButtonElement;
    input.value = 'Too steep';
    input.dispatchEvent(new Event('input'));
    addButton.click();
    expect(
      [...section.element.querySelectorAll('.menu__text--status')].some(
        (s) => s.textContent === t('targets.err.tooSteep'),
      ),
    ).toBe(true);
    expect(input.value).toBe('Too steep');
  });
});
