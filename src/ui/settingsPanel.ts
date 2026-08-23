/**
 * Settings form: vehicle geometry, the ramp step editor (a visual +/−
 * list with presets — no separator syntax to learn), display unit,
 * tolerance/stability and the level chime. Values are entered and shown
 * in the chosen unit; storage and math stay mm. Save is disabled until
 * the form differs from the saved settings.
 */
import {
  formatLength,
  parseSettings,
  type LevelSettings,
  type ThemeSetting,
} from '../domain/settings';
import { saveSettings } from '../data/settingsStore';
import { applyTheme } from './theme';
import { t, type MessageKey } from './i18n';

type NumberKey =
  'wheelbaseMm' | 'trackWidthFrontMm' | 'trackWidthRearMm' | 'toleranceMm' | 'stabilityMm';

const NUMBER_FIELDS: { key: NumberKey; label: MessageKey; stepMm: number; min?: number }[] = [
  { key: 'wheelbaseMm', label: 'settings.wheelbase', stepMm: 10 },
  { key: 'trackWidthFrontMm', label: 'settings.trackFront', stepMm: 10 },
  { key: 'trackWidthRearMm', label: 'settings.trackRear', stepMm: 10 },
  { key: 'toleranceMm', label: 'settings.tolerance', stepMm: 1 },
  { key: 'stabilityMm', label: 'settings.stability', stepMm: 0.5, min: 0 },
];

/** Common leveling wedges, as step-height lists in mm. */
const PRESETS: number[][] = [
  [40, 80],
  [30, 60, 90],
];

