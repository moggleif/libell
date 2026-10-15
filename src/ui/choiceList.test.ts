// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createChoiceRow } from './choiceList';
import { setLanguage, t } from './i18n';

setLanguage('en');

function chosenRow(label = 'Ferry') {
  const onRename = vi.fn();
  const onSelect = vi.fn();
  const row = createChoiceRow({ label, active: true, onSelect, onRename });
  document.body.replaceChildren(row);
  row.querySelector<HTMLButtonElement>('.choice__row-select')!.click();
  const input = row.querySelector<HTMLInputElement>('.choice__row-input')!;
  return { row, input, onRename, onSelect };
}

describe('choice row (#613)', () => {
  it('selects a row that is not chosen, and renames none', () => {
    const onSelect = vi.fn();
    const row = createChoiceRow({ label: 'Drain', active: false, onSelect, onRename: vi.fn() });
    row.querySelector<HTMLButtonElement>('.choice__row-select')!.click();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(row.querySelector('.choice__row-input')).toBeNull();
  });

  it('opens the chosen row name for editing, focused and named for screen readers', () => {
    const { input, onSelect } = chosenRow();
    expect(input.value).toBe('Ferry');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe(t('choice.rename', { name: 'Ferry' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('saves the trimmed name when the field is left', () => {
    const { row, input, onRename } = chosenRow();
    input.value = ' Ferry deck ';
    input.dispatchEvent(new Event('blur'));
    expect(onRename).toHaveBeenCalledExactlyOnceWith('Ferry deck');
    expect(row.querySelector('.choice__row-select')).not.toBeNull();
  });

  it('puts the previous name back when emptied, unchanged, or on Escape', () => {
    for (const [value, key] of [
      ['', 'Enter'],
      ['Ferry', 'Enter'],
      ['Other', 'Escape'],
    ]) {
      const { row, input, onRename } = chosenRow();
      input.value = value!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: key! }));
      input.dispatchEvent(new Event('blur'));
      expect(onRename).not.toHaveBeenCalled();
      expect(row.querySelector('.choice__row-label')!.textContent).toBe('Ferry');
    }
  });

  it('has no ✕ unless the row can go', () => {
    const row = createChoiceRow({ label: 'Normal', active: true, onSelect: vi.fn() });
    expect(row.querySelector('.choice__row-delete')).toBeNull();
  });
});
