/**
 * Settings form: vehicle geometry, the ramp step editor (a ready-made
 * ramp picker plus a visual +/− list — no separator syntax to learn),
 * display unit,
 * tolerance/stability, the level chime and continuous audio guidance
 * (#121). Values are entered and shown in the chosen unit; storage and
 * math stay mm. Save is disabled until the form differs from the saved
 * settings.
 *
 * Modern appearance (#108): when `initial.appearance === 'modern'`, the
 * form renders as three tabs (Fordon/Klossar/Kalibrering) instead of one
 * long page, with a redesigned ramp picker (brand filter, pinned current
 * model, scrolling catalog, fixed step-height footer). Which structure to
 * build is decided once, from `initial.appearance`, at construction time
 * — same pattern as `rearAxle` deciding wheel-pair markers in
 * `rvDiagram.ts`. There is no live restructuring if the user changes the
 * Appearance dropdown while the form is open; colors still live-preview
 * via CSS, but the tab structure only reflects the new preset the next
 * time the form is freshly built (ADR-less deliberate scope cut, #108).
 */
import {
  DEFAULT_SETTINGS,
  DRAIN_POSITIONS,
  formatLength,
  MAX_RAMP_COUNT,
  parseSettings,
  type AppearanceSetting,
  type AxleConfig,
  type LevelSettings,
  type ThemeSetting,
  type VehicleType,
} from '../domain/settings';
import { matchRampModel, rampLabel, RAMP_MODELS, type RampModel } from '../domain/ramps';
import { saveSettings } from '../data/settingsStore';
import { applyAppearance, applyTheme } from './theme';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
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

/**
 * Calibration is normally supplied by the host (the menu, which already
 * implements `CalibrationOptions`) so the embedded Kalibrering tab talks
 * to the real sensor. When no host is wired — a standalone harness, or a
 * unit test building a Modern-mode form directly — the tab still renders
 * with an inert stand-in rather than throwing.
 */
function inertCalibrationOptions(): CalibrationOptions {
  return {
    // Only ever used from the Modern Kalibrering tab (below) — the
    // embedded calibration section it feeds is Modern-only structure.
    appearance: 'modern',
    getCalibration: () => null,
    calibrate: () => t('calibration.err.notRunning'),
    readTilt: () => t('calibration.err.notRunning'),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => t('calibration.err.notRunning'),
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => t('calibration.status.none'),
    checkVehicleCalibration: () => t('calibration.vehicle.status.none'),
    clearVehicleCalibration: () => {},
  };
}

/**
 * The Modern tab bar exposes `selectCalibrationTab` (undefined in Classic,
 * which has no tabs) so the menu's Calibration entry can jump straight to
 * the Kalibrering tab of this same live instance instead of mounting a
 * second, independent `createCalibrationSection` (#155).
 */
export type SettingsFormElement = HTMLFormElement & { selectCalibrationTab?: () => void };

