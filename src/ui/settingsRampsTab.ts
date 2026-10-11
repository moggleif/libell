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

export function createRampsTab(initial: LevelSettings, context: SettingsFormContext): RampsTab {
  const { state } = context;
  let steps = [...initial.rampStepHeightsMm];
  // An explicitly chosen "Custom set" must hold even while the steps
  // still match a catalog model — without this the sync below snapped
  // the choice straight back and "nothing happened" (#91). Auto-matching
  // resumes once a model is picked again.
  let customChosen = matchRampModel(initial.rampStepHeightsMm) === null;
  /** Set by `buildPage`; stays null (a no-op) without it. */
  let renderPage: (() => void) | null = null;

  const editor = createStepEditor();
  const rampPicker = createRampSelect();

  const stepsField = document.createElement('div');
  stepsField.className = 'settings__field settings__field--wide';
  stepsField.append(editor.caption, rampPicker.row, editor.chips, editor.addRow);

  // How many ramps the user actually owns (#93). Sold in pairs, so 2 is
  // the default; a few carry 3 or 4. The plan never asks for more wheels
  // than this. A caravan ramps one wheel — field hidden.
  const rampCount = createSelectField(
    Array.from({ length: MAX_RAMP_COUNT }, (_, i) => ({
      value: String(i + 1),
      text: String(i + 1),
    })),
    String(initial.rampCount),
  );
  rampCount.control.addEventListener('change', () => context.changed());
  // What the number actually means (#246): how many you own, and that the
  // app puts them where they help most — one sentence, under the field.
  const rampCountHint = createHint();
  const rampHint = createHint();

  /** Apply a catalog model (or null for "custom") — shared by the
   * `<select>` and the Ramps page's catalogue. */
  function applyRampChoice(model: RampModel | null): void {
    customChosen = !model;
    rampPicker.select.value = model ? model.name : '';
    if (model) steps = [...model.stepsMm];
    render();
    context.changed();
  }

  function render(): void {
    editor.renderChips();
    rampPicker.sync();
    renderPage?.();
  }

  /**
   * The step heights as removable chips, plus a number field to add one.
   * Shown in the compact form, and under "Custom set" on the Ramps page.
   */
  function createStepEditor() {
    const caption = document.createElement('span');
    const chips = document.createElement('div');
    chips.className = 'steps__chips';

    const addRow = document.createElement('div');
    addRow.className = 'steps__add';
    const addInput = document.createElement('input');
    addInput.type = 'number';
    addInput.inputMode = 'decimal';
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'menu__action menu__action--secondary steps__add-btn';
    addButton.disabled = true;
    addRow.append(addInput, addButton);

    const typedStep = (): number | null => {
      const v = addInput.valueAsNumber;
      return Number.isFinite(v) && v > 0 ? v : null;
    };
    addInput.addEventListener('input', () => {
      addButton.disabled = typedStep() === null;
    });
    addButton.addEventListener('click', () => {
      const v = typedStep();
      if (v === null) return;
      const mm = fromUnit(v, state.unit);
      if (!steps.includes(mm)) steps = [...steps, mm].sort((a, b) => a - b);
      addInput.value = '';
      addButton.disabled = true;
      render();
      context.changed();
    });

    const chip = (mm: number): HTMLElement => {
      const element = document.createElement('span');
      element.className = 'steps__chip';
      const label = document.createElement('span');
      label.textContent = formatLength(mm, state.unit);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'steps__chip-remove';
      remove.textContent = '−';
      remove.setAttribute(
        'aria-label',
        t('settings.steps.remove', { value: formatLength(mm, state.unit) }),
      );
      remove.addEventListener('click', () => {
        steps = steps.filter((s) => s !== mm);
        render();
        context.changed();
      });
      element.append(label, remove);
      return element;
    };

    return {
      caption,
      chips,
      addRow,
      renderChips: (): void => {
        chips.replaceChildren(...[...steps].sort((a, b) => a - b).map(chip));
      },
      relabel: (): void => {
        caption.textContent = `${t('settings.steps')} (${state.unit})`;
        addInput.placeholder = state.unit === 'cm' ? '4' : '40';
        addButton.textContent = `+ ${t('settings.steps.add')}`;
      },
    };
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
  function createRampSelect() {
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
      applyRampChoice(RAMP_MODELS.find((m) => m.name === select.value) ?? null);
    });
    row.append(caption, select);
    return {
      row,
      select,
      sync: (): void => {
        select.value = customChosen ? '' : (matchRampModel(steps, select.value)?.name ?? '');
      },
      selectedModel: (): RampModel | null =>
        customChosen ? null : (RAMP_MODELS.find((m) => m.name === select.value) ?? null),
      relabel: (): void => {
        caption.textContent = t('settings.ramp');
        customOption.textContent = t('settings.ramp.custom');
      },
    };
  }

  /**
   * The Ramps page (#246), built into `panel`: the chosen ramp and its
   * step heights, Number of ramps, then "Change ramp" holding the brand
   * filter and the catalogue. Called at most once per form: it takes the
   * step editor's elements for its custom-set editor.
   */
  function buildPage(panel: HTMLElement): void {
    const catalogue = createCatalogue();
    // The existing chip editor (add/remove step heights), relocated
    // under the custom row — shown only while a custom set is chosen.
    const customEditor = document.createElement('div');
    customEditor.className = 'klossar__custom-editor';
    customEditor.append(editor.caption, editor.chips, editor.addRow);
    const selection = createSelectionSummary();

    // Answer first, means of changing it below (#246): what you have set
    // — the model and its step heights — then the settings that follow
    // from it, then the one disclosure that changes the choice, filter and
    // catalogue together. The custom step-height editor stays directly
    // under the block showing those heights, since that is what it edits.
    panel.append(
      selection.element,
      customEditor,
      rampCount.element,
      rampCountHint,
      catalogue.element,
    );

    renderPage = (): void => {
      const selectedModel = rampPicker.selectedModel();
      catalogue.render(selectedModel);
      customEditor.hidden = !customChosen;
      selection.render(selectedModel);
    };
  }

  /**
   * "Change ramp" (#246): the brand filter and the catalogue it narrows,
   * behind one disclosure. Collapsed, because the tab's common errand is
   * checking what is set, not re-choosing.
   */
  function createCatalogue() {
    const element = document.createElement('details');
    element.className = 'settings__advanced klossar__picker-details';
    const summary = document.createElement('summary');
    summary.className = 'settings__advanced-summary';
    // Set here rather than in `relabel`: this element only exists on the
    // Ramps page, and a language change reloads the whole app anyway.
    summary.textContent = t('settings.klossar.changeRamp');
    const filterRow = document.createElement('div');
    filterRow.className = 'klossar__filter';
    element.append(summary, filterRow);

    const brandOf = (model: RampModel): string => model.name.split(' ')[0]!;
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
        render();
      });
      filterRow.append(chip);
      brandChips.set(brand, chip);
    };
    addBrandChip(null, t('settings.klossar.brandAll'));
    for (const brand of new Set(RAMP_MODELS.map(brandOf))) addBrandChip(brand, brand);
    brandChips.get(null)!.setAttribute('aria-pressed', 'true');

    const list = document.createElement('div');
    list.className = 'klossar__list';
    // "Custom set" leads the list (#246): choosing your own step heights
    // is one of the options, and the one relevant whatever brand you own.
    // Never hidden by the brand filter.
    const custom = catalogueRow(t('settings.ramp.custom'));
    custom.row.classList.add('klossar__row--custom');
    custom.row.addEventListener('click', () => applyRampChoice(null));
    list.append(custom.row);

    const models = RAMP_MODELS.map((model) => {
      const mmLine = document.createElement('span');
      mmLine.className = 'klossar__row-mm';
      const entry = catalogueRow(model.name, mmLine);
      entry.row.addEventListener('click', () => applyRampChoice(model));
      list.append(entry.row);
      return { ...entry, model, mmLine };
    });
    element.append(list);

    return {
      element,
      render: (selectedModel: RampModel | null): void => {
        custom.select(customChosen);
        for (const { row, model, mmLine, select } of models) {
          select(model === selectedModel);
          row.hidden = brandFilter !== null && brandOf(model) !== brandFilter;
          mmLine.textContent = `${model.stepsMm
            .map((mm) => formatLengthValue(mm, state.unit))
            .join('/')} ${state.unit}`;
        }
      },
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
  function createSelectionSummary() {
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

    const cell = (mm: number, i: number): HTMLElement => {
      const element = document.createElement('div');
      element.className = 'klossar__grid-cell';
      const stepLabel = document.createElement('span');
      stepLabel.className = 'klossar__grid-label';
      stepLabel.textContent = t('diagram.step', { n: i + 1 });
      const value = document.createElement('span');
      value.className = 'klossar__grid-value';
      value.textContent = formatLengthValue(mm, state.unit);
      element.append(stepLabel, value);
      return element;
    };

    return {
      element,
      render: (selectedModel: RampModel | null): void => {
        const sortedSteps = [...steps].sort((a, b) => a - b);
        heading.textContent = `${t('settings.klossar.stepsHeading')} (${state.unit})`;
        modelName.textContent = selectedModel ? selectedModel.name : t('settings.ramp.custom');
        grid.style.gridTemplateColumns = `repeat(${sortedSteps.length || 1}, 1fr)`;
        grid.replaceChildren(...sortedSteps.map(cell));
      },
    };
  }

  return {
    stepsField,
    rampCountField: rampCount.element,
    rampHint,
    buildPage,
    render,
    showSteps: (stepsMm) => {
      steps = [...stepsMm];
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
      raw.rampStepHeightsMm = [...steps];
      raw.rampCount = Number(rampCount.control.value);
    },
    populate: (settings) => {
      steps = [...settings.rampStepHeightsMm];
      customChosen = matchRampModel(steps) === null;
      rampCount.control.value = String(settings.rampCount);
    },
  };
}
