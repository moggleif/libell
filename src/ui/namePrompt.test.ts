// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createNamePrompt } from './namePrompt';
import { setLanguage, t } from './i18n';

setLanguage('en');

function prompt() {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const namePrompt = createNamePrompt({ label: 'Name', placeholder: 'e.g.', onSave, onClose });
  document.body.append(namePrompt.element);
  const input = namePrompt.element.querySelector('input')!;
  const key = (k: string) => input.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  return { namePrompt, input, onSave, onClose, key };
}

describe('name prompt (#613)', () => {
  it('is hidden until opened, then shows the suggestion selected and focused', () => {
    const { namePrompt, input } = prompt();
    expect(namePrompt.element.hidden).toBe(true);
    namePrompt.open('Target 1');
    expect(namePrompt.element.hidden).toBe(false);
    expect(input.value).toBe('Target 1');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe('Name');
  });

  it('saves the trimmed text with Save or Enter, and leaves closing to the caller', () => {
    const { namePrompt, input, onSave, key } = prompt();
    namePrompt.open('');
    input.value = '  Ferry ';
    [...namePrompt.element.querySelectorAll('button')]
      .find((b) => b.textContent === t('namePrompt.save'))!
      .click();
    expect(onSave).toHaveBeenLastCalledWith('Ferry');
    key('Enter');
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(namePrompt.element.hidden).toBe(false);
  });

  it('closes and clears with Cancel or Escape, saving nothing', () => {
    const { namePrompt, input, onSave, onClose, key } = prompt();
    namePrompt.open('Bus');
    key('Escape');
    expect(namePrompt.element.hidden).toBe(true);
    expect(input.value).toBe('');
    namePrompt.open('Bus');
    [...namePrompt.element.querySelectorAll('button')]
      .find((b) => b.textContent === t('namePrompt.cancel'))!
      .click();
    expect(namePrompt.element.hidden).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSave).not.toHaveBeenCalled();
  });
});
