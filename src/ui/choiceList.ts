/**
 * A single-choice list of rows, each a ●/○ select button and, where it can
 * go, a ✕ (ADR 0013's targets; the vehicles, #613). Tapping the chosen row
 * again edits its name in place: leaving the field saves it, and an emptied
 * field puts the previous name back.
 */
import { button, createElement, textElement } from './dom';
import { t } from './i18n';

export interface ChoiceRow {
  label: string;
  active: boolean;
  onSelect(): void;
  /** Omitted when the row cannot be renamed ("Normal"). */
  onRename?(name: string): void;
  /** Omitted when the row cannot go. */
  onDelete?(): void;
  /** The ✕'s accessible name. */
  deleteLabel?: string;
}

export function createChoiceRow(row: ChoiceRow): HTMLElement {
  const element = createElement('div', 'choice__row');
  const select = createSelectButton(row);
  select.addEventListener('click', () => {
    if (row.active && row.onRename) editName(select, row.label, row.onRename);
    else row.onSelect();
  });
  element.append(select);
  if (row.onDelete) element.append(createDeleteButton(row.deleteLabel ?? '', row.onDelete));
  return element;
}

function createSelectButton({ label, active }: ChoiceRow): HTMLButtonElement {
  const select = createElement(
    'button',
    active ? 'choice__row-select choice__row-select--active' : 'choice__row-select',
  );
  select.type = 'button';
  // The ●/○ is hidden from screen readers; this says it instead (#535).
  select.setAttribute('aria-pressed', String(active));
  const radio = textElement('span', 'choice__row-radio', active ? '●' : '○');
  radio.setAttribute('aria-hidden', 'true');
  select.append(radio, textElement('span', 'choice__row-label', label));
  return select;
}

function createDeleteButton(label: string, onDelete: () => void): HTMLButtonElement {
  const del = button('choice__row-delete', '✕', onDelete);
  del.setAttribute('aria-label', label);
  return del;
}

/** Swap the row's button for a name field until it loses focus. */
function editName(select: HTMLButtonElement, name: string, onRename: (n: string) => void): void {
  const input = createElement('input', 'choice__row-input');
  input.type = 'text';
  input.maxLength = 40;
  input.value = name;
  input.setAttribute('aria-label', t('choice.rename', { name }));
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    const typed = input.value.trim();
    input.replaceWith(select);
    if (typed && typed !== name) onRename(typed);
  };
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') input.value = name;
    if (event.key === 'Enter' || event.key === 'Escape') finish();
  });
  select.replaceWith(input);
  input.focus();
  input.select();
}
