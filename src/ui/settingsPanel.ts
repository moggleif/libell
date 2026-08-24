/**
 * Settings form: vehicle geometry, the ramp step editor (a ready-made
 * ramp picker plus a visual +/− list — no separator syntax to learn),
 * display unit,
 * tolerance/stability and the level chime. Values are entered and shown
 * in the chosen unit; storage and math stay mm. Save is disabled until
 * the form differs from the saved settings.
 */
import {
  DEFAULT_SETTINGS,
  DRAIN_POSITIONS,
  formatLength,
  MAX_RAMP_COUNT,
  parseSettings,
  type AxleConfig,
  type LevelSettings,
  type ThemeSetting,
  type VehicleType,
} from '../domain/settings';
import { matchRampModel, rampLabel, RAMP_MODELS } from '../domain/ramps';
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

  // --- Vehicle type (#72): motorhome (four wheels) or caravan (single
  // axle + jockey wheel). The caravan hides the front track width and
  // relabels the wheelbase as the axle-to-jockey distance.
  let vehicle: VehicleType = initial.vehicleType;
  const vehicleField = document.createElement('label');
  vehicleField.className = 'settings__field';
  const vehicleCaption = document.createElement('span');
  const vehicleSelect = document.createElement('select');
  vehicleSelect.className = 'settings__select';
  const vehicleOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const value of ['motorhome', 'caravan'] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === vehicle;
    vehicleSelect.append(option);
    vehicleOptions.push([option, `vehicle.${value}` as MessageKey]);
  }
  vehicleField.append(vehicleCaption, vehicleSelect);

  // --- Axle configuration (#81): single or boggie (tandem) pair. An
  // independent dimension, not more vehicle types — the boggie is one
  // leveling axle at its midpoint (ADR 0009).
  let axle: AxleConfig = initial.rearAxle;
  const axleField = document.createElement('label');
  axleField.className = 'settings__field';
  const axleCaption = document.createElement('span');
  const axleSelect = document.createElement('select');
  axleSelect.className = 'settings__select';
  const axleOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const value of ['single', 'boggie'] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === axle;
    axleSelect.append(option);
    axleOptions.push([option, `axle.${value}` as MessageKey]);
  }
  axleSelect.addEventListener('change', () => {
    axle = axleSelect.value === 'boggie' ? 'boggie' : 'single';
    applyUnitEverywhere();
    notifyChanged();
  });
  axleField.append(axleCaption, axleSelect);

  // --- Numeric fields (shown in the chosen unit) ---
  const inputs = new Map<NumberKey, HTMLInputElement>();
  const captions = new Map<NumberKey, HTMLSpanElement>();
  const fieldEls = new Map<NumberKey, HTMLLabelElement>();
  for (const { key, label, stepMm, min } of NUMBER_FIELDS) {
    const field = document.createElement('label');
    field.className = 'settings__field';
    const caption = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.name = key;
    field.append(caption, input);
    inputs.set(key, input);
    captions.set(key, caption);
    fieldEls.set(key, field);
    const applyUnit = () => {
      // Per-configuration labels: the caravan's wheelbase is the
      // axle-to-jockey distance, and its single axle has no "rear".
      let labelKey: MessageKey = label;
      if (key === 'wheelbaseMm' && vehicle === 'caravan') labelKey = 'settings.axleToJockey';
      if (key === 'trackWidthRearMm' && vehicle === 'caravan') labelKey = 'settings.track';
      caption.textContent = `${t(labelKey)} (${unit})`;
      input.step = String(toUnit(stepMm));
      input.min = String(min ?? toUnit(stepMm));
    };
    applyUnit();
    input.value = String(toUnit(initial[key]));
    unitAppliers.push(applyUnit);
  }

  vehicleSelect.addEventListener('change', () => {
    vehicle = vehicleSelect.value === 'caravan' ? 'caravan' : 'motorhome';
    applyUnitEverywhere();
    notifyChanged();
  });

  // Where to find the numbers — the biggest data-entry hurdle for new
  // users is not typing, it's knowing (#69).
  const measureHint = document.createElement('p');
  measureHint.className = 'settings__hint';
  measureHint.textContent = t('settings.measureHint');

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

  // Ready-made ramp picker: choosing a catalog model fills the step
  // list; editing the chips afterwards flips the picker back to
  // "custom". Labels carry the mm figures, so they are not unit-aware.
  const rampRow = document.createElement('div');
  rampRow.className = 'steps__ramp';
  const rampCaption = document.createElement('span');
  rampCaption.className = 'menu__text';
  const rampSelect = document.createElement('select');
  rampSelect.className = 'settings__select';
  const customOption = document.createElement('option');
  customOption.value = '';
  rampSelect.append(customOption);
  for (const model of RAMP_MODELS) {
    const option = document.createElement('option');
    option.value = model.name;
    option.textContent = rampLabel(model);
    rampSelect.append(option);
  }
  // An explicitly chosen "Custom set" must hold even while the steps
  // still match a catalog model — without this the sync below snapped
  // the choice straight back and "nothing happened" (#91). Auto-matching
  // resumes once a model is picked again.
  let customChosen = matchRampModel(initial.rampStepHeightsMm) === null;
  const syncRampSelect = () => {
    rampSelect.value = customChosen ? '' : (matchRampModel(steps, rampSelect.value)?.name ?? '');
  };
  rampSelect.addEventListener('change', () => {
    const model = RAMP_MODELS.find((m) => m.name === rampSelect.value);
    customChosen = !model;
    if (model) {
      steps = [...model.stepsMm];
      renderChips();
    }
    syncRampSelect();
    notifyChanged();
  });
  rampRow.append(rampCaption, rampSelect);

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
    syncRampSelect();
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

  stepsField.append(stepsCaption, rampRow, chipList, addRow);

  // --- Ramp count (#93): how many ramps the user actually owns. Sold in
  // pairs, so 2 is the default; a few carry 3 or 4. The plan never asks
  // for more wheels than this. A caravan ramps one wheel — field hidden.
  const rampCountField = document.createElement('label');
  rampCountField.className = 'settings__field';
  const rampCountCaption = document.createElement('span');
  const rampCountSelect = document.createElement('select');
  rampCountSelect.className = 'settings__select';
  for (let n = 1; n <= MAX_RAMP_COUNT; n += 1) {
    const option = document.createElement('option');
    option.value = String(n);
    option.textContent = String(n);
    option.selected = n === initial.rampCount;
    rampCountSelect.append(option);
  }
  rampCountSelect.addEventListener('change', () => notifyChanged());
  rampCountField.append(rampCountCaption, rampCountSelect);

  // --- Drain position (#93): where the waste-water outlet sits. Within
  // the tolerance the plan leaves this side lowest so the drains keep
  // working — sink and shower water must run toward the outlet.
  const drainField = document.createElement('label');
  drainField.className = 'settings__field';
  const drainCaption = document.createElement('span');
  const drainSelect = document.createElement('select');
  drainSelect.className = 'settings__select';
  const drainOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const value of DRAIN_POSITIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === initial.drainPosition;
    drainSelect.append(option);
    drainOptions.push([option, `drain.${value}` as MessageKey]);
  }
  drainSelect.addEventListener('change', () => notifyChanged());
  drainField.append(drainCaption, drainSelect);

  const rampHint = document.createElement('p');
  rampHint.className = 'settings__hint';

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

  // --- Level chime ---
  const soundField = document.createElement('label');
  soundField.className = 'settings__field';
  const soundCaption = document.createElement('span');
  const soundInput = document.createElement('input');
  soundInput.type = 'checkbox';
  soundInput.className = 'settings__checkbox';
  soundInput.checked = initial.soundOnLevel;
  soundField.append(soundCaption, soundInput);

  // Save persists; Undo returns to the last saved values; Reset fills
  // the form with the factory defaults (still needs Save to persist,
  // and Undo can take it back).
  const actions = document.createElement('div');
  actions.className = 'settings__actions';
  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'menu__action';
  save.disabled = true;
  const undo = document.createElement('button');
  undo.type = 'button';
  undo.className = 'menu__action menu__action--secondary';
  undo.disabled = true;
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'menu__action menu__action--secondary';
  actions.append(save, undo, reset);

  // Three labeled sections keep the long form readable: vehicle &
  // measurements, ramps, level & display.
  const sectionHeading = (): HTMLParagraphElement => {
    const heading = document.createElement('p');
    heading.className = 'settings__section';
    return heading;
  };
  const vehicleHeading = sectionHeading();
  const rampsHeading = sectionHeading();
  const displayHeading = sectionHeading();
  form.append(
    vehicleHeading,
    vehicleField,
    axleField,
    fieldEls.get('wheelbaseMm')!,
    fieldEls.get('trackWidthFrontMm')!,
    fieldEls.get('trackWidthRearMm')!,
    measureHint,
    rampsHeading,
    stepsField,
    rampCountField,
    drainField,
    rampHint,
    displayHeading,
    fieldEls.get('toleranceMm')!,
    fieldEls.get('stabilityMm')!,
    unitField,
    themeField,
    soundField,
    actions,
  );

  function applyUnitEverywhere(): void {
    for (const apply of unitAppliers) apply();
    vehicleCaption.textContent = t('settings.vehicle');
    for (const [option, label] of vehicleOptions) option.textContent = t(label);
    axleCaption.textContent = t(vehicle === 'caravan' ? 'settings.axle' : 'settings.rearAxle');
    for (const [option, label] of axleOptions) option.textContent = t(label);
    // A caravan has one axle — the front track width does not apply.
    fieldEls.get('trackWidthFrontMm')!.hidden = vehicle === 'caravan';
    measureHint.textContent =
      t('settings.measureHint') + (axle === 'boggie' ? ` ${t('settings.measureHint.boggie')}` : '');
    stepsCaption.textContent = `${t('settings.steps')} (${unit})`;
    addInput.placeholder = unit === 'cm' ? '4' : '40';
    addButton.textContent = `+ ${t('settings.steps.add')}`;
    rampCaption.textContent = t('settings.ramp');
    customOption.textContent = t('settings.ramp.custom');
    // Ramp planning applies to the motorhome; a caravan ramps one wheel.
    rampCountField.hidden = vehicle === 'caravan';
    drainField.hidden = vehicle === 'caravan';
    rampHint.hidden = vehicle === 'caravan';
    rampCountCaption.textContent = t('settings.rampCount');
    drainCaption.textContent = t('settings.drain');
    for (const [option, label] of drainOptions) option.textContent = t(label);
    rampHint.textContent = t('settings.rampHint');
    unitCaption.textContent = t('settings.unit');
    themeCaption.textContent = t('settings.theme');
    for (const [option, label] of themeOptions) option.textContent = t(label);
    soundCaption.textContent = t('settings.sound');
    vehicleHeading.textContent = t('settings.section.vehicle');
    rampsHeading.textContent = t('settings.section.ramps');
    displayHeading.textContent = t('settings.section.display');
    save.textContent = t('settings.save');
    undo.textContent = t('settings.undo');
    reset.textContent = t('settings.reset');
  }
  applyUnitEverywhere();
  renderChips();

  // parseSettings guards against empty/invalid fields the same way it
  // guards against corrupt storage.
  const currentSettings = (): LevelSettings => {
    const raw: Record<string, unknown> = {
      vehicleType: vehicle,
      rearAxle: axle,
      rampStepHeightsMm: [...steps],
      rampCount: Number(rampCountSelect.value),
      drainPosition: drainSelect.value,
      displayUnit: unit,
      soundOnLevel: soundInput.checked,
      theme: themeSelect.value,
    };
    for (const [key, input] of inputs) raw[key] = fromUnit(input.valueAsNumber);
    return parseSettings(raw);
  };

  // Save and Undo are grayed out until the form differs from what is saved.
  let saved = initial;
  const notifyChanged = () => {
    const clean = JSON.stringify(currentSettings()) === JSON.stringify(saved);
    save.disabled = clean;
    undo.disabled = clean;
  };
  form.addEventListener('input', notifyChanged);

  /** Fill every field from the given settings, with live theme preview. */
  const populate = (settings: LevelSettings): void => {
    unit = settings.displayUnit;
    unitSelect.value = unit;
    vehicle = settings.vehicleType;
    vehicleSelect.value = vehicle;
    axle = settings.rearAxle;
    axleSelect.value = axle;
    applyUnitEverywhere();
    for (const [key, input] of inputs) input.value = String(toUnit(settings[key]));
    steps = [...settings.rampStepHeightsMm];
    customChosen = matchRampModel(steps) === null;
    renderChips();
    rampCountSelect.value = String(settings.rampCount);
    drainSelect.value = settings.drainPosition;
    themeSelect.value = settings.theme;
    applyTheme(settings.theme);
    soundInput.checked = settings.soundOnLevel;
    notifyChanged();
  };

  undo.addEventListener('click', () => populate(saved));
  reset.addEventListener('click', () => populate(DEFAULT_SETTINGS));

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
