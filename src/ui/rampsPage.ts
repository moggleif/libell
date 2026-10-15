/**
 * The Ramps page (Modern's tab and Classic's ☰ page): the chosen ramp and
 * its step heights first, the catalogue behind one disclosure.
 */
import { formatLengthValue } from '../domain/lengths';
import { RAMP_MODELS, type RampModel } from '../domain/ramps';
import type { RampChoice, RampPick, StepEditor } from './rampChoice';
import type { SettingsFormState } from './settingsFields';
import { t } from './i18n';
import { createElement } from './dom';

export interface RampsPageParts {
  choice: RampChoice;
  state: SettingsFormState;
  editor: StepEditor;
  selectedModel(): RampModel | null;
  /** Number of ramps and its hint. */
  rampCount: HTMLElement[];
  onPick(pick: RampPick): void;
}

/**
 * The Ramps page, built into `panel`: the chosen ramp and its
 * step heights, Number of ramps, then "Change ramp" holding the brand
 * filter and the catalogue. Called at most once per form: it takes the
 * step editor's elements for its custom-set editor. Returns what redraws
 * the page.
 */
export function buildRampsPage(panel: HTMLElement, parts: RampsPageParts): () => void {
  const { choice, state, editor } = parts;
  const catalogue = createCatalogue(choice, state, parts.onPick);
  // The chip editor, under the custom row — shown only while a custom set
  // is chosen.
  const customEditor = createElement('div', 'klossar__custom-editor');
  customEditor.append(editor.caption, editor.chips, editor.addRow);
  const selection = createSelectionSummary(choice, state);

  // Answer first, means of changing it below: what you have set
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
 * "Change ramp": the brand filter and the catalogue it narrows,
 * behind one disclosure. Collapsed, because the tab's common errand is
 * checking what is set, not re-choosing.
 */
function createCatalogue(
  choice: RampChoice,
  state: SettingsFormState,
  onPick: (pick: RampPick) => void,
) {
  const element = createElement('details', 'settings__advanced klossar__picker-details');
  const summary = createElement('summary', 'settings__advanced-summary');
  // Set here rather than in `relabel`: this element only exists on the
  // Ramps page, and a language change reloads the whole app anyway.
  summary.textContent = t('settings.klossar.changeRamp');
  const filter = createBrandFilter(() => render(shownModel));
  element.append(summary, filter.row);

  const list = createElement('div', 'klossar__list');
  const custom = createOwnRow('custom', onPick);
  const stepless = createOwnRow('stepless', onPick);
  const models = createModelRows(onPick);
  list.append(custom.row, stepless.row, ...models.map((entry) => entry.row));
  element.append(list);

  let shownModel: RampModel | null = null;
  function render(selectedModel: RampModel | null): void {
    shownModel = selectedModel;
    custom.select(choice.customChosen && !choice.stepless);
    stepless.select(choice.customChosen && choice.stepless);
    for (const { row, model, mmLine, select } of models) {
      select(model === selectedModel);
      row.hidden = !filter.shows(model);
      mmLine.textContent = modelHeights(model, state.unit);
    }
  }

  return { element, render };
}

/** A model's heights: "44/78/112 mm", or a stepless wedge's "max 101 mm". */
function modelHeights(model: RampModel, unit: SettingsFormState['unit']): string {
  const heights = `${model.stepsMm.map((mm) => formatLengthValue(mm, unit)).join('/')} ${unit}`;
  return model.stepless ? `${t('settings.stepless.maxHeading')} ${heights}` : heights;
}

/** "Custom set" and "Stepless wedge" lead the list: your own ramp is one of
 * the options, and the one relevant whatever brand you own. Never hidden by
 * the brand filter. */
function createOwnRow(pick: 'custom' | 'stepless', onPick: (pick: RampPick) => void) {
  const own = catalogueRow(
    t(pick === 'custom' ? 'settings.ramp.custom' : 'settings.ramp.stepless'),
  );
  own.row.classList.add('klossar__row--custom');
  own.row.addEventListener('click', () => onPick(pick));
  return own;
}

/** One row per ready-made ramp, with a line for its step heights. */
function createModelRows(onPick: (pick: RampPick) => void) {
  return RAMP_MODELS.map((model) => {
    const mmLine = createElement('span', 'klossar__row-mm');
    const entry = catalogueRow(model.name, mmLine);
    entry.row.addEventListener('click', () => onPick(model));
    return { ...entry, model, mmLine };
  });
}

const brandOf = (model: RampModel): string => model.name.split(' ')[0]!;

/** "All" and one chip per brand; exactly one is pressed. `changed` runs
 * after every pick. */
function createBrandFilter(changed: () => void) {
  const row = createElement('div', 'klossar__filter');
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
  const nameEl = createElement('span', 'klossar__row-name');
  nameEl.textContent = name;
  if (mmLine) {
    const info = createElement('span', 'klossar__row-info');
    info.append(nameEl, mmLine);
    row.append(info);
  } else {
    row.append(nameEl);
  }
  const radio = createElement('span', 'klossar__radio');
  radio.setAttribute('aria-hidden', 'true');
  row.append(radio);
  return {
    row,
    select: (selected: boolean): void => {
      // The radio is hidden from screen readers; this says it instead (#535).
      row.setAttribute('aria-pressed', String(selected));
      row.classList.toggle('klossar__row--selected', selected);
      radio.classList.toggle('klossar__radio--selected', selected);
    },
  };
}

/**
 * What is chosen, read top-down as one statement: "Selected:
 * Thule Levelers, whose step heights are these".
 */
function createSelectionSummary(choice: RampChoice, state: SettingsFormState) {
  const element = createElement('div', 'klossar__selected');
  const head = createElement('div', 'klossar__footer-head');
  const label = createElement('span', 'klossar__footer-label');
  label.textContent = t('settings.klossar.selected');
  const modelName = createElement('span', 'klossar__footer-model');
  head.append(label, modelName);
  const heading = createElement('span', 'klossar__footer-heading');
  const grid = createElement('div', 'klossar__grid');
  element.append(head, heading, grid);

  return {
    element,
    render: (selectedModel: RampModel | null): void => {
      const sortedSteps = [...choice.steps].sort((a, b) => a - b);
      const headingKey = choice.stepless
        ? 'settings.stepless.maxHeading'
        : 'settings.klossar.stepsHeading';
      heading.textContent = `${t(headingKey)} (${state.unit})`;
      modelName.textContent = selectedModel ? selectedModel.name : ownName(choice);
      grid.style.gridTemplateColumns = `repeat(${sortedSteps.length || 1}, 1fr)`;
      grid.replaceChildren(
        ...sortedSteps.map((mm, i) =>
          stepCell(cellLabel(choice, i + 1), formatLengthValue(mm, state.unit)),
        ),
      );
    },
  };
}

const ownName = (choice: RampChoice): string =>
  t(choice.stepless ? 'settings.ramp.stepless' : 'settings.ramp.custom');

/** "Step n"; a stepless wedge's one height needs no label under its
 * "Max height" heading. */
const cellLabel = (choice: RampChoice, n: number): string =>
  choice.stepless ? '' : t('diagram.step', { n });

/** A label, if any, over its height: one cell of the selection grid. */
function stepCell(label: string, value: string): HTMLElement {
  const element = createElement('div', 'klossar__grid-cell');
  const stepLabel = createElement('span', 'klossar__grid-label');
  stepLabel.textContent = label;
  const valueEl = createElement('span', 'klossar__grid-value');
  valueEl.textContent = value;
  if (label) element.append(stepLabel);
  element.append(valueEl);
  return element;
}