export function createSettingsForm(
  initial: LevelSettings,
  onSave: (settings: LevelSettings) => void,
  calibrationOptions?: CalibrationOptions,
): SettingsFormElement {
  const form: SettingsFormElement = document.createElement('form');
  form.className = 'settings__form';

  // Decided once, at construction — see the file header comment.
  const appearance: AppearanceSetting = initial.appearance;

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
  // In Modern mode this <select> is not shown — the Klossar tab picks
  // models from a scrolling catalog list instead — but it is kept alive
  // (its `.value` and `customChosen` still tracked) as the single source
  // of truth for "which model matches the current steps", including the
  // #91 tie-break behavior, shared by both UIs.
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
  /** Apply a catalog model (or null for "custom") — shared by the
   * classic <select> and the Modern catalog list/custom row. */
  function applyRampChoice(model: RampModel | null): void {
    customChosen = !model;
    rampSelect.value = model ? model.name : '';
    if (model) steps = [...model.stepsMm];
    renderChips();
    notifyChanged();
  }
  rampSelect.addEventListener('change', () => {
    applyRampChoice(RAMP_MODELS.find((m) => m.name === rampSelect.value) ?? null);
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
    renderKlossarUi();
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

  // --- Appearance (#104): a preset independent of light/dark — today's
  // look ('classic') or the redesigned surfaces/screens ('modern').
  const appearanceField = document.createElement('label');
  appearanceField.className = 'settings__field';
  const appearanceCaption = document.createElement('span');
  const appearanceSelect = document.createElement('select');
  appearanceSelect.className = 'settings__select';
  const APPEARANCES: { value: AppearanceSetting; label: MessageKey }[] = [
    { value: 'classic', label: 'appearance.classic' },
    { value: 'modern', label: 'appearance.modern' },
  ];
  const appearanceOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const { value, label } of APPEARANCES) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === initial.appearance;
    appearanceSelect.append(option);
    appearanceOptions.push([option, label]);
  }
  // Live preview — same pattern as the theme select above. Note this
  // only ever affects colors (see the file header comment) — switching
  // this select does not restructure the currently open form.
  appearanceSelect.addEventListener('change', () => {
    applyAppearance(appearanceSelect.value as AppearanceSetting);
    notifyChanged();
  });
  appearanceField.append(appearanceCaption, appearanceSelect);

  // --- Level chime ---
  const soundField = document.createElement('label');
  soundField.className = 'settings__field';
  const soundCaption = document.createElement('span');
  const soundInput = document.createElement('input');
  soundInput.type = 'checkbox';
  soundInput.className = 'settings__checkbox';
  soundInput.checked = initial.soundOnLevel;
  soundField.append(soundCaption, soundInput);

  // --- Continuous audio guidance (#121): a separate opt-in from the
  // completion chime above — pulse rate/pitch while approaching level.
  const soundGuidanceField = document.createElement('label');
  soundGuidanceField.className = 'settings__field';
  const soundGuidanceCaption = document.createElement('span');
  const soundGuidanceInput = document.createElement('input');
  soundGuidanceInput.type = 'checkbox';
  soundGuidanceInput.className = 'settings__checkbox';
  soundGuidanceInput.checked = initial.soundGuidance;
  soundGuidanceField.append(soundGuidanceCaption, soundGuidanceInput);
  const soundGuidanceHint = document.createElement('p');
  soundGuidanceHint.className = 'settings__hint';

  // Save persists; Undo returns to the last saved values; Reset fills
  // the form with the factory defaults (still needs Save to persist,
  // and Undo can take it back). Modern mode's Klossar tab additionally
  // gets its own Save/Undo pair in its fixed footer (spec'd — the ramp
  // steps need to be saveable without switching tabs); every tab keeps
  // this original pair too, so Save/Undo are always reachable from
  // wherever the user is editing (#140). Kept in sync via saveButtons/
  // undoButtons rather than sharing DOM nodes, since a node can only
  // live in one place in the tree.
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
  const saveButtons: HTMLButtonElement[] = [save];
  const undoButtons: HTMLButtonElement[] = [undo];

  // Three labeled sections keep the long (Classic) form readable:
  // vehicle & measurements, ramps, level & display.
  const sectionHeading = (): HTMLParagraphElement => {
    const heading = document.createElement('p');
    heading.className = 'settings__section';
    return heading;
  };
  const vehicleHeading = sectionHeading();
  const rampsHeading = sectionHeading();
  const displayHeading = sectionHeading();

  // --- Advanced disclosure (#157): tolerance/stability/appearance/audio
  // preferences, tuned rarely if ever, behind a single tap — always closed
  // on open, in Classic and in Modern's Vehicle tab alike. Never
  // auto-expanded for a customized value: the owner's explicit call is
  // that a user's own settings are personal choices they're expected to
  // remember, and with no test cohort to validate a "smarter" default the
  // simplest rule wins. Built once, shared by both branches below — same
  // field elements, just appended inside this wrapper instead of flat.
  const advancedDetails = document.createElement('details');
  advancedDetails.className = 'settings__advanced';
  const advancedSummary = document.createElement('summary');
  advancedSummary.className = 'settings__advanced-summary';
  advancedDetails.append(
    advancedSummary,
    fieldEls.get('toleranceMm')!,
    fieldEls.get('stabilityMm')!,
    appearanceField,
    soundField,
    soundGuidanceField,
    soundGuidanceHint,
  );

  // ============================================================
  // Modern (#108): three tabs (Fordon/Klossar/Kalibrering) instead
  // of one long page. Built only when appearance === 'modern'; every
  // element above is reused as-is, just reparented into tab panels
  // instead of appended flat.
  // ============================================================
  let selectTab: ((id: 'vehicle' | 'ramps' | 'calibration') => void) | null = null;
  /** Set by the Modern branch below; stays null (a no-op) in Classic. */
  let renderKlossarUiImpl: (() => void) | null = null;
  function renderKlossarUi(): void {
    renderKlossarUiImpl?.();
  }

  if (appearance === 'modern') {
    type TabId = 'vehicle' | 'ramps' | 'calibration';
    const tabsBar = document.createElement('div');
    tabsBar.className = 'settings__tabs';
    tabsBar.setAttribute('role', 'tablist');

    const tabButtons = new Map<TabId, HTMLButtonElement>();
    const tabPanels = new Map<TabId, HTMLElement>();

    const makeTabButton = (id: TabId): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'settings__tab';
      btn.setAttribute('role', 'tab');
      btn.dataset.tab = id;
      btn.addEventListener('click', () => selectTab?.(id));
      tabsBar.append(btn);
      tabButtons.set(id, btn);
      return btn;
    };
    const vehicleTab = makeTabButton('vehicle');
    const rampsTab = makeTabButton('ramps');
    const calibrationTab = makeTabButton('calibration');

    const vehiclePanel = document.createElement('div');
    vehiclePanel.className = 'settings__tabpanel';
    const rampsPanel = document.createElement('div');
    rampsPanel.className = 'settings__tabpanel settings__tabpanel--klossar';
    const calibrationPanel = document.createElement('div');
    calibrationPanel.className = 'settings__tabpanel';
    tabPanels.set('vehicle', vehiclePanel);
    tabPanels.set('ramps', rampsPanel);
    tabPanels.set('calibration', calibrationPanel);

    // --- Kalibrering tab: embeds the same calibration section the menu
    // uses standalone (#109) — not a reimplementation. Its status text
    // is refreshed whenever this tab becomes visible, since the form
    // (and this embedded copy) is only built once, not on every open.
    const embeddedCalibration = createCalibrationSection(
      calibrationOptions ?? inertCalibrationOptions(),
    );
    calibrationPanel.append(embeddedCalibration.element);

    selectTab = (id: TabId): void => {
      for (const [tid, btn] of tabButtons) btn.setAttribute('aria-selected', String(tid === id));
      for (const [tid, panel] of tabPanels) panel.hidden = tid !== id;
      if (id === 'calibration') embeddedCalibration.refresh();
    };
    form.selectCalibrationTab = () => selectTab?.('calibration');

    // --- Fordon tab: today's vehicle/axle/measurement fields visible by
    // default; tolerance/stability/appearance/audio behind Advanced (#157).
    vehiclePanel.append(
      vehicleField,
      axleField,
      fieldEls.get('wheelbaseMm')!,
      fieldEls.get('trackWidthFrontMm')!,
      fieldEls.get('trackWidthRearMm')!,
      measureHint,
      unitField,
      themeField,
      advancedDetails,
      actions,
    );

    // --- Klossar tab ---
    const filterRow = document.createElement('div');
    filterRow.className = 'klossar__filter';
    const brands = [...new Set(RAMP_MODELS.map((m) => m.name.split(' ')[0]!))];
    let brandFilter: string | null = null;
    const brandChips = new Map<string | null, HTMLButtonElement>();
    const makeBrandChip = (brand: string | null, label: string): void => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'klossar__chip';
      chip.textContent = label;
      chip.addEventListener('click', () => {
        brandFilter = brand;
        for (const [b, c] of brandChips) c.setAttribute('aria-pressed', String(b === brandFilter));
        renderKlossarUi();
      });
      filterRow.append(chip);
      brandChips.set(brand, chip);
    };
    makeBrandChip(null, t('settings.klossar.brandAll'));
    for (const brand of brands) makeBrandChip(brand, brand);
    brandChips.get(null)!.setAttribute('aria-pressed', 'true');

    const pinnedCard = document.createElement('div');
    pinnedCard.className = 'klossar__pinned';
    pinnedCard.hidden = true;
    const pinnedInfo = document.createElement('div');
    const pinnedName = document.createElement('p');
    pinnedName.className = 'klossar__pinned-name';
    const pinnedSub = document.createElement('p');
    pinnedSub.className = 'klossar__pinned-sub';
    pinnedInfo.append(pinnedName, pinnedSub);
    const pinnedCheck = document.createElement('span');
    pinnedCheck.className = 'klossar__check';
    pinnedCheck.textContent = '✓';
    pinnedCheck.setAttribute('aria-hidden', 'true');
    pinnedCard.append(pinnedInfo, pinnedCheck);

    const modelList = document.createElement('div');
    modelList.className = 'klossar__list';
    const modelRows = new Map<
      string,
      { row: HTMLButtonElement; radio: HTMLSpanElement; brand: string }
    >();
    for (const model of RAMP_MODELS) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'klossar__row';
      const info = document.createElement('span');
      info.className = 'klossar__row-info';
      const name = document.createElement('span');
      name.className = 'klossar__row-name';
      name.textContent = model.name;
      const mmLine = document.createElement('span');
      mmLine.className = 'klossar__row-mm';
      mmLine.textContent = `${model.stepsMm.join('/')} mm`;
      info.append(name, mmLine);
      const radio = document.createElement('span');
      radio.className = 'klossar__radio';
      radio.setAttribute('aria-hidden', 'true');
      row.append(info, radio);
      row.addEventListener('click', () => applyRampChoice(model));
      modelList.append(row);
      modelRows.set(model.name, { row, radio, brand: model.name.split(' ')[0]! });
    }

    const customRow = document.createElement('button');
    customRow.type = 'button';
    customRow.className = 'klossar__row klossar__row--custom';
    const customName = document.createElement('span');
    customName.className = 'klossar__row-name';
    customName.textContent = t('settings.ramp.custom');
    const customRadio = document.createElement('span');
    customRadio.className = 'klossar__radio';
    customRadio.setAttribute('aria-hidden', 'true');
    customRow.append(customName, customRadio);
    customRow.addEventListener('click', () => applyRampChoice(null));

    // The existing chip editor (add/remove step heights), relocated
    // under the custom row — same elements as the classic <select>'s
    // companion editor, shown only while a custom set is chosen.
    const customEditor = document.createElement('div');
    customEditor.className = 'klossar__custom-editor';
    customEditor.append(stepsCaption, chipList, addRow);

    const footer = document.createElement('div');
    footer.className = 'klossar__footer';
    const footerHead = document.createElement('div');
    footerHead.className = 'klossar__footer-head';
    const footerHeading = document.createElement('span');
    footerHeading.className = 'klossar__footer-heading';
    footerHeading.textContent = t('settings.klossar.stepsHeading');
    const footerModelName = document.createElement('span');
    footerModelName.className = 'klossar__footer-model';
    footerHead.append(footerHeading, footerModelName);
    const footerGrid = document.createElement('div');
    footerGrid.className = 'klossar__grid';
    const footerActions = document.createElement('div');
    footerActions.className = 'klossar__footer-actions';
    const footerSave = document.createElement('button');
    footerSave.type = 'submit';
    footerSave.className = 'menu__action';
    footerSave.disabled = true;
    footerSave.textContent = t('settings.save');
    const footerUndo = document.createElement('button');
    footerUndo.type = 'button';
    footerUndo.className = 'menu__action menu__action--secondary';
    footerUndo.disabled = true;
    footerUndo.textContent = t('settings.undo');
    // populate()/saved are defined further down, but this only runs on a
    // later click — by then the whole form is fully set up.
    footerUndo.addEventListener('click', () => populate(saved));
    footerActions.append(footerSave, footerUndo);
    saveButtons.push(footerSave);
    undoButtons.push(footerUndo);
    footer.append(footerHead, footerGrid, footerActions);

    rampsPanel.append(filterRow, pinnedCard, modelList, customRow, customEditor, footer);

    renderKlossarUiImpl = (): void => {
      const selectedModel = customChosen
        ? null
        : (RAMP_MODELS.find((m) => m.name === rampSelect.value) ?? null);

      pinnedCard.hidden = !selectedModel;
      if (selectedModel) {
        pinnedName.textContent = selectedModel.name;
        const stepWord =
          selectedModel.stepsMm.length === 1
            ? t('settings.klossar.step.one')
            : t('settings.klossar.step.many', { n: selectedModel.stepsMm.length });
        pinnedSub.textContent = t('settings.klossar.pinnedSub', {
          mm: selectedModel.stepsMm.join(' / '),
          steps: stepWord,
        });
      }

      for (const { row, radio } of modelRows.values()) {
        row.classList.remove('klossar__row--selected');
        radio.classList.remove('klossar__radio--selected');
      }
      if (selectedModel) {
        const entry = modelRows.get(selectedModel.name);
        entry?.row.classList.add('klossar__row--selected');
        entry?.radio.classList.add('klossar__radio--selected');
      }
      customRow.classList.toggle('klossar__row--selected', customChosen);
      customRadio.classList.toggle('klossar__radio--selected', customChosen);
      customEditor.hidden = !customChosen;

      for (const { row, brand } of modelRows.values()) {
        row.hidden = brandFilter !== null && brand !== brandFilter;
      }

      const sortedSteps = [...steps].sort((a, b) => a - b);
      footerModelName.textContent = selectedModel ? selectedModel.name : t('settings.ramp.custom');
      footerGrid.replaceChildren();
      footerGrid.style.gridTemplateColumns = `repeat(${sortedSteps.length || 1}, 1fr)`;
      sortedSteps.forEach((mm, i) => {
        const cell = document.createElement('div');
        cell.className = 'klossar__grid-cell';
        const label = document.createElement('span');
        label.className = 'klossar__grid-label';
        label.textContent = t('diagram.step', { n: i + 1 });
        const value = document.createElement('span');
        value.className = 'klossar__grid-value';
        value.textContent = String(Math.round(mm));
        cell.append(label, value);
        footerGrid.append(cell);
      });
    };

    form.append(tabsBar, vehiclePanel, rampsPanel, calibrationPanel);
    selectTab('vehicle');

    // applyUnitEverywhere sets tab-label text (needs unit/vehicle
    // resolved captions elsewhere already handled below).
    unitAppliers.push(() => {
      vehicleTab.textContent = t('settings.tab.vehicle');
      rampsTab.textContent = t('settings.tab.ramps');
      calibrationTab.textContent = t('menu.calibration');
    });
  } else {
    // --- Classic: one flat page. Tolerance/stability/appearance/audio
    // move behind Advanced (#157); everything else is unchanged from #108.
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
      unitField,
      themeField,
      advancedDetails,
      actions,
    );
  }

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
    appearanceCaption.textContent = t('settings.appearance');
    for (const [option, label] of appearanceOptions) option.textContent = t(label);
    soundCaption.textContent = t('settings.sound');
    soundGuidanceCaption.textContent = t('settings.soundGuidance');
    soundGuidanceHint.textContent = t('settings.soundGuidance.help');
    vehicleHeading.textContent = t('settings.section.vehicle');
    rampsHeading.textContent = t('settings.section.ramps');
    displayHeading.textContent = t('settings.section.display');
    advancedSummary.textContent = t('settings.advanced');
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
      soundGuidance: soundGuidanceInput.checked,
      theme: themeSelect.value,
      appearance: appearanceSelect.value,
    };
    for (const [key, input] of inputs) raw[key] = fromUnit(input.valueAsNumber);
    return parseSettings(raw);
  };

  // Save and Undo are grayed out until the form differs from what is saved.
  let saved = initial;
  const notifyChanged = () => {
    const clean = JSON.stringify(currentSettings()) === JSON.stringify(saved);
    for (const btn of saveButtons) btn.disabled = clean;
    for (const btn of undoButtons) btn.disabled = clean;
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
    appearanceSelect.value = settings.appearance;
    applyAppearance(settings.appearance);
    soundInput.checked = settings.soundOnLevel;
    soundGuidanceInput.checked = settings.soundGuidance;
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
