/**
 * Target presets UI (ADR 0013): "Normal" (true level, always first, never
 * deletable) followed by the user's saved presets. Adding a preset
 * captures the current tilt, the same capture-first pattern
 * `calibrationSection.ts` uses for the vehicle zero.
 *
 * Deliberately NOT part of `calibrationSection.ts`: a preset is a
 * *target*, not a calibration (see `../domain/targetPresets.ts`).
 */
import type { TargetPreset, TargetSaveResult } from '../domain/targetPresets';
import { t } from './i18n';
import { createChoiceRow } from './choiceList';
import { createElement } from './dom';
import { createHitchSection, type HitchOptions } from './hitchSection';
import { createNamePrompt, type NamePrompt } from './namePrompt';

export interface TargetsOptions {
  getTargetPresets(): TargetPreset[];
  getActiveTargetId(): string | null;
  /** Switch the active target; `null` selects "Normal" (true level). */
  selectTarget(id: string | null): void;
  /** Capture the current tilt as a new preset named `name`: null when
   * saved, an error text when not, or a warning when it was saved but
   * looks steeper than 15° (#621). */
  addTargetPreset(name: string): TargetSaveResult;
  deleteTargetPreset(id: string): void;
  /** Rename a preset (#613); its row cannot be renamed when omitted. */
  renameTargetPreset?(id: string, name: string): void;
  /** A caravan's hitch height (#598), under the targets; none when omitted. */
  hitch?: HitchOptions;
}

export interface TargetsSection {
  element: HTMLElement;
  refresh(): void;
}

export function createTargetsSection(options: TargetsOptions): TargetsSection {
  const list = createElement('div', 'choice__list');
  const hitch = options.hitch ? createHitchSection(options.hitch) : null;
  const refresh = (): void => {
    refreshList(options, list, refresh);
    hitch?.refresh();
  };
  const adding = createAddControls(options, refresh);

  refresh();
  const body = document.createElement('div');
  body.append(list, adding.addButton, adding.prompt.element, adding.addStatus);
  if (hitch) body.append(hitch.element);
  return { element: body, refresh };
}

/** "Normal" first, then the saved presets; every choice redraws the list.
 * Tapping the chosen preset again renames it (#613). */
function refreshList(options: TargetsOptions, list: HTMLElement, refresh: () => void): void {
  const activeId = options.getActiveTargetId();
  const after = (action: () => void) => () => {
    action();
    refresh();
  };
  const rename = options.renameTargetPreset;
  list.replaceChildren(
    createChoiceRow({
      label: t('targets.normal'),
      active: activeId === null,
      onSelect: after(() => options.selectTarget(null)),
    }),
    ...options.getTargetPresets().map((preset) =>
      createChoiceRow({
        label: preset.name,
        active: activeId === preset.id,
        onSelect: after(() => options.selectTarget(preset.id)),
        onRename:
          rename &&
          ((name) => {
            rename(preset.id, name);
            refresh();
          }),
        onDelete: after(() => options.deleteTargetPreset(preset.id)),
        deleteLabel: t('targets.delete', { name: preset.name }),
      }),
    ),
  );
}

interface AddControls {
  addButton: HTMLButtonElement;
  prompt: NamePrompt;
  addStatus: HTMLElement;
}

/** Only the add button shows until it is tapped; then the name is asked
 * for (#613). */
function createAddControls(options: TargetsOptions, refresh: () => void): AddControls {
  const addButton = secondaryButton(t('targets.add'));
  const addStatus = createElement('p', 'menu__text menu__text--status');
  const prompt = createNamePrompt({
    label: t('targets.name.label'),
    placeholder: t('targets.name.placeholder'),
    onSave: () => addPreset(options, controls, refresh),
    onClose: () => {
      addButton.hidden = false;
      showStatus(addStatus, '', false);
    },
  });
  const controls: AddControls = { addButton, addStatus, prompt };
  addButton.addEventListener('click', () => {
    addButton.hidden = true;
    showStatus(addStatus, '', false);
    prompt.open(nextDefaultName(options));
  });
  return controls;
}

function secondaryButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action menu__action--secondary';
  button.textContent = text;
  return button;
}

/** One Save (#621): an error keeps the field open; a warning means the
 * target was saved and is shown under the closed field, never a gate. */
function addPreset(
  options: TargetsOptions,
  { prompt, addStatus }: AddControls,
  refresh: () => void,
): void {
  const name = prompt.value() || nextDefaultName(options);
  const result = options.addTargetPreset(name);
  if (typeof result === 'string') {
    showStatus(addStatus, result, false);
    return;
  }
  prompt.close();
  refresh();
  showStatus(addStatus, result?.warning ?? '', result !== null);
}

function showStatus(status: HTMLElement, text: string, warning: boolean): void {
  status.textContent = text;
  status.classList.toggle('menu__text--warning', warning);
}

/** Nothing is disabled: a target saved without a name gets the lowest
 * "Target N" not already taken. */
function nextDefaultName(options: TargetsOptions): string {
  const taken = new Set(options.getTargetPresets().map((p) => p.name));
  let n = 1;
  while (taken.has(t('targets.defaultName', { n }))) n++;
  return t('targets.defaultName', { n });
}
