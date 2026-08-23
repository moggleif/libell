/**
 * Settings panel (issue #9): wheelbase, track width, block height and
 * tolerance, persisted via the settings store. Saving applies immediately
 * to the calculation through the `onChange` callback.
 */
import { parseSettings, type LevelSettings } from '../domain/settings';
import { saveSettings } from '../data/settingsStore';

export interface SettingsPanel {
  element: HTMLElement;
}

interface FieldSpec {
  key: keyof LevelSettings;
  label: string;
  step: string;
}

const FIELDS: FieldSpec[] = [
  { key: 'wheelbaseCm', label: 'Wheelbase (cm)', step: '1' },
  { key: 'trackWidthFrontCm', label: 'Track width front (cm)', step: '1' },
  { key: 'trackWidthRearCm', label: 'Track width rear (cm)', step: '1' },
  { key: 'blockHeightCm', label: 'Block height (cm)', step: '0.5' },
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

  const inputs = new Map<keyof LevelSettings, HTMLInputElement>();
  for (const { key, label, step } of FIELDS) {
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

  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'settings__save';
  save.textContent = 'Save';
  form.append(save);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw: Record<string, number> = {};
    for (const [key, input] of inputs) raw[key] = input.valueAsNumber;
    // parseSettings guards against empty/invalid fields the same way it
    // guards against corrupt storage.
    const settings = parseSettings(raw);
    for (const [key, input] of inputs) input.value = String(settings[key]);
    saveSettings(settings);
    onChange(settings);
    details.open = false;
  });

  details.append(summary, form);
  return { element: details };
}
