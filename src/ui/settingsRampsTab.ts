/**
 * Settings › Ramps: which ramp the user owns — a ready-made model or a
 * custom set of step heights — and how many of them.
 *
 * Two renderings share one state. The Ramps page (Modern's tab and
 * Classic's ☰ page) shows the chosen ramp first and the catalogue behind
 * one disclosure. The wizard's ramps step and the flat Classic page keep
 * the compact form: a ready-made-ramp `<select>` with a chip editor (no
 * separator syntax to learn).
 */
import { MAX_RAMP_COUNT, type LevelSettings } from '../domain/settings';
import type { RampModel } from '../domain/ramps';
import {
  choiceOf,
  createRampSelect,
  createStepEditor,
  type RampChoice,
  type StepEditor,
} from './rampChoice';
import { buildRampsPage } from './rampsPage';
import {
  createHint,
  createSelectField,
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

/** The tab's parts; the functions below work on one. */
interface RampsTabParts {
  readonly context: SettingsFormContext;
  readonly choice: RampChoice;
  readonly editor: StepEditor;
  readonly rampPicker: ReturnType<typeof createRampSelect>;
  readonly rampCount: ReturnType<typeof createRampCountField>;
  /** What the number actually means: how many you own, and that the app
   * puts them where they help most — one sentence, under the field. */
  readonly rampCountHint: HTMLParagraphElement;
  readonly rampHint: HTMLParagraphElement;
  /** Set by `buildPage`; stays null (a no-op) without it. */
  renderPage: (() => void) | null;
}

export function createRampsTab(initial: LevelSettings, context: SettingsFormContext): RampsTab {
  const choice = choiceOf(initial.rampStepHeightsMm);
  const parts: RampsTabParts = {
    context,
    choice,
    editor: createStepEditor(choice, context.state, () => stepsEdited(parts)),
    rampPicker: createRampSelect(choice, (model) => applyRampChoice(parts, model)),
    rampCount: createRampCountField(initial.rampCount, context),
    rampCountHint: createHint(),
    rampHint: createHint(),
    renderPage: null,
  };
  return {
    stepsField: createStepsField(parts),
    rampCountField: parts.rampCount.element,
    rampHint: parts.rampHint,
    buildPage: (panel) => buildPage(parts, panel),
    render: () => render(parts),
    showSteps: (stepsMm) => {
      choice.steps = [...stepsMm];
      render(parts);
    },
    relabel: () => relabel(parts),
    read: (raw) => {
      raw.rampStepHeightsMm = [...choice.steps];
      raw.rampCount = Number(parts.rampCount.control.value);
    },
    populate: (settings) => {
      Object.assign(choice, choiceOf(settings.rampStepHeightsMm));
      parts.rampCount.control.value = String(settings.rampCount);
    },
  };
}

/** The compact form's step editor: the ramp `<select>` and the chips. */
function createStepsField({ editor, rampPicker }: RampsTabParts): HTMLElement {
  const stepsField = document.createElement('div');
  stepsField.className = 'settings__field settings__field--wide';
  stepsField.append(editor.caption, rampPicker.row, editor.chips, editor.addRow);
  return stepsField;
}

/** Apply a catalog model (or null for "custom") — shared by the `<select>`
 * and the Ramps page's catalogue. */
function applyRampChoice(parts: RampsTabParts, model: RampModel | null): void {
  parts.choice.customChosen = !model;
  parts.rampPicker.select.value = model ? model.name : '';
  if (model) parts.choice.steps = [...model.stepsMm];
  stepsEdited(parts);
}

function stepsEdited(parts: RampsTabParts): void {
  render(parts);
  parts.context.changed();
}

function render(parts: RampsTabParts): void {
  parts.editor.renderChips();
  parts.rampPicker.sync();
  parts.renderPage?.();
}

function buildPage(parts: RampsTabParts, panel: HTMLElement): void {
  parts.renderPage = buildRampsPage(panel, {
    choice: parts.choice,
    state: parts.context.state,
    editor: parts.editor,
    selectedModel: parts.rampPicker.selectedModel,
    rampCount: [parts.rampCount.element, parts.rampCountHint],
    onPick: (model) => applyRampChoice(parts, model),
  });
}

function relabel(parts: RampsTabParts): void {
  const { rampCount, rampCountHint, rampHint } = parts;
  parts.editor.relabel();
  parts.rampPicker.relabel();
  // Ramp planning applies to the motorhome; a caravan ramps one wheel.
  const isCaravan = parts.context.state.vehicle === 'caravan';
  rampCount.element.hidden = isCaravan;
  rampCountHint.hidden = isCaravan;
  rampHint.hidden = isCaravan;
  rampCount.caption.textContent = t('settings.rampCount');
  rampHint.textContent = t('settings.rampHint');
  rampCountHint.textContent = t('settings.rampCountHint');
}

/**
 * How many ramps the user actually owns. Sold in pairs, so 2 is the
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
