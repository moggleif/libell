/**
 * The name field Settings asks with only when a name is needed (#613): it is
 * hidden until a button such as "New vehicle" or "Save current tilt as new
 * target" opens it, filled with a suggestion, with Save and Cancel.
 */
import { button } from './calibrationControls';
import { createElement } from './dom';
import { t } from './i18n';

export interface NamePromptOptions {
  /** What the field is called for screen readers (R52). */
  label: string;
  placeholder: string;
  /** Save or Enter, with the trimmed text; the caller closes it when done. */
  onSave(typed: string): void;
  /** Cancel, Escape, or a call to close(). */
  onClose?(): void;
}

export interface NamePrompt {
  element: HTMLElement;
  /** Show the field filled with `name`, selected so typing replaces it. */
  open(name: string): void;
  close(): void;
  value(): string;
}

function createInput(options: NamePromptOptions): HTMLInputElement {
  const input = createElement('input', 'name-prompt__input');
  input.type = 'text';
  input.maxLength = 40;
  input.placeholder = options.placeholder;
  input.setAttribute('aria-label', options.label);
  return input;
}

export function createNamePrompt(options: NamePromptOptions): NamePrompt {
  const input = createInput(options);
  const save = button('menu__action menu__action--secondary', t('namePrompt.save'));
  const cancel = button('menu__action menu__action--secondary', t('namePrompt.cancel'));
  const element = createElement('div', 'name-prompt');
  element.append(input, save, cancel);
  element.hidden = true;
  const submit = () => options.onSave(input.value.trim());
  const close = (): void => {
    element.hidden = true;
    input.value = '';
    options.onClose?.();
  };
  save.addEventListener('click', submit);
  cancel.addEventListener('click', close);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
    if (event.key === 'Escape') close();
  });
  const open = (name: string): void => {
    element.hidden = false;
    input.value = name;
    input.focus();
    input.select();
  };
  return { element, open, close, value: () => input.value.trim() };
}
