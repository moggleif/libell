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
import { createChoiceRow } from './choiceList';
import { createElement } from './dom';
import { createHitchSection, type HitchOptions } from './hitchSection';
import { createNamePrompt, type NamePrompt } from './namePrompt';

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
  body.append(list, adding.addButton, adding.prompt.element, adding.addStatus, adding.anywayButton);
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
  anywayButton: HTMLButtonElement;
}

/** Only the add button shows until it is tapped; then the name is asked
 * for (#613). */
function createAddControls(options: TargetsOptions, refresh: () => void): AddControls {
  const addButton = secondaryButton(t('targets.add'));
  const addStatus = createElement('p', 'menu__text menu__text--status');
  // Warn, never block: shown only while a too-steep warning is up.
  const anywayButton = secondaryButton(t('targets.anyway'));
  anywayButton.hidden = true;
  const prompt = createNamePrompt({
    label: t('targets.name.label'),
    placeholder: t('targets.name.placeholder'),
    onSave: () => addPreset(options, controls, false, refresh),
    onClose: () => {
      addButton.hidden = false;
      anywayButton.hidden = true;
      addStatus.textContent = '';
      addStatus.classList.remove('menu__text--warning');
    },
  });
  const controls: AddControls = { addButton, addStatus, anywayButton, prompt };
  addButton.addEventListener('click', () => {
    addButton.hidden = true;
    prompt.open(nextDefaultName(options));
  });
  anywayButton.addEventListener('click', () => addPreset(options, controls, true, refresh));
  return controls;
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
  { prompt, addStatus, anywayButton }: AddControls,
  anyway: boolean,
  refresh: () => void,
): void {
  const name = prompt.value() || nextDefaultName(options);
  const result = anyway ? options.addTargetPreset(name, true) : options.addTargetPreset(name);
  const warned = typeof result === 'object' && result !== null;
  anywayButton.hidden = !warned;
  addStatus.classList.toggle('menu__text--warning', warned);
  if (result !== null) {
    addStatus.textContent = warned ? result.warning : result;
    return;
  }
  prompt.close();
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
