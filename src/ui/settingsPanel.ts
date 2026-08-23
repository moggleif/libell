/**
 * Settings form: wheelbase, per-axle track widths, the available ramp
 * step heights and tolerance, persisted via the settings store. Saving
 * applies immediately to the calculation through the `onSave` callback.
 * Rendered inside the app menu.
 */
import {
  formatStepHeightsList,
  parseStepHeightsList,
  parseSettings,
  type LevelSettings,
} from '../domain/settings';
import { saveSettings } from '../data/settingsStore';

type NumberKey =
  'wheelbaseMm' | 'trackWidthFrontMm' | 'trackWidthRearMm' | 'toleranceMm' | 'stabilityMm';

const NUMBER_FIELDS: { key: NumberKey; label: string; step: string; min?: string }[] = [
  { key: 'wheelbaseMm', label: 'Wheelbase (mm)', step: '10' },
  { key: 'trackWidthFrontMm', label: 'Track width front (mm)', step: '10' },
  { key: 'trackWidthRearMm', label: 'Track width rear (mm)', step: '10' },
  { key: 'toleranceMm', label: 'Tolerance (mm)', step: '1' },
  { key: 'stabilityMm', label: 'Stability (mm)', step: '0.5', min: '0' },
];

export function createSettingsForm(
  initial: LevelSettings,
  onSave: (settings: LevelSettings) => void,
): HTMLFormElement {
  const form = document.createElement('form');
  form.className = 'settings__form';

  const inputs = new Map<NumberKey, HTMLInputElement>();
  for (const { key, label, step, min } of NUMBER_FIELDS) {
    const field = document.createElement('label');
    field.className = 'settings__field';
    const caption = document.createElement('span');
    caption.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.min = min ?? step;
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
  save.className = 'menu__action';
  save.textContent = 'Save';
  save.disabled = true;
  form.append(save);

  // parseSettings guards against empty/invalid fields the same way it
  // guards against corrupt storage.
  const currentSettings = (): LevelSettings => {
    const raw: Record<string, unknown> = {
      rampStepHeightsMm: parseStepHeightsList(heightsInput.value),
    };
    for (const [key, input] of inputs) raw[key] = input.valueAsNumber;
    return parseSettings(raw);
  };

  // Save is grayed out until the form actually differs from what is saved.
  let saved = initial;
  const updateDirty = () => {
    save.disabled = JSON.stringify(currentSettings()) === JSON.stringify(saved);
  };
  form.addEventListener('input', updateDirty);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = currentSettings();
    for (const [key, input] of inputs) input.value = String(settings[key]);
    heightsInput.value = formatStepHeightsList(settings.rampStepHeightsMm);
    saveSettings(settings);
    saved = settings;
    updateDirty();
    onSave(settings);
  });

  return form;
}
