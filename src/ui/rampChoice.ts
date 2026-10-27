/**
 * The ramp choice the Ramps tab's two renderings share, and the compact
 * form's editors for it: the ready-made-ramp `<select>` and the step-height
 * chips (also shown under "Custom set" on the Ramps page).
 */
import { matchRampModel, rampLabel, RAMP_MODELS, type RampModel } from '../domain/ramps';
import { formatLength, unitToMm, type LengthUnit } from '../domain/lengths';
import { LENGTH_RANGES_MM } from '../domain/settings';
import { rangeProblem, type SettingsFormState } from './settingsFields';
import { button, createElement } from './dom';
import { t } from './i18n';

/** A typical step height, as the empty Add field's hint. */
const STEP_PLACEHOLDER: Record<LengthUnit, string> = { mm: '40', cm: '4', in: '1.5' };

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
  /** A stepless wedge (#600): `steps` holds its maximum height alone. */
  stepless: boolean;
}

export function choiceOf(stepsMm: number[], stepless = false): RampChoice {
  return {
    steps: [...stepsMm],
    customChosen: matchRampModel(stepsMm, undefined, stepless) === null,
    stepless,
  };
}

/** What can be picked: a ready-made model, your own steps, or your own
 * stepless wedge. */
export type RampPick = RampModel | 'custom' | 'stepless';

/** The `<select>` value of a stepless wedge of your own; a model's is its
 * name and a custom set's is empty. */
const STEPLESS_VALUE = 'stepless';

/** A model's catalogue label: its steps, or a stepless wedge's maximum. */
function modelLabel(model: RampModel): string {
  if (!model.stepless) return rampLabel(model);
  return t('settings.ramp.steplessModel', { name: model.name, max: model.stepsMm[0] ?? 0 });
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
  // A stepless wedge has one height, its maximum: the field sets it.
  const add = createAddStepRow(state, choice, (mm) => {
    if (choice.stepless) choice.steps = [mm];
    else if (!choice.steps.includes(mm)) choice.steps = [...choice.steps, mm].sort((a, b) => a - b);
    edited();
  });

  const chip = (mm: number): HTMLElement =>
    createStepChip(formatLength(mm, state.unit), choice.stepless, () => {
      choice.steps = choice.steps.filter((s) => s !== mm);
      edited();
    });

  const relabel = (): void => {
    const heading = choice.stepless ? 'settings.stepless.maxHeading' : 'settings.steps';
    caption.textContent = `${t(heading)} (${state.unit})`;
    add.relabel();
  };
  return {
    caption,
    chips,
    addRow: add.row,
    renderChips: (): void => {
      chips.replaceChildren(...[...choice.steps].sort((a, b) => a - b).map(chip));
      relabel();
    },
    relabel,
  };
}

/** A number field and an Add button, which hands a positive typed height
 * within the plausible range over in mm. Any other value is left in the
 * field with the same text the other number fields show (#514, #541). */
function createAddStepRow(
  state: SettingsFormState,
  choice: RampChoice,
  onAdd: (mm: number) => void,
) {
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
      input.placeholder = STEP_PLACEHOLDER[state.unit];
      const label = choice.stepless ? 'settings.stepless.new' : 'settings.steps.new';
      input.setAttribute('aria-label', t(label, { unit: state.unit }));
      button.textContent = addButtonText(choice);
      if (!error.hidden) error.textContent = problem() ?? '';
    },
  };
}

/** "+ Add" a step, or "Save" a stepless wedge's maximum. */
const addButtonText = (choice: RampChoice): string =>
  choice.stepless ? t('settings.stepless.set') : `+ ${t('settings.steps.add')}`;

/** One step height as a chip, with a button that removes it; a stepless
 * wedge's maximum is replaced, never removed. */
function createStepChip(label: string, fixed: boolean, onRemove: () => void): HTMLElement {
  const element = createElement('span', 'steps__chip');
  const text = document.createElement('span');
  text.textContent = label;
  const remove = button('steps__chip-remove', '−', onRemove);
  remove.setAttribute('aria-label', t('settings.steps.remove', { value: label }));
  element.append(text);
  if (!fixed) element.append(remove);
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
export function createRampSelect(choice: RampChoice, onPick: (pick: RampPick) => void) {
  const row = createElement('div', 'steps__ramp');
  const caption = createElement('span', 'menu__text');
  const select = createElement('select', 'settings__select');
  const customOption = option('');
  const steplessOption = option(STEPLESS_VALUE);
  select.append(customOption, steplessOption);
  for (const model of RAMP_MODELS) select.append(option(model.name, modelLabel(model)));
  select.addEventListener('change', () => onPick(pickOf(select.value)));
  row.append(caption, select);
  return {
    row,
    select,
    sync: (): void => {
      select.value = (choice.customChosen ? null : matchedName(choice, select)) ?? ownValue(choice);
    },
    selectedModel: (): RampModel | null =>
      choice.customChosen ? null : (RAMP_MODELS.find((m) => m.name === select.value) ?? null),
    relabel: (): void => {
      caption.textContent = t('settings.ramp');
      customOption.textContent = t('settings.ramp.custom');
      steplessOption.textContent = t('settings.ramp.stepless');
    },
  };
}

function option(value: string, text = ''): HTMLOptionElement {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = text;
  return element;
}

function pickOf(value: string): RampPick {
  if (value === STEPLESS_VALUE) return 'stepless';
  return RAMP_MODELS.find((m) => m.name === value) ?? 'custom';
}

/** The `<select>` value of a set of your own. */
const ownValue = (choice: RampChoice): string => (choice.stepless ? STEPLESS_VALUE : '');

function matchedName(choice: RampChoice, select: HTMLSelectElement): string | null {
  return matchRampModel(choice.steps, select.value, choice.stepless)?.name ?? null;
}
