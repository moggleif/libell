/**
 * Settings › Ramps: which ramp the user owns — a ready-made model or a
 * custom set of step heights — and how many of them (#93).
 *
 * Two renderings share one state. The Ramps page (#246; Modern's tab and
 * Classic's ☰ page since #331) shows the chosen ramp first and the
 * catalogue behind one disclosure. The wizard's ramps step and the flat
 * Classic page keep the compact form: a ready-made-ramp `<select>` with a
 * chip editor (no separator syntax to learn).
 */
import {
  formatLength,
  formatLengthValue,
  MAX_RAMP_COUNT,
  type LevelSettings,
} from '../domain/settings';
import { matchRampModel, rampLabel, RAMP_MODELS, type RampModel } from '../domain/ramps';
import {
  createHint,
  createSelectField,
  fromUnit,
  type RawSettings,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { t } from './i18n';

export interface RampsTab {
  /** The compact step editor: the ramp `<select>` and the chips. */
  stepsField: HTMLElement;
  rampCountField: HTMLElement;
  /** What the ramp settings are for, shown on its own by the compact form. */
  rampHint: HTMLParagraphElement;
  /** Builds the Ramps page into `panel`. At most once per form. */
  buildPage(panel: HTMLElement): void;
  /** Redraws the chips, the `<select>` and the Ramps page from the state. */
  render(): void;
  /** Shows the step heights as stored, keeping the custom/model choice. */
  showSteps(stepsMm: number[]): void;
  relabel(): void;
  read(raw: RawSettings): void;
  populate(settings: LevelSettings): void;
}

/**
 * The ramp choice both renderings share: the step heights, and whether
 * "Custom set" was chosen explicitly. That choice must hold even while the
 * steps still match a catalog model — without it the sync snapped the
 * choice straight back and "nothing happened" (#91). Auto-matching
 * resumes once a model is picked again.
 */
interface RampChoice {
  steps: number[];
  customChosen: boolean;
}

function choiceOf(stepsMm: number[]): RampChoice {
  return { steps: [...stepsMm], customChosen: matchRampModel(stepsMm) === null };
}

export function createRampsTab(initial: LevelSettings, context: SettingsFormContext): RampsTab {
  const { state } = context;
  const choice = choiceOf(initial.rampStepHeightsMm);
  /** Set by `buildPage`; stays null (a no-op) without it. */
  let renderPage: (() => void) | null = null;

  const editor = createStepEditor(choice, state, stepsEdited);
  const rampPicker = createRampSelect(choice, applyRampChoice);

  const stepsField = document.createElement('div');
  stepsField.className = 'settings__field settings__field--wide';
  stepsField.append(editor.caption, rampPicker.row, editor.chips, editor.addRow);

  const rampCount = createRampCountField(initial.rampCount, context);
  // What the number actually means (#246): how many you own, and that the
  // app puts them where they help most — one sentence, under the field.
  const rampCountHint = createHint();
  const rampHint = createHint();

  /** Apply a catalog model (or null for "custom") — shared by the
   * `<select>` and the Ramps page's catalogue. */
  function applyRampChoice(model: RampModel | null): void {
    choice.customChosen = !model;
    rampPicker.select.value = model ? model.name : '';
    if (model) choice.steps = [...model.stepsMm];
    stepsEdited();
  }

  function stepsEdited(): void {
    render();
    context.changed();
  }

  function render(): void {
    editor.renderChips();
    rampPicker.sync();
    renderPage?.();
  }

  function buildPage(panel: HTMLElement): void {
    renderPage = buildRampsPage(panel, {
      choice,
      state,
      editor,
      selectedModel: rampPicker.selectedModel,
      rampCount: [rampCount.element, rampCountHint],
      onPick: applyRampChoice,
    });
  }

  return {
    stepsField,
    rampCountField: rampCount.element,
    rampHint,
    buildPage,
    render,
    showSteps: (stepsMm) => {
      choice.steps = [...stepsMm];
      render();
    },
    relabel: () => {
      editor.relabel();
      rampPicker.relabel();
      // Ramp planning applies to the motorhome; a caravan ramps one wheel.
      const isCaravan = state.vehicle === 'caravan';
      rampCount.element.hidden = isCaravan;
      rampCountHint.hidden = isCaravan;
      rampHint.hidden = isCaravan;
      rampCount.caption.textContent = t('settings.rampCount');
      rampHint.textContent = t('settings.rampHint');
      rampCountHint.textContent = t('settings.rampCountHint');
    },
    read: (raw) => {
      raw.rampStepHeightsMm = [...choice.steps];
      raw.rampCount = Number(rampCount.control.value);
    },
    populate: (settings) => {
      Object.assign(choice, choiceOf(settings.rampStepHeightsMm));
      rampCount.control.value = String(settings.rampCount);
    },
  };
}

interface RampsPageParts {
  choice: RampChoice;
  state: SettingsFormState;
  editor: ReturnType<typeof createStepEditor>;
  selectedModel(): RampModel | null;
  /** Number of ramps and its hint. */
  rampCount: HTMLElement[];
  onPick(model: RampModel | null): void;
}

/**
 * The Ramps page (#246), built into `panel`: the chosen ramp and its
 * step heights, Number of ramps, then "Change ramp" holding the brand
 * filter and the catalogue. Called at most once per form: it takes the
 * step editor's elements for its custom-set editor. Returns what redraws
 * the page.
 */
function buildRampsPage(panel: HTMLElement, parts: RampsPageParts): () => void {
  const { choice, state, editor } = parts;
  const catalogue = createCatalogue(choice, state, parts.onPick);
  // The existing chip editor (add/remove step heights), relocated
  // under the custom row — shown only while a custom set is chosen.
  const customEditor = document.createElement('div');
  customEditor.className = 'klossar__custom-editor';
  customEditor.append(editor.caption, editor.chips, editor.addRow);
  const selection = createSelectionSummary(choice, state);

  // Answer first, means of changing it below (#246): what you have set
  // — the model and its step heights — then the settings that follow
  // from it, then the one disclosure that changes the choice, filter and
  // catalogue together. The custom step-height editor stays directly
  // under the block showing those heights, since that is what it edits.
  panel.append(selection.element, customEditor, ...parts.rampCount, catalogue.element);

  return (): void => {
    const selectedModel = parts.selectedModel();
    catalogue.render(selectedModel);
    customEditor.hidden = !choice.customChosen;
    selection.render(selectedModel);
  };
}

/**
 * How many ramps the user actually owns (#93). Sold in pairs, so 2 is the
 * default; a few carry 3 or 4. The plan never asks for more wheels than
 * this. A caravan ramps one wheel — the tab hides the field.
 */
function createRampCountField(count: number, context: SettingsFormContext) {
  const field = createSelectField(
    Array.from({ length: MAX_RAMP_COUNT }, (_, i) => ({
      value: String(i + 1),
      text: String(i + 1),
    })),
    String(count),
  );
  field.control.addEventListener('change', () => context.changed());
  return field;
}

/**
 * The step heights as removable chips, plus a number field to add one.
 * Shown in the compact form, and under "Custom set" on the Ramps page.
 * `edited` runs after every change to `choice.steps`.
 */
function createStepEditor(choice: RampChoice, state: SettingsFormState, edited: () => void) {
  const caption = document.createElement('span');
  const chips = document.createElement('div');
  chips.className = 'steps__chips';
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

/** A number field and an Add button, enabled only for a positive number,
 * which hands the typed height over in mm. */
function createAddStepRow(state: SettingsFormState, onAdd: (mm: number) => void) {
  const row = document.createElement('div');
  row.className = 'steps__add';
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'decimal';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action menu__action--secondary steps__add-btn';
  button.disabled = true;
  row.append(input, button);

  const typedStep = (): number | null => {
    const v = input.valueAsNumber;
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  input.addEventListener('input', () => {
    button.disabled = typedStep() === null;
  });
  button.addEventListener('click', () => {
    const v = typedStep();
    if (v === null) return;
    input.value = '';
    button.disabled = true;
    onAdd(fromUnit(v, state.unit));
  });

  return {
    row,
    relabel: (): void => {
      input.placeholder = state.unit === 'cm' ? '4' : '40';
      button.textContent = `+ ${t('settings.steps.add')}`;
    },
  };
}

/** One step height as a chip, with a button that removes it. */
function createStepChip(label: string, onRemove: () => void): HTMLElement {
  const element = document.createElement('span');
  element.className = 'steps__chip';
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
 * model matches the current steps", including the #91 tie-break
 * behavior, shared by both UIs.
 */
function createRampSelect(choice: RampChoice, onPick: (model: RampModel | null) => void) {
  const row = document.createElement('div');
  row.className = 'steps__ramp';
  const caption = document.createElement('span');
  caption.className = 'menu__text';
  const select = document.createElement('select');
  select.className = 'settings__select';
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

/**
 * "Change ramp" (#246): the brand filter and the catalogue it narrows,
 * behind one disclosure. Collapsed, because the tab's common errand is
 * checking what is set, not re-choosing.
 */
function createCatalogue(
  choice: RampChoice,
  state: SettingsFormState,
  onPick: (model: RampModel | null) => void,
) {
  const element = document.createElement('details');
  element.className = 'settings__advanced klossar__picker-details';
  const summary = document.createElement('summary');
  summary.className = 'settings__advanced-summary';
  // Set here rather than in `relabel`: this element only exists on the
  // Ramps page, and a language change reloads the whole app anyway.
  summary.textContent = t('settings.klossar.changeRamp');
  const filter = createBrandFilter(() => render(shownModel));
  element.append(summary, filter.row);

  const list = document.createElement('div');
  list.className = 'klossar__list';
  // "Custom set" leads the list (#246): choosing your own step heights
  // is one of the options, and the one relevant whatever brand you own.
  // Never hidden by the brand filter.
  const custom = catalogueRow(t('settings.ramp.custom'));
  custom.row.classList.add('klossar__row--custom');
  custom.row.addEventListener('click', () => onPick(null));
  list.append(custom.row);

  const models = RAMP_MODELS.map((model) => {
    const mmLine = document.createElement('span');
    mmLine.className = 'klossar__row-mm';
    const entry = catalogueRow(model.name, mmLine);
    entry.row.addEventListener('click', () => onPick(model));
    list.append(entry.row);
    return { ...entry, model, mmLine };
  });
  element.append(list);

  let shownModel: RampModel | null = null;
  function render(selectedModel: RampModel | null): void {
    shownModel = selectedModel;
    custom.select(choice.customChosen);
    for (const { row, model, mmLine, select } of models) {
      select(model === selectedModel);
      row.hidden = !filter.shows(model);
      mmLine.textContent = `${model.stepsMm
        .map((mm) => formatLengthValue(mm, state.unit))
        .join('/')} ${state.unit}`;
    }
  }

  return { element, render };
}

const brandOf = (model: RampModel): string => model.name.split(' ')[0]!;

/** "All" and one chip per brand; exactly one is pressed. `changed` runs
 * after every pick. */
function createBrandFilter(changed: () => void) {
  const row = document.createElement('div');
  row.className = 'klossar__filter';
  let brandFilter: string | null = null;
  const brandChips = new Map<string | null, HTMLButtonElement>();
  const addBrandChip = (brand: string | null, label: string): void => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'klossar__chip';
    chip.textContent = label;
    chip.addEventListener('click', () => {
      brandFilter = brand;
      for (const [b, c] of brandChips) c.setAttribute('aria-pressed', String(b === brandFilter));
      changed();
    });
    row.append(chip);
    brandChips.set(brand, chip);
  };
  addBrandChip(null, t('settings.klossar.brandAll'));
  for (const brand of new Set(RAMP_MODELS.map(brandOf))) addBrandChip(brand, brand);
  brandChips.get(null)!.setAttribute('aria-pressed', 'true');

  return {
    row,
    shows: (model: RampModel): boolean => brandFilter === null || brandOf(model) === brandFilter,
  };
}

/** One catalogue row: a name (and the model's step heights), and a radio. */
function catalogueRow(name: string, mmLine?: HTMLElement) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'klossar__row';
  const nameEl = document.createElement('span');
  nameEl.className = 'klossar__row-name';
  nameEl.textContent = name;
  if (mmLine) {
    const info = document.createElement('span');
    info.className = 'klossar__row-info';
    info.append(nameEl, mmLine);
    row.append(info);
  } else {
    row.append(nameEl);
  }
  const radio = document.createElement('span');
  radio.className = 'klossar__radio';
  radio.setAttribute('aria-hidden', 'true');
  row.append(radio);
  return {
    row,
    select: (selected: boolean): void => {
      row.classList.toggle('klossar__row--selected', selected);
      radio.classList.toggle('klossar__radio--selected', selected);
    },
  };
}

/**
 * What is chosen, read top-down as one statement (#246): "Selected:
 * Thule Levelers, whose step heights are these".
 */
function createSelectionSummary(choice: RampChoice, state: SettingsFormState) {
  const element = document.createElement('div');
  element.className = 'klossar__selected';
  const head = document.createElement('div');
  head.className = 'klossar__footer-head';
  const label = document.createElement('span');
  label.className = 'klossar__footer-label';
  label.textContent = t('settings.klossar.selected');
  const modelName = document.createElement('span');
  modelName.className = 'klossar__footer-model';
  head.append(label, modelName);
  const heading = document.createElement('span');
  heading.className = 'klossar__footer-heading';
  const grid = document.createElement('div');
  grid.className = 'klossar__grid';
  element.append(head, heading, grid);

  return {
    element,
    render: (selectedModel: RampModel | null): void => {
      const sortedSteps = [...choice.steps].sort((a, b) => a - b);
      heading.textContent = `${t('settings.klossar.stepsHeading')} (${state.unit})`;
      modelName.textContent = selectedModel ? selectedModel.name : t('settings.ramp.custom');
      grid.style.gridTemplateColumns = `repeat(${sortedSteps.length || 1}, 1fr)`;
      grid.replaceChildren(
        ...sortedSteps.map((mm, i) => stepCell(i + 1, formatLengthValue(mm, state.unit))),
      );
    },
  };
}

/** "Step n" over its height, one cell of the selection grid. */
function stepCell(n: number, value: string): HTMLElement {
  const element = document.createElement('div');
  element.className = 'klossar__grid-cell';
  const stepLabel = document.createElement('span');
  stepLabel.className = 'klossar__grid-label';
  stepLabel.textContent = t('diagram.step', { n });
  const valueEl = document.createElement('span');
  valueEl.className = 'klossar__grid-value';
  valueEl.textContent = value;
  element.append(stepLabel, valueEl);
  return element;
}
