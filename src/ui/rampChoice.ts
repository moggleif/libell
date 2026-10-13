/**
 * The ramp choice the Ramps tab's two renderings share, and the compact
 * form's editors for it: the ready-made-ramp `<select>` and the step-height
 * chips (also shown under "Custom set" on the Ramps page).
 */
import { matchRampModel, rampLabel, RAMP_MODELS, type RampModel } from '../domain/ramps';
import { formatLength, unitToMm } from '../domain/lengths';
import { LENGTH_RANGES_MM } from '../domain/settings';
import { rangeProblem, type SettingsFormState } from './settingsFields';
import { createElement } from './dom';
import { t } from './i18n';

/**
 * The ramp choice both renderings share: the step heights, and whether
 * "Custom set" was chosen explicitly. That choice must hold even while the
 * steps still match a catalog model — without it the sync snapped the
 * choice straight back and "nothing happened". Auto-matching
 * resumes once a model is picked again.
 */
export interface RampChoice {
  steps: number[];
  customChosen: boolean;
}

export function choiceOf(stepsMm: number[]): RampChoice {
  return { steps: [...stepsMm], customChosen: matchRampModel(stepsMm) === null };
}

export type StepEditor = ReturnType<typeof createStepEditor>;

/**
 * The step heights as removable chips, plus a number field to add one.
 * Shown in the compact form, and under "Custom set" on the Ramps page.
 * `edited` runs after every change to `choice.steps`.
 */
export function createStepEditor(choice: RampChoice, state: SettingsFormState, edited: () => void) {
  const caption = document.createElement('span');
  const chips = createElement('div', 'steps__chips');
  const add = createAddStepRow(state, (mm) => {
    if (!choice.steps.includes(mm)) choice.steps = [...choice.steps, mm].sort((a, b) => a - b);
    edited();
  });

  const chip = (mm: number): HTMLElement =>
    createStepChip(formatLength(mm, state.unit), () => {
      choice.steps = choice.steps.filter((s) => s !== mm);
      edited();
    });

  return {
    caption,
    chips,
    addRow: add.row,
    renderChips: (): void => {
      chips.replaceChildren(...[...choice.steps].sort((a, b) => a - b).map(chip));
    },
    relabel: (): void => {
      caption.textContent = `${t('settings.steps')} (${state.unit})`;
      add.relabel();
    },
  };
}

/** A number field and an Add button, which hands a positive typed height
 * within the plausible range over in mm. Any other value is left in the
 * field with the same text the other number fields show (#514, #541). */
function createAddStepRow(state: SettingsFormState, onAdd: (mm: number) => void) {
  const row = createElement('div', 'steps__add');
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'decimal';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action menu__action--secondary steps__add-btn';
  row.append(input, button);
  const error = createElement('p', 'settings__hint settings__error');
  error.setAttribute('role', 'alert');
  error.hidden = true;

  input.addEventListener('input', () => {
    error.hidden = true;
  });
  const problem = (): string | null => {
    const v = input.valueAsNumber;
    if (!(Number.isFinite(v) && v > 0)) return t('settings.err.positive');
    return rangeProblem(unitToMm(v, state.unit), LENGTH_RANGES_MM.rampStep, state.unit);
  };
  button.addEventListener('click', () => {
    const text = problem();
    if (text !== null) {
      error.textContent = text;
      error.hidden = false;
      row.after(error);
      return;
    }
    const mm = unitToMm(input.valueAsNumber, state.unit);
    input.value = '';
    onAdd(mm);
  });

  return {
    row,
    relabel: (): void => {
      input.placeholder = state.unit === 'cm' ? '4' : '40';
      input.setAttribute('aria-label', t('settings.steps.new', { unit: state.unit }));
      button.textContent = `+ ${t('settings.steps.add')}`;
      if (!error.hidden) error.textContent = problem() ?? '';
    },
  };
}

/** One step height as a chip, with a button that removes it. */
function createStepChip(label: string, onRemove: () => void): HTMLElement {
  const element = createElement('span', 'steps__chip');
  const text = document.createElement('span');
  text.textContent = label;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'steps__chip-remove';
  remove.textContent = '−';
  remove.setAttribute('aria-label', t('settings.steps.remove', { value: label }));
  remove.addEventListener('click', onRemove);
  element.append(text, remove);
  return element;
}

/**
 * Ready-made ramp picker: choosing a catalog model fills the step list;
 * editing the chips afterwards flips the picker back to "custom". Labels
 * carry the mm figures, so they are not unit-aware. On the Ramps page
 * this `<select>` is not shown — the page picks models from its
 * catalogue instead — but it is kept alive (its `.value` and
 * `customChosen` still tracked) as the single source of truth for "which
 * model matches the current steps", including the explicit-custom
 * tie-break, shared by both UIs.
 */
export function createRampSelect(choice: RampChoice, onPick: (model: RampModel | null) => void) {
  const row = createElement('div', 'steps__ramp');
  const caption = createElement('span', 'menu__text');
  const select = createElement('select', 'settings__select');
  const customOption = document.createElement('option');
  customOption.value = '';
  select.append(customOption);
  for (const model of RAMP_MODELS) {
    const option = document.createElement('option');
    option.value = model.name;
    option.textContent = rampLabel(model);
    select.append(option);
  }
  select.addEventListener('change', () => {
    onPick(RAMP_MODELS.find((m) => m.name === select.value) ?? null);
  });
  row.append(caption, select);
  return {
    row,
    select,
    sync: (): void => {
      select.value = choice.customChosen
        ? ''
        : (matchRampModel(choice.steps, select.value)?.name ?? '');
    },
    selectedModel: (): RampModel | null =>
      choice.customChosen ? null : (RAMP_MODELS.find((m) => m.name === select.value) ?? null),
    relabel: (): void => {
      caption.textContent = t('settings.ramp');
      customOption.textContent = t('settings.ramp.custom');
    },
  };
}
