/**
 * Target presets UI (ADR 0013): "Normal" (true level, always first, never
 * deletable) followed by the user's saved presets. Adding a preset
 * captures the current tilt, the same capture-first pattern
 * `calibrationSection.ts` uses for the vehicle zero.
 *
 * Deliberately NOT part of `calibrationSection.ts`: a preset is a
 * *target*, not a calibration (see `../domain/targetPresets.ts`).
 */
import type { CaptureResult } from '../domain/calibration';
import type { TargetPreset } from '../domain/targetPresets';
import { t } from './i18n';
import { createElement } from './dom';

export interface TargetsOptions {
  getTargetPresets(): TargetPreset[];
  getActiveTargetId(): string | null;
  /** Switch the active target; `null` selects "Normal" (true level). */
  selectTarget(id: string | null): void;
  /** Capture the current tilt as a new preset named `name`: null on
   * success, an error text, or a warning above 15° that offers "Save
   * anyway" — `anyway` is set when the user chose it. */
  addTargetPreset(name: string, anyway?: boolean): CaptureResult;
  deleteTargetPreset(id: string): void;
}

export interface TargetsSection {
  element: HTMLElement;
  refresh(): void;
}

export function createTargetsSection(options: TargetsOptions): TargetsSection {
  const list = createElement('div', 'targets__list');
  const refresh = (): void => refreshList(options, list, refresh);
  const adding = createAddControls();
  const add = (anyway: boolean): void => addPreset(options, adding, anyway, refresh);
  adding.addButton.addEventListener('click', () => add(false));
  adding.anywayButton.addEventListener('click', () => add(true));

  refresh();
  const body = document.createElement('div');
  body.append(list, adding.addRow, adding.addStatus, adding.anywayButton);
  return { element: body, refresh };
}

/** "Normal" first, then the saved presets; every choice redraws the list. */
function refreshList(options: TargetsOptions, list: HTMLElement, refresh: () => void): void {
  const activeId = options.getActiveTargetId();
  const select = (id: string | null) => () => {
    options.selectTarget(id);
    refresh();
  };
  list.replaceChildren(
    makeRow(t('targets.normal'), activeId === null, select(null)),
    ...options.getTargetPresets().map((preset) =>
      makeRow(preset.name, activeId === preset.id, select(preset.id), () => {
        options.deleteTargetPreset(preset.id);
        refresh();
      }),
    ),
  );
}

function makeRow(
  labelText: string,
  active: boolean,
  onSelect: () => void,
  onDelete?: () => void,
): HTMLElement {
  const row = createElement('div', 'targets__row');
  row.append(createSelectButton(labelText, active, onSelect));
  if (onDelete) row.append(createDeleteButton(labelText, onDelete));
  return row;
}

function createSelectButton(labelText: string, active: boolean, onSelect: () => void) {
  const select = document.createElement('button');
  select.type = 'button';
  select.className = active
    ? 'targets__row-select targets__row-select--active'
    : 'targets__row-select';
  const radio = createElement('span', 'targets__row-radio');
  radio.setAttribute('aria-hidden', 'true');
  radio.textContent = active ? '●' : '○';
  const label = createElement('span', 'targets__row-label');
  label.textContent = labelText;
  select.append(radio, label);
  select.addEventListener('click', onSelect);
  return select;
}

function createDeleteButton(labelText: string, onDelete: () => void): HTMLButtonElement {
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'targets__row-delete';
  del.setAttribute('aria-label', t('targets.delete', { name: labelText }));
  del.textContent = '✕';
  del.addEventListener('click', onDelete);
  return del;
}

type AddControls = ReturnType<typeof createAddControls>;

function createAddControls() {
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'targets__name-input';
  nameInput.maxLength = 40;
  nameInput.placeholder = t('targets.name.placeholder');
  const addButton = secondaryButton(t('targets.add'));
  const addRow = createElement('div', 'targets__add');
  addRow.append(nameInput, addButton);
  const addStatus = createElement('p', 'menu__text menu__text--status');
  // Warn, never block: shown only while a too-steep warning is up.
  const anywayButton = secondaryButton(t('targets.anyway'));
  anywayButton.hidden = true;
  return { nameInput, addButton, addRow, addStatus, anywayButton };
}

function secondaryButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action menu__action--secondary';
  button.textContent = text;
  return button;
}

function addPreset(
  options: TargetsOptions,
  { nameInput, addStatus, anywayButton }: AddControls,
  anyway: boolean,
  refresh: () => void,
): void {
  const name = nameInput.value.trim() || nextDefaultName(options);
  const result = anyway ? options.addTargetPreset(name, true) : options.addTargetPreset(name);
  const warned = typeof result === 'object' && result !== null;
  anywayButton.hidden = !warned;
  addStatus.classList.toggle('menu__text--warning', warned);
  if (result !== null) {
    addStatus.textContent = warned ? result.warning : result;
    return;
  }
  nameInput.value = '';
  addStatus.textContent = '';
  refresh();
}

/** Nothing is disabled: a target saved without a name gets the lowest
 * "Target N" not already taken. */
function nextDefaultName(options: TargetsOptions): string {
  const taken = new Set(options.getTargetPresets().map((p) => p.name));
  let n = 1;
  while (taken.has(t('targets.defaultName', { n }))) n++;
  return t('targets.defaultName', { n });
}
