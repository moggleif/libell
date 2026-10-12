import { createElement } from '../dom';
import { t, type MessageKey } from '../i18n';

// A labeled radio group for a single wizard choice — shared by the
// sensor-source and vehicle-type steps (#184).
export function buildChoiceGroup<T extends string>(
  name: string,
  choices: [T, MessageKey][],
  current: T,
  onChange: (value: T) => void,
): HTMLDivElement {
  const group = createElement('div', 'onboarding__source');
  for (const [value, labelKey] of choices) {
    const label = createElement('label', 'onboarding__source-option');
    label.append(buildChoiceRadio(name, value, current, onChange), choiceText(labelKey));
    group.append(label);
  }
  return group;
}

function buildChoiceRadio<T extends string>(
  name: string,
  value: T,
  current: T,
  onChange: (value: T) => void,
): HTMLInputElement {
  const radio = document.createElement('input');
  radio.type = 'radio';
  // Themed like every other control in the app, never the browser's own
  // accent color (#189 follow-up).
  radio.className = 'onboarding__source-radio';
  radio.name = name;
  radio.value = value;
  radio.checked = current === value;
  radio.addEventListener('change', () => {
    if (radio.checked) onChange(value);
  });
  return radio;
}

function choiceText(labelKey: MessageKey): HTMLSpanElement {
  const text = document.createElement('span');
  text.textContent = t(labelKey);
  return text;
}
