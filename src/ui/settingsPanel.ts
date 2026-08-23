/**
 * Settings panel (issue #9): wheelbase, per-axle track widths, the
 * available ramp step heights and tolerance, persisted via the settings
 * store. Saving applies immediately to the calculation through the
 * `onChange` callback.
 */
import {
  formatStepHeightsList,
  parseStepHeightsList,
  parseSettings,
  type LevelSettings,
} from '../domain/settings';
import { saveSettings } from '../data/settingsStore';

export interface SettingsPanel {
  element: HTMLElement;
}

type NumberKey = 'wheelbaseCm' | 'trackWidthFrontCm' | 'trackWidthRearCm' | 'toleranceDeg';

const NUMBER_FIELDS: { key: NumberKey; label: string; step: string }[] = [
  { key: 'wheelbaseCm', label: 'Wheelbase (cm)', step: '1' },
  { key: 'trackWidthFrontCm', label: 'Track width front (cm)', step: '1' },
  { key: 'trackWidthRearCm', label: 'Track width rear (cm)', step: '1' },
  { key: 'toleranceDeg', label: 'Tolerance (°)', step: '0.1' },
];

export function createSettingsPanel(
  initial: LevelSettings,
  onChange: (settings: LevelSettings) => void,
): SettingsPanel {
  const details = document.createElement('details');
  details.className = 'settings';

  const summary = document.createElement('summary');
  summary.className = 'settings__summary';
  summary.textContent = 'Settings';

  const form = document.createElement('form');
  form.className = 'settings__form';

  const inputs = new Map<NumberKey, HTMLInputElement>();
  for (const { key, label, step } of NUMBER_FIELDS) {
    const field = document.createElement('label');
    field.className = 'settings__field';
    const caption = document.createElement('span');
    caption.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.min = step;
    input.step = step;
    input.name = key;
    input.value = String(initial[key]);
    field.append(caption, input);
    form.append(field);
    inputs.set(key, input);
  }

  // The ramp is a staircase: list every step height you have, in mm,
  // separated by semicolons.
  const heightsField = document.createElement('label');
  heightsField.className = 'settings__field settings__field--wide';
  const heightsCaption = document.createElement('span');
  heightsCaption.textContent = 'Ramp step heights (mm, separated by ;)';
  const heightsInput = document.createElement('input');
  heightsInput.type = 'text';
  heightsInput.inputMode = 'decimal';
  heightsInput.name = 'rampStepHeightsMm';
  heightsInput.placeholder = 'e.g. 20; 40; 60';
  heightsInput.value = formatStepHeightsList(initial.rampStepHeightsMm);
  heightsField.append(heightsCaption, heightsInput);
  form.append(heightsField);

  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'settings__save';
  save.textContent = 'Save';
  form.append(save);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw: Record<string, unknown> = {
      rampStepHeightsMm: parseStepHeightsList(heightsInput.value),
    };
    for (const [key, input] of inputs) raw[key] = input.valueAsNumber;
    // parseSettings guards against empty/invalid fields the same way it
    // guards against corrupt storage.
    const settings = parseSettings(raw);
    for (const [key, input] of inputs) input.value = String(settings[key]);
    heightsInput.value = formatStepHeightsList(settings.rampStepHeightsMm);
    saveSettings(settings);
    onChange(settings);
    details.open = false;
  });

  details.append(summary, form);
  return { element: details };
}
