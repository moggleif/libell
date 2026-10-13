/**
 * The Ramps page (Modern's tab and Classic's ☰ page): the chosen ramp and
 * its step heights first, the catalogue behind one disclosure.
 */
import { formatLengthValue } from '../domain/lengths';
import { RAMP_MODELS, type RampModel } from '../domain/ramps';
import type { RampChoice, StepEditor } from './rampChoice';
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
  onPick(model: RampModel | null): void;
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
  onPick: (model: RampModel | null) => void,
) {
  const element = createElement('details', 'settings__advanced klossar__picker-details');
  const summary = createElement('summary', 'settings__advanced-summary');
  // Set here rather than in `relabel`: this element only exists on the
  // Ramps page, and a language change reloads the whole app anyway.
  summary.textContent = t('settings.klossar.changeRamp');
  const filter = createBrandFilter(() => render(shownModel));
  element.append(summary, filter.row);

  const list = createElement('div', 'klossar__list');
  const custom = createCustomRow(onPick);
  const models = createModelRows(onPick);
  list.append(custom.row, ...models.map((entry) => entry.row));
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

/** "Custom set" leads the list: choosing your own step heights is one of
 * the options, and the one relevant whatever brand you own. Never hidden by
 * the brand filter. */
function createCustomRow(onPick: (model: RampModel | null) => void) {
  const custom = catalogueRow(t('settings.ramp.custom'));
  custom.row.classList.add('klossar__row--custom');
  custom.row.addEventListener('click', () => onPick(null));
  return custom;
}

/** One row per ready-made ramp, with a line for its step heights. */
function createModelRows(onPick: (model: RampModel | null) => void) {
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
  const element = createElement('div', 'klossar__grid-cell');
  const stepLabel = createElement('span', 'klossar__grid-label');
  stepLabel.textContent = t('diagram.step', { n });
  const valueEl = createElement('span', 'klossar__grid-value');
  valueEl.textContent = value;
  element.append(stepLabel, valueEl);
  return element;
}