export function createSettingsForm(
  initial: LevelSettings,
  onSave: (settings: LevelSettings) => void,
): HTMLFormElement {
  const form = document.createElement('form');
  form.className = 'settings__form';

  let unit: 'mm' | 'cm' = initial.displayUnit;
  const toUnit = (mm: number) => (unit === 'cm' ? mm / 10 : mm);
  const fromUnit = (v: number) => (unit === 'cm' ? v * 10 : v);

  /** Re-appliers run whenever the unit (and thus every label) changes. */
  const unitAppliers: (() => void)[] = [];

  // --- Numeric fields (shown in the chosen unit) ---
  const inputs = new Map<NumberKey, HTMLInputElement>();
  const captions = new Map<NumberKey, HTMLSpanElement>();
  for (const { key, label, stepMm, min } of NUMBER_FIELDS) {
    const field = document.createElement('label');
    field.className = 'settings__field';
    const caption = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.name = key;
    field.append(caption, input);
    form.append(field);
    inputs.set(key, input);
    captions.set(key, caption);
    const applyUnit = () => {
      caption.textContent = `${t(label)} (${unit})`;
      input.step = String(toUnit(stepMm));
      input.min = String(min ?? toUnit(stepMm));
    };
    applyUnit();
    input.value = String(toUnit(initial[key]));
    unitAppliers.push(applyUnit);
  }

  // --- Ramp steps: visual chip list + add + presets ---
  let steps = [...initial.rampStepHeightsMm];

  const stepsField = document.createElement('div');
  stepsField.className = 'settings__field settings__field--wide';
  const stepsCaption = document.createElement('span');
  const chipList = document.createElement('div');
  chipList.className = 'steps__chips';

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

  const presetRow = document.createElement('div');
  presetRow.className = 'steps__presets';
  const presetCaption = document.createElement('span');
  presetCaption.className = 'menu__text';
  presetRow.append(presetCaption);
  const presetButtons: [HTMLButtonElement, number[]][] = [];
  for (const preset of PRESETS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'steps__preset';
    button.addEventListener('click', () => {
      steps = [...preset];
      renderChips();
      notifyChanged();
    });
    presetRow.append(button);
    presetButtons.push([button, preset]);
  }

  function renderChips(): void {
    chipList.replaceChildren();
    for (const mm of [...steps].sort((a, b) => a - b)) {
      const chip = document.createElement('span');
      chip.className = 'steps__chip';
      const label = document.createElement('span');
      label.textContent = formatLength(mm, unit);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'steps__chip-remove';
      remove.textContent = '−';
      remove.setAttribute(
        'aria-label',
        t('settings.steps.remove', { value: formatLength(mm, unit) }),
      );
      remove.addEventListener('click', () => {
        steps = steps.filter((s) => s !== mm);
        renderChips();
        notifyChanged();
      });
      chip.append(label, remove);
      chipList.append(chip);
    }
  }

  addInput.addEventListener('input', () => {
    const v = addInput.valueAsNumber;
    addButton.disabled = !Number.isFinite(v) || v <= 0;
  });
  addButton.addEventListener('click', () => {
    const v = addInput.valueAsNumber;
    if (!Number.isFinite(v) || v <= 0) return;
    const mm = fromUnit(v);
    if (!steps.includes(mm)) steps = [...steps, mm].sort((a, b) => a - b);
    addInput.value = '';
    addButton.disabled = true;
    renderChips();
    notifyChanged();
  });

  stepsField.append(stepsCaption, chipList, addRow, presetRow);
  form.append(stepsField);

  // --- Unit choice ---
  const unitField = document.createElement('label');
  unitField.className = 'settings__field';
  const unitCaption = document.createElement('span');
  const unitSelect = document.createElement('select');
  unitSelect.className = 'settings__select';
  for (const u of ['mm', 'cm'] as const) {
    const option = document.createElement('option');
    option.value = u;
    option.textContent = u;
    option.selected = u === unit;
    unitSelect.append(option);
  }
  unitSelect.addEventListener('change', () => {
    // Re-render every value in the newly chosen unit, converting the
    // numeric inputs in place so nothing is lost.
    const mmValues = new Map<NumberKey, number>();
    for (const [key, input] of inputs) mmValues.set(key, fromUnit(input.valueAsNumber));
    unit = unitSelect.value === 'cm' ? 'cm' : 'mm';
    applyUnitEverywhere();
    for (const [key, input] of inputs) {
      const mm = mmValues.get(key);
      if (mm !== undefined && Number.isFinite(mm)) input.value = String(toUnit(mm));
    }
    renderChips();
    notifyChanged();
  });
  unitField.append(unitCaption, unitSelect);
  form.append(unitField);

  // --- Theme ---
  const themeField = document.createElement('label');
  themeField.className = 'settings__field';
  const themeCaption = document.createElement('span');
  const themeSelect = document.createElement('select');
  themeSelect.className = 'settings__select';
  const THEMES: { value: ThemeSetting; label: MessageKey }[] = [
    { value: 'system', label: 'theme.system' },
    { value: 'light', label: 'theme.light' },
    { value: 'dark', label: 'theme.dark' },
  ];
  const themeOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const { value, label } of THEMES) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === initial.theme;
    themeSelect.append(option);
    themeOptions.push([option, label]);
  }
  // Live preview — the choice still only persists on Save.
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value as ThemeSetting);
    notifyChanged();
  });
  themeField.append(themeCaption, themeSelect);
  form.append(themeField);

  // --- Level chime ---
  const soundField = document.createElement('label');
  soundField.className = 'settings__field';
  const soundCaption = document.createElement('span');
  const soundInput = document.createElement('input');
  soundInput.type = 'checkbox';
  soundInput.className = 'settings__checkbox';
  soundInput.checked = initial.soundOnLevel;
  soundField.append(soundCaption, soundInput);
  form.append(soundField);

  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'menu__action';
  save.disabled = true;
  form.append(save);

  function applyUnitEverywhere(): void {
    for (const apply of unitAppliers) apply();
    stepsCaption.textContent = `${t('settings.steps')} (${unit})`;
    addInput.placeholder = unit === 'cm' ? '4' : '40';
    addButton.textContent = `+ ${t('settings.steps.add')}`;
    presetCaption.textContent = t('settings.steps.presets');
    for (const [button, preset] of presetButtons) {
      button.textContent = preset.map((mm) => formatLength(mm, unit)).join(' / ');
    }
    unitCaption.textContent = t('settings.unit');
    themeCaption.textContent = t('settings.theme');
    for (const [option, label] of themeOptions) option.textContent = t(label);
    soundCaption.textContent = t('settings.sound');
    save.textContent = t('settings.save');
  }
  applyUnitEverywhere();
  renderChips();

  // parseSettings guards against empty/invalid fields the same way it
  // guards against corrupt storage.
  const currentSettings = (): LevelSettings => {
    const raw: Record<string, unknown> = {
      rampStepHeightsMm: [...steps],
      displayUnit: unit,
      soundOnLevel: soundInput.checked,
      theme: themeSelect.value,
    };
    for (const [key, input] of inputs) raw[key] = fromUnit(input.valueAsNumber);
    return parseSettings(raw);
  };

  // Save is grayed out until the form actually differs from what is saved.
  let saved = initial;
  const notifyChanged = () => {
    save.disabled = JSON.stringify(currentSettings()) === JSON.stringify(saved);
  };
  form.addEventListener('input', notifyChanged);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = currentSettings();
    for (const [key, input] of inputs) input.value = String(toUnit(settings[key]));
    steps = [...settings.rampStepHeightsMm];
    renderChips();
    saveSettings(settings);
    saved = settings;
    notifyChanged();
    onSave(settings);
  });

  return form;
}
