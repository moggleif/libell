/**
 * Settings form: vehicle geometry, the ramp step editor (a ready-made
 * ramp picker plus a visual +/− list — no separator syntax to learn),
 * display unit,
 * tolerance/stability, the level chime and continuous audio guidance
 * (#121). Values are entered and shown in the chosen unit; storage and
 * math stay mm. Every change is stored as it is made, with a "Saved ·
 * Undo" toast (#328); the wizard's compact steps save on Next instead.
 *
 * Modern appearance (#108): when `initial.appearance === 'modern'`, the
 * form renders as tabs (Fordon/Klossar/Kalibrering/I våg/Allmänt, #329) instead
 * of one long page, with a redesigned ramp picker (brand filter, pinned current
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
  formatLengthValue,
  MAX_RAMP_COUNT,
  parseSettings,
  type AppearanceSetting,
  type AxleConfig,
  type LevelSettings,
  type ThemeSetting,
  type VehicleType,
} from '../domain/settings';
import { matchRampModel, rampLabel, RAMP_MODELS, type RampModel } from '../domain/ramps';
import {
  saveSettings,
  loadSettings,
  loadLanguage,
  saveLanguage,
  clearLanguage,
} from '../data/settingsStore';
import { showActionToast } from './toast';
import { applyAppearance, applyTheme } from './theme';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createTargetsSection, type TargetsOptions } from './targetsSection';
import { isLanguage, LANGUAGE_NAMES, LANGUAGES, t, type MessageKey } from './i18n';

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
 * Same fallback role as `inertCalibrationOptions` above, for the embedded
 * Targets tab (screen-cleanup follow-up): a standalone harness or a unit
 * test building a Modern-mode form directly still renders without a real
 * host — just an always-empty, non-functional preset list.
 */
function inertTargetsOptions(): TargetsOptions {
  return {
    getTargetPresets: () => [],
    getActiveTargetId: () => null,
    selectTarget: () => {},
    addTargetPreset: () => null,
    deleteTargetPreset: () => {},
  };
}

/**
 * The Modern tab bar exposes `selectCalibrationTab` (undefined in Classic,
 * which has no tabs) so the menu's Calibration entry can jump straight to
 * the Kalibrering tab of this same live instance instead of mounting a
 * second, independent `createCalibrationSection` (#155).
 */
export type SettingsFormElement = HTMLFormElement & {
  selectCalibrationTab?: () => void;
  /**
   * Same shortcut as `selectCalibrationTab` above, for the Level tab that
   * holds the saved targets (#329; Modern only — Classic has no tabs to
   * select; its Level page is `classicPages.targets` below instead).
   */
  selectTargetsTab?: () => void;
  /**
   * Resync the Chime/Continuous-audio-guidance checkboxes (and the
   * stored baseline for just those two fields) from a value that changed
   * outside this form — the bottom bar's mute toggle (#161). Called by
   * the menu host every time it reopens. Not a change of its own: the
   * value is already stored, so nothing is saved and no toast shows.
   */
  resyncSoundFields?: (sound: Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>) => void;
  /**
   * Classic split pages (screen-cleanup follow-up, `splitPages` below):
   * the same four bodies the menu's ☰ drawer navigates between —
   * vehicle/ramps/targets (the Level page, #329)/general — sharing this
   * one form's state. The
   * menu swaps whichever body is this form's current child right before
   * showing it; undefined unless `splitPages` was requested. Calibration
   * stays its own standalone page outside this form.
   */
  classicPages?: {
    general: HTMLElement;
    vehicle: HTMLElement;
    ramps: HTMLElement;
    targets: HTMLElement;
  };
  /**
   * Refreshes the embedded targets section built for `classicPages.targets`
   * above — the preset list can change from outside
   * this form (a preset added/deleted, the active target switched), so the
   * menu host calls this every time it (re)opens the Targets page, same
   * reasoning as `resyncSoundFields` above. Undefined unless `splitPages`
   * was requested.
   */
  refreshTargetsPage?: () => void;
};

export interface SettingsFormOptions {
  /**
   * Reduced onboarding-only renderings, each just its own subset of the
   * same field elements the full form builds — never a wizard-only
   * duplicate. Omitted everywhere else (the menu's Settings page, the
   * embedded Modern tabs), which get the full form instead.
   *
   * 'measurements' (onboarding step, #156): only Wheelbase and Track
   * width front/rear — the three numbers most first-run users have on
   * hand from the registration document (see `measureHint` below).
   *
   * 'language' / 'appearance' / 'sound' (onboarding steps; #189 introduced
   * these as one combined 'general' step, later split by a design review
   * into one step per actual decision): Language stands alone — it has to
   * resolve before the rest of the guide is legible, which none of the
   * others need. Theme and Appearance are one "how it looks" decision, so
   * they share a step. Chime and Continuous audio guidance are one "what
   * it sounds like" decision, so they share a step. Splitting by what the
   * fields are *for*, not just moving the same five fields onto more
   * screens — grouping unrelated settings just because they used to share
   * a Settings section header is what made them feel bundled together in
   * the first place.
   *
   * 'ramps' (onboarding step, design review): the ready-made ramp
   * model/custom step-height picker and ramp count — what the ramp
   * catalog and per-wheel step guidance actually run on, the thing that
   * most sets this app's leveling apart from a plain bubble-level or
   * sensor-only competitor. Reuses the same classic-style single
   * `<select>` + chip editor Classic mode's own Ramps section uses, not
   * Modern's scrolling brand-filtered catalog grid — proportionate to a
   * reduced first-run step either way. Drain position stays Advanced-tier,
   * reachable from Settings afterward, same as Tolerance/Stability.
   *
   * Any way, everything not listed above (Vehicle type, Rear axle,
   * Tolerance, Stability, Show lengths in, Drain position — including the
   * Advanced disclosure from #157, not just collapsed but absent) stays
   * reachable from ☰ → Settings afterward.
   */
  compact?: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps';
  /**
   * Classic split pages (screen-cleanup follow-up): render Classic's
   * fields as three navigable bodies — General / Vehicle / Ramps, exposed
   * as `classicPages` on the returned form — instead of one long flat
   * page, mirroring Modern's General/Fordon/Klossar tab split (#108) now
   * that the menu's ☰ drawer has somewhere to put them. Ignored when
   * `appearance === 'modern'` (already split by tabs) or when `compact`
   * is set (the wizard's reduced single-topic steps). Only the ☰ menu
   * opts in; every other classic caller (tests, any future standalone
   * use) keeps the original flat page below.
   */
  splitPages?: boolean;
  /**
   * "Share vehicle setup" (R41, #207): called with the form's current
   * (committed on submit, live otherwise) settings when the button next to
   * the vehicle fields is pressed — the host picks out the shareable
   * geometry (`domain/vehicleShare.ts`) and hands off to the native share
   * sheet. Omitted for the onboarding `compact` steps, where there is
   * nothing meaningful yet to share.
   */
  onShareVehicleSetup?: (settings: LevelSettings) => void;
}

export function createSettingsForm(
  initial: LevelSettings,
  onSave: (settings: LevelSettings) => void,
  calibrationOptions?: CalibrationOptions,
  formOptions?: SettingsFormOptions,
  targetsOptions?: TargetsOptions,
): SettingsFormElement {
  const compact = formOptions?.compact;
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

  // --- Response delay (ms, #183): how long a reading must hold before the
  // shown mm figure/plan changes, and the shorter delay used only right
  // after a change while actively adjusting (driving up a ramp, cranking
  // the jockey wheel) — see `src/domain/stability.ts`. Not unit-converted
  // (always milliseconds), so built separately from the mm fields above.
  const msInputs = new Map<'dwellRestMs' | 'dwellMotionMs', HTMLInputElement>();
  const dwellRestField = document.createElement('label');
  dwellRestField.className = 'settings__field';
  const dwellRestCaption = document.createElement('span');
  const dwellRestInput = document.createElement('input');
  dwellRestInput.type = 'number';
  dwellRestInput.inputMode = 'decimal';
  dwellRestInput.name = 'dwellRestMs';
  dwellRestInput.min = '50';
  dwellRestInput.step = '50';
  dwellRestField.append(dwellRestCaption, dwellRestInput);
  msInputs.set('dwellRestMs', dwellRestInput);

  const dwellMotionField = document.createElement('label');
  dwellMotionField.className = 'settings__field';
  const dwellMotionCaption = document.createElement('span');
  const dwellMotionInput = document.createElement('input');
  dwellMotionInput.type = 'number';
  dwellMotionInput.inputMode = 'decimal';
  dwellMotionInput.name = 'dwellMotionMs';
  dwellMotionInput.min = '20';
  dwellMotionInput.step = '10';
  dwellMotionField.append(dwellMotionCaption, dwellMotionInput);
  msInputs.set('dwellMotionMs', dwellMotionInput);

  const dwellHint = document.createElement('p');
  dwellHint.className = 'settings__hint';

  dwellRestInput.value = String(initial.dwellRestMs);
  dwellMotionInput.value = String(initial.dwellMotionMs);

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

  // --- Share vehicle setup (R41, #207): a link carrying only the vehicle-
  // geometry fields on this page — never calibration, never UI/behavior
  // preferences (`domain/vehicleShare.ts`) — for a family member using the
  // same vehicle. Omitted from the onboarding `compact` steps below: there
  // is nothing saved yet worth sharing at that point.
  const shareVehicleButton = document.createElement('button');
  shareVehicleButton.type = 'button';
  // The trailing class is a stable hook for the fit test, which has to
  // reach the incoming-setup view the way a real user does — by producing
  // a real share link from this button (scripts/fit-test.mjs). Matching on
  // the label instead would mean duplicating the i18n table in the test.
  // A quiet link, not a button (#329): sharing is a rare errand, and a
  // full-width button made it look like the page's main action.
  shareVehicleButton.className = 'link-button settings__share-vehicle';
  shareVehicleButton.textContent = t('settings.shareVehicle');
  shareVehicleButton.addEventListener('click', () => {
    formOptions?.onShareVehicleSetup?.(currentSettings());
  });

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
  // What the number actually means (#246): it read as a bare quantity with
  // no unit of meaning — how many you own? how many the app may use? —
  // and the explanation that existed was under Advanced, below it. It now
  // carries both facts in one sentence: Modern used to show this and
  // `rampHint` as two separate help texts a few lines apart, saying
  // overlapping things and costing the tab a line it did not have.
  // Classic still shows `rampHint` on its own, where it stands alone.
  const rampCountHint = document.createElement('p');
  rampCountHint.className = 'settings__hint';

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

  // On the Level tab with Tolerance (#329): it decides which way the
  // vehicle may lean within the tolerance, so it is about level, not about
  // the ramps — it used to sit behind Advanced on the Ramps tab.
  const drainHint = document.createElement('p');
  drainHint.className = 'settings__hint';

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

  // --- Language (screen-cleanup follow-up): a stored override, entirely
  // separate from `LevelSettings` (see `settingsStore.ts`'s loadLanguage/
  // saveLanguage) — so it applies (and reloads, since `t()` isn't
  // reactive) immediately on change.
  // Every shipped language is offered (#178), each named in itself via
  // `LANGUAGE_NAMES` — deliberately literal, never translated via `t()`,
  // so a Swedish reader can still find "Deutsch" and vice versa. Automatic
  // is appended before the loop, so it stays pinned at the top whatever the
  // current language is; `LANGUAGES` orders the rest alphabetically.
  const languageField = document.createElement('label');
  languageField.className = 'settings__field';
  const languageCaption = document.createElement('span');
  const languageSelect = document.createElement('select');
  languageSelect.className = 'settings__select';
  const languageAutoOption = document.createElement('option');
  languageAutoOption.value = 'auto';
  languageSelect.append(languageAutoOption);
  for (const lang of LANGUAGES) {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = LANGUAGE_NAMES[lang];
    languageSelect.append(option);
  }
  const storedLanguage = loadLanguage();
  languageSelect.value = isLanguage(storedLanguage) ? storedLanguage : 'auto';
  languageSelect.addEventListener('change', () => {
    const value = languageSelect.value;
    if (isLanguage(value)) saveLanguage(value);
    else clearLanguage();
    location.reload();
  });
  languageField.append(languageCaption, languageSelect);

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
  // Live preview, and stored at once like every other change (#328).
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
    { value: 'glossy', label: 'appearance.glossy' },
  ];
  const appearanceOptions: [HTMLOptionElement, MessageKey][] = [];
  for (const { value, label } of APPEARANCES) {
    const option = document.createElement('option');
    option.value = value;
    option.selected = value === initial.appearance;
    appearanceSelect.append(option);
    appearanceOptions.push([option, label]);
  }
  // Live preview for colors, same as the theme select above — but unlike
  // Theme, this axis also decides *structure* (tabs vs. one flat page,
  // the main diagram, onboarding — every appearance-branching component
  // is built once at bootstrap and never restructured in place, per each
  // component's own file comment). Design review: rather than leaving
  // that structural switch stuck until next reopen, saving the draft and
  // reloading makes it feel as immediate as Theme — the exact pattern
  // the Language select already uses just above for the same reason
  // (`t()` isn't reactive either). Skipped in a compact/wizard step
  // (`compact` below): the wizard decides for itself when settings are
  // actually persisted, so a mid-wizard appearance pick must stay a
  // preview only, never an early save-and-reload.
  appearanceSelect.addEventListener('change', () => {
    applyAppearance(appearanceSelect.value as AppearanceSetting);
    if (compact) {
      notifyChanged();
      return;
    }
    saveSettings(currentSettings());
    location.reload();
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

  // No Save/Undo/Reset rows (#328): every change is stored the moment it
  // is made (see `notifyChanged` below) and a "Saved · Undo" toast is the
  // way back. The one remaining whole-form action, "Reset all settings",
  // sits under General › More, out of the way of everyday edits — it used
  // to sit on every tab, where it also reset the tabs not on screen.
  const resetAllButton = document.createElement('button');
  resetAllButton.type = 'button';
  resetAllButton.className = 'menu__action menu__action--secondary settings__reset-all';
  // Keeps the appearance: it decides the page's whole structure, and
  // changing it reloads the app (see the Appearance select below), which
  // would take the Undo toast with it.
  resetAllButton.addEventListener('click', () => {
    populate({ ...DEFAULT_SETTINGS, appearance: saved.appearance });
    notifyChanged();
  });
  const generalMore = document.createElement('details');
  generalMore.className = 'settings__advanced settings__more';
  const generalMoreSummary = document.createElement('summary');
  generalMoreSummary.className = 'settings__advanced-summary';
  // Filled further down, once the Fine-tuning fields exist.
  generalMore.append(generalMoreSummary);

  // Section headings: the flat Classic page's four groups, the Sound
  // group on General, Fine-tuning inside More and the saved targets on the
  // Level tab.
  const sectionHeading = (): HTMLParagraphElement => {
    const heading = document.createElement('p');
    heading.className = 'settings__section';
    return heading;
  };
  const vehicleHeading = sectionHeading();
  const rampsHeading = sectionHeading();
  const levelHeading = sectionHeading();
  const generalHeading = sectionHeading();
  const soundGroupHeading = sectionHeading();
  const targetsHeading = sectionHeading();

  // One hint per field, right below it — same pattern as `dwellHint`.
  const toleranceHint = document.createElement('p');
  toleranceHint.className = 'settings__hint';
  const stabilityHint = document.createElement('p');
  stabilityHint.className = 'settings__hint';

  // Fine-tuning (#329): Stability and both response delays are tuned
  // rarely if ever, so they sit under General › More with "Reset all",
  // always collapsed on open — never auto-expanded for a customized value
  // (#157: a user's own settings are choices they are expected to
  // remember). Tolerance is not here: it is a real choice about how level
  // is level, and has its place on the Level tab.
  const fineTuningHeading = sectionHeading();
  generalMore.append(
    fineTuningHeading,
    fieldEls.get('stabilityMm')!,
    stabilityHint,
    dwellRestField,
    dwellMotionField,
    dwellHint,
    resetAllButton,
  );

  // The Level tab/page (#329): what counts as level, which side drains,
  // and the saved targets. Built once and shared by Modern and Classic.
  const levelGroup = (targets: HTMLElement): HTMLElement[] => [
    fieldEls.get('toleranceMm')!,
    toleranceHint,
    drainField,
    drainHint,
    targetsHeading,
    targets,
  ];

  // ============================================================
  // Modern (#108): tabs (Fordon/Klossar/Kalibrering/I våg/Allmänt, #329) instead
  // of one long page. Built only when appearance === 'modern'; every
  // element above is reused as-is, just reparented into tab panels
  // instead of appended flat.
  // ============================================================
  let selectTab:
    ((id: 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'general') => void) | null = null;
  /** Set by `buildRampsPage` below; stays null (a no-op) without it. */
  let renderKlossarUiImpl: (() => void) | null = null;
  function renderKlossarUi(): void {
    renderKlossarUiImpl?.();
  }

  /**
   * The Ramps page (#246), built into `panel`: the chosen ramp and its
   * step heights, Number of ramps, then "Change ramp" holding the brand
   * filter and the catalogue. Modern's tab and Classic's ☰ page both use
   * it (#331) — only the styling differs; the wizard's ramps step keeps
   * the compact select. Called at most once per form: it takes the step
   * editor's elements for its custom-set editor.
   */
  function buildRampsPage(panel: HTMLElement): void {
    // The whole business of changing your ramp, behind one disclosure
    // (#246): the brand filter and the catalogue it narrows. Collapsed,
    // because the tab's common errand is checking what is set — which the
    // block above answers — not re-choosing. Whoever is re-choosing opens
    // this, and finds the filter and the list together rather than a
    // filter here and the thing it filters somewhere else.
    const filterDetails = document.createElement('details');
    filterDetails.className = 'settings__advanced klossar__picker-details';
    const filterSummary = document.createElement('summary');
    filterSummary.className = 'settings__advanced-summary';
    // Set here rather than in the shared populate pass below: this element
    // only exists in the Modern branch, and a language change rebuilds the
    // whole form anyway.
    filterSummary.textContent = t('settings.klossar.changeRamp');
    const filterRow = document.createElement('div');
    filterRow.className = 'klossar__filter';
    // `modelList` is appended below, once it exists — the picker lives
    // inside this disclosure now, not beside it.
    filterDetails.append(filterSummary, filterRow);
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

    // No pinned "currently chosen" card above the list any more (#246).
    // The chosen ramp was on the screen three times over: that card, its
    // own row in the list right below it, and the footer — the card and
    // the footer carrying the very same step heights. One picker, one
    // answer: the list chooses, and the footer below it says what is
    // chosen and stays put while the list scrolls.
    const modelList = document.createElement('div');
    modelList.className = 'klossar__list';
    const modelRows = new Map<
      string,
      {
        row: HTMLButtonElement;
        radio: HTMLSpanElement;
        mmLine: HTMLSpanElement;
        brand: string;
        stepsMm: number[];
      }
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
      info.append(name, mmLine);
      const radio = document.createElement('span');
      radio.className = 'klossar__radio';
      radio.setAttribute('aria-hidden', 'true');
      row.append(info, radio);
      row.addEventListener('click', () => applyRampChoice(model));
      modelList.append(row);
      modelRows.set(model.name, {
        row,
        radio,
        mmLine,
        brand: model.name.split(' ')[0]!,
        stepsMm: model.stepsMm,
      });
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
    // Inside the picker, and first in it (#246): choosing your own step
    // heights is one of the options, not a separate mechanism — and it is
    // the one entry relevant whatever brand you own, so it leads rather
    // than trailing eleven models you may already have ruled out. Never
    // hidden by the brand filter: "Froli" narrows which ready-made models
    // you see, it does not take away the option of entering your own.
    modelList.prepend(customRow);

    // The existing chip editor (add/remove step heights), relocated
    // under the custom row — same elements as the classic <select>'s
    // companion editor, shown only while a custom set is chosen.
    const customEditor = document.createElement('div');
    customEditor.className = 'klossar__custom-editor';
    customEditor.append(stepsCaption, chipList, addRow);

    // The chosen ramp first, the settings that depend on it below that
    // (#246 — the settings used to sit above the answer they belong to).
    const selectedBlock = document.createElement('div');
    selectedBlock.className = 'klossar__selected';

    // Reads top-down as one statement — "Selected: Thule Levelers, whose
    // step heights are these" — instead of the old single line that put a
    // "STEP HEIGHTS (MM)" heading and the model name at opposite ends of
    // the same row and left it to the reader to connect them (#246).
    const footerHead = document.createElement('div');
    footerHead.className = 'klossar__footer-head';
    const footerLabel = document.createElement('span');
    footerLabel.className = 'klossar__footer-label';
    footerLabel.textContent = t('settings.klossar.selected');
    const footerModelName = document.createElement('span');
    footerModelName.className = 'klossar__footer-model';
    footerHead.append(footerLabel, footerModelName);
    const footerHeading = document.createElement('span');
    footerHeading.className = 'klossar__footer-heading';
    const footerGrid = document.createElement('div');
    footerGrid.className = 'klossar__grid';
    selectedBlock.append(footerHead, footerHeading, footerGrid);

    // Answer first, means of changing it below (#246): what you have set
    // — the model and its step heights — then the settings that follow
    // from it, then the one disclosure that changes the choice, filter and
    // catalogue together. The custom step-height editor stays directly
    // under the block showing those heights, since that is what it edits.
    filterDetails.append(modelList);
    panel.append(selectedBlock, customEditor, rampCountField, rampCountHint, filterDetails);

    renderKlossarUiImpl = (): void => {
      const selectedModel = customChosen
        ? null
        : (RAMP_MODELS.find((m) => m.name === rampSelect.value) ?? null);

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

      for (const { row, brand, mmLine, stepsMm } of modelRows.values()) {
        row.hidden = brandFilter !== null && brand !== brandFilter;
        mmLine.textContent = `${stepsMm.map((mm) => formatLengthValue(mm, unit)).join('/')} ${unit}`;
      }

      const sortedSteps = [...steps].sort((a, b) => a - b);
      footerHeading.textContent = `${t('settings.klossar.stepsHeading')} (${unit})`;
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
        value.textContent = formatLengthValue(mm, unit);
        cell.append(label, value);
        footerGrid.append(cell);
      });
    };
  }

  if (compact === 'measurements') {
    // Onboarding step (#156): the reduced subset only — no tabs, no
    // Advanced disclosure, no vehicle-type/axle selectors. A short note
    // pointing to ☰ is added by onboarding.ts itself, next to this form.
    // A wizard step already has its own Next/Skip/Back, and Next submits
    // this form directly — it is the step's only save (#328 left the
    // wizard that way; nothing here saves on change).
    form.append(
      measureHint,
      fieldEls.get('wheelbaseMm')!,
      fieldEls.get('trackWidthFrontMm')!,
      fieldEls.get('trackWidthRearMm')!,
    );
  } else if (compact === 'language') {
    // Onboarding step (design review, split from #189's combined
    // 'general'): Language alone — still reloads immediately on change,
    // same as Settings.
    form.append(languageField);
  } else if (compact === 'appearance') {
    // Onboarding step (design review): Theme + Appearance, the "how it
    // looks" pair — still live-preview on change, same as Settings.
    form.append(themeField, appearanceField);
  } else if (compact === 'sound') {
    // Onboarding step (design review): Chime + Continuous audio guidance,
    // the "what it sounds like" pair.
    form.append(soundField, soundGuidanceField, soundGuidanceHint);
  } else if (compact === 'ramps') {
    // Onboarding step (design review): the ready-made ramp model/custom
    // step-height picker + ramp count — the same elements/handlers
    // Classic mode's own Ramps section uses. `applyUnitEverywhere()` still
    // hides rampCountField/rampCountHint/rampHint for a caravan (it ramps
    // one wheel),
    // exactly as it already does on the full form — no extra logic needed
    // here for that.
    form.append(rampHint, stepsField, rampCountField);
  } else if (appearance === 'modern') {
    type TabId = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'general';
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
    // Tab order (#329): the order a new owner sets things up in — the
    // vehicle, its ramps, calibration, what counts as level — with the
    // app-wide preferences last. Opens on Vehicle.
    const vehicleTab = makeTabButton('vehicle');
    const rampsTab = makeTabButton('ramps');
    const calibrationTab = makeTabButton('calibration');
    // The Level tab (#329): Tolerance, Drain side and the saved targets
    // (#122, ADR 0013). Its id stays 'targets' — the main screen's target
    // badge opens it through `selectTargetsTab`.
    const targetsTab = makeTabButton('targets');
    const generalTab = makeTabButton('general');

    const generalPanel = document.createElement('div');
    generalPanel.className = 'settings__tabpanel';
    const calibrationPanel = document.createElement('div');
    calibrationPanel.className = 'settings__tabpanel';
    const vehiclePanel = document.createElement('div');
    vehiclePanel.className = 'settings__tabpanel';
    const rampsPanel = document.createElement('div');
    rampsPanel.className = 'settings__tabpanel settings__tabpanel--klossar';
    const targetsPanel = document.createElement('div');
    targetsPanel.className = 'settings__tabpanel';
    tabPanels.set('general', generalPanel);
    tabPanels.set('calibration', calibrationPanel);
    tabPanels.set('vehicle', vehiclePanel);
    tabPanels.set('ramps', rampsPanel);
    tabPanels.set('targets', targetsPanel);
    // Mirrors the tab buttons' dataset.tab — lets callers (and tests) find
    // a panel by id instead of by DOM position, so reordering the tabs
    // never silently breaks a positional lookup.
    for (const [id, panel] of tabPanels) panel.dataset.tab = id;

    // --- General tab: how the app looks and sounds, and More (#329) —
    // the same field elements Classic uses, just reparented here.
    generalPanel.append(
      languageField,
      themeField,
      appearanceField,
      unitField,
      soundGroupHeading,
      soundField,
      soundGuidanceField,
      soundGuidanceHint,
      generalMore,
    );

    // --- Kalibrering tab: embeds the same calibration section the menu
    // uses standalone (#109) — not a reimplementation. Its status text
    // is refreshed whenever this tab becomes visible, since the form
    // (and this embedded copy) is only built once, not on every open.
    // As a two-step checklist (#330), like the box's own setup.
    const embeddedCalibration = createCalibrationSection(
      calibrationOptions ?? inertCalibrationOptions(),
      'checklist',
    );
    calibrationPanel.append(embeddedCalibration.element);

    // --- Level tab: same reuse pattern as Kalibrering above for the
    // targets section.
    const embeddedTargets = createTargetsSection(targetsOptions ?? inertTargetsOptions());
    targetsPanel.append(...levelGroup(embeddedTargets.element));

    selectTab = (id: TabId): void => {
      for (const [tid, btn] of tabButtons) btn.setAttribute('aria-selected', String(tid === id));
      for (const [tid, panel] of tabPanels) panel.hidden = tid !== id;
      if (id === 'calibration') embeddedCalibration.refresh();
      if (id === 'targets') embeddedTargets.refresh();
    };
    form.selectCalibrationTab = () => selectTab?.('calibration');
    form.selectTargetsTab = () => selectTab?.('targets');

    // --- Fordon tab: the vehicle only (#329) — no Advanced, no unit.
    vehiclePanel.append(
      vehicleField,
      axleField,
      fieldEls.get('wheelbaseMm')!,
      fieldEls.get('trackWidthFrontMm')!,
      fieldEls.get('trackWidthRearMm')!,
      measureHint,
      shareVehicleButton,
    );

    // --- Klossar tab: the same page Classic's ☰ → Ramps shows (#331).
    buildRampsPage(rampsPanel);

    form.append(tabsBar, vehiclePanel, rampsPanel, calibrationPanel, targetsPanel, generalPanel);
    selectTab('vehicle');

    // applyUnitEverywhere sets tab-label text (needs unit/vehicle
    // resolved captions elsewhere already handled below).
    unitAppliers.push(() => {
      generalTab.textContent = t('settings.general');
      calibrationTab.textContent = t('menu.calibration');
      vehicleTab.textContent = t('settings.tab.vehicle');
      rampsTab.textContent = t('settings.tab.ramps');
      targetsTab.textContent = t('settings.tab.level');
    });
  } else if (formOptions?.splitPages) {
    // --- Classic split pages (screen-cleanup follow-up): the same groups
    // as Modern's tabs (#329), as ☰ drawer pages instead — Classic has no
    // tab bar. One shared `<form>`/state underneath: the menu swaps
    // whichever body is this form's mounted child, and every change is
    // stored as it is made (#328), whichever page it is on.
    const generalBody = document.createElement('div');
    generalBody.append(
      languageField,
      themeField,
      appearanceField,
      unitField,
      soundGroupHeading,
      soundField,
      soundGuidanceField,
      soundGuidanceHint,
      generalMore,
    );
    const vehicleBody = document.createElement('div');
    vehicleBody.append(
      vehicleField,
      axleField,
      fieldEls.get('wheelbaseMm')!,
      fieldEls.get('trackWidthFrontMm')!,
      fieldEls.get('trackWidthRearMm')!,
      measureHint,
      shareVehicleButton,
    );
    // The same Ramps page as Modern's tab (#331), not the wizard's select.
    const rampsBody = document.createElement('div');
    rampsBody.className = 'settings__tabpanel--klossar';
    buildRampsPage(rampsBody);

    // --- Level page (#329): one real `createTargetsSection` component,
    // not a copy, below Tolerance and Drain side.
    const embeddedTargetsClassic = createTargetsSection(targetsOptions ?? inertTargetsOptions());
    const targetsBody = document.createElement('div');
    targetsBody.append(...levelGroup(embeddedTargetsClassic.element));
    form.refreshTargetsPage = embeddedTargetsClassic.refresh;

    form.classicPages = {
      general: generalBody,
      vehicle: vehicleBody,
      ramps: rampsBody,
      targets: targetsBody,
    };
    form.append(vehicleBody);
  } else {
    // --- Classic: one flat page (default; the menu opts into the split
    // pages above via `splitPages`), in the same groups as the tabs
    // (#329). No screen in the app shows it any more — the ☰ menu always
    // uses the split pages — so it keeps the compact ramp select rather
    // than the Ramps page (#331), and leaves out the saved targets, which
    // need a host.
    form.append(
      vehicleHeading,
      vehicleField,
      axleField,
      fieldEls.get('wheelbaseMm')!,
      fieldEls.get('trackWidthFrontMm')!,
      fieldEls.get('trackWidthRearMm')!,
      measureHint,
      shareVehicleButton,
      rampsHeading,
      stepsField,
      rampCountField,
      rampHint,
      levelHeading,
      fieldEls.get('toleranceMm')!,
      toleranceHint,
      drainField,
      drainHint,
      generalHeading,
      languageField,
      themeField,
      appearanceField,
      unitField,
      soundGroupHeading,
      soundField,
      soundGuidanceField,
      soundGuidanceHint,
      generalMore,
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
    // A caravan's "wheelbase" is the axle-to-jockey distance, which the
    // registration document does not list (#327).
    measureHint.textContent =
      t(vehicle === 'caravan' ? 'settings.measureHint.caravan' : 'settings.measureHint') +
      (axle === 'boggie' ? ` ${t('settings.measureHint.boggie')}` : '');
    stepsCaption.textContent = `${t('settings.steps')} (${unit})`;
    addInput.placeholder = unit === 'cm' ? '4' : '40';
    addButton.textContent = `+ ${t('settings.steps.add')}`;
    rampCaption.textContent = t('settings.ramp');
    customOption.textContent = t('settings.ramp.custom');
    // Ramp planning applies to the motorhome; a caravan ramps one wheel.
    rampCountField.hidden = vehicle === 'caravan';
    rampCountHint.hidden = vehicle === 'caravan';
    // Which side drains is a motorhome choice, like the ramp count.
    drainField.hidden = vehicle === 'caravan';
    drainHint.hidden = vehicle === 'caravan';
    rampHint.hidden = vehicle === 'caravan';
    rampCountCaption.textContent = t('settings.rampCount');
    drainCaption.textContent = t('settings.drain');
    for (const [option, label] of drainOptions) option.textContent = t(label);
    drainHint.textContent = t('settings.drainHint');
    rampHint.textContent = t('settings.rampHint');
    rampCountHint.textContent = t('settings.rampCountHint');
    unitCaption.textContent = t('settings.unit');
    languageCaption.textContent = t('settings.language');
    languageAutoOption.textContent = t('settings.language.auto');
    themeCaption.textContent = t('settings.theme');
    for (const [option, label] of themeOptions) option.textContent = t(label);
    appearanceCaption.textContent = t('settings.appearance');
    for (const [option, label] of appearanceOptions) option.textContent = t(label);
    soundCaption.textContent = t('settings.sound');
    soundGuidanceCaption.textContent = t('settings.soundGuidance');
    soundGuidanceHint.textContent = t('settings.soundGuidance.help');
    dwellRestCaption.textContent = t('settings.dwellRest');
    dwellMotionCaption.textContent = t('settings.dwellMotion');
    dwellHint.textContent = t('settings.dwell.hint');
    vehicleHeading.textContent = t('settings.section.vehicle');
    rampsHeading.textContent = t('settings.section.ramps');
    levelHeading.textContent = t('settings.tab.level');
    targetsHeading.textContent = t('menu.targets');
    fineTuningHeading.textContent = t('settings.fineTuning');
    generalHeading.textContent = t('settings.general');
    // Reuses the wizard's own step title (#189 follow-up) — same name for
    // the same grouping, not new copy for the same idea.
    soundGroupHeading.textContent = t('onboard.sound.h');
    toleranceHint.textContent = t('settings.tolerance.hint');
    stabilityHint.textContent = t('settings.stability.hint');
    generalMoreSummary.textContent = t('settings.more');
    resetAllButton.textContent = t('settings.resetAll');
  }
  applyUnitEverywhere();
  renderChips();

  // parseSettings guards against empty/invalid fields the same way it
  // guards against corrupt storage. Fields this form does not edit (the
  // sensor source and its device settings) come from what is stored now,
  // not from `initial`: they change while the form is open, and a save
  // from here must never put back an older sensor choice (#328 — with
  // every edit now saved at once, that would happen on any tap).
  const currentSettings = (): LevelSettings => {
    const stored = loadSettings();
    const raw: Record<string, unknown> = {
      sensorSource: stored.sensorSource,
      sensorDevices: stored.sensorDevices,
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
    for (const [key, input] of msInputs) raw[key] = input.valueAsNumber;
    return parseSettings(raw);
  };

  /** Only what this form edits — see `currentSettings` above. */
  const sameFormValues = (a: LevelSettings, b: LevelSettings): boolean => {
    const formValues = ({ sensorSource, sensorDevices, ...rest }: LevelSettings): string => {
      void sensorSource;
      void sensorDevices;
      return JSON.stringify(rest);
    };
    return formValues(a) === formValues(b);
  };

  // --- A number the user typed that cannot be used (#328): empty, zero or
  // negative. Never refused silently and never replaced by a factory
  // default: the field goes back to the value in effect, and one line
  // under it says what was wrong, until the next change.
  const fieldErrors = new Map<HTMLElement, HTMLParagraphElement>();
  const showFieldError = (field: HTMLElement, message: string | null): void => {
    let error = fieldErrors.get(field);
    if (!message) {
      if (error) error.hidden = true;
      return;
    }
    if (!error) {
      error = document.createElement('p');
      error.className = 'settings__hint settings__error';
      error.setAttribute('role', 'alert');
      fieldErrors.set(field, error);
    }
    error.textContent = message;
    error.hidden = false;
    field.after(error);
  };
  /** Puts the value in effect back into every unusable number field. */
  const restoreInvalidNumbers = (): void => {
    for (const { key, min } of NUMBER_FIELDS) {
      const input = inputs.get(key)!;
      const value = fromUnit(input.valueAsNumber);
      const ok = Number.isFinite(value) && (min === 0 ? value >= 0 : value > 0);
      showFieldError(
        fieldEls.get(key)!,
        ok ? null : t(min === 0 ? 'settings.err.notNegative' : 'settings.err.positive'),
      );
      if (!ok) input.value = String(toUnit(saved[key]));
    }
    for (const [key, input] of msInputs) {
      const field = key === 'dwellRestMs' ? dwellRestField : dwellMotionField;
      const ok = Number.isFinite(input.valueAsNumber) && input.valueAsNumber > 0;
      showFieldError(field, ok ? null : t('settings.err.positive'));
      if (!ok) input.value = String(saved[key]);
    }
  };

  let saved = initial;
  let undoToast: HTMLElement | null = null;
  const persist = (settings: LevelSettings): void => {
    saveSettings(settings);
    saved = settings;
    onSave(settings);
  };
  /**
   * Every change is stored at once (#328): there is no Save button and no
   * "unsaved" state to lose by closing the page. A toast offers to undo
   * it. The wizard's compact steps are the exception — they are saved by
   * their own Next, which submits this form (see the submit handler).
   */
  const notifyChanged = (): void => {
    if (compact) return;
    restoreInvalidNumbers();
    const next = currentSettings();
    if (sameFormValues(next, saved)) return;
    const previous = saved;
    // What parseSettings settled on (e.g. a motion delay clamped to the
    // rest delay) is what the fields show.
    for (const [key, input] of inputs) input.value = String(toUnit(next[key]));
    for (const [key, input] of msInputs) input.value = String(next[key]);
    persist(next);
    undoToast?.remove();
    undoToast = showActionToast(t('settings.saved'), t('settings.undo'), () => {
      populate(previous);
      restoreInvalidNumbers();
      persist(currentSettings());
    });
  };
  // Selects and switches report a change at once; a number field when the
  // user leaves it or presses Enter, so a half-typed value is never saved.
  form.addEventListener('change', notifyChanged);

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
    for (const [key, input] of msInputs) input.value = String(settings[key]);
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
  };

  form.resyncSoundFields = (sound) => {
    soundInput.checked = sound.soundOnLevel;
    soundGuidanceInput.checked = sound.soundGuidance;
    saved = { ...saved, soundOnLevel: sound.soundOnLevel, soundGuidance: sound.soundGuidance };
  };

  // The wizard's compact steps: Next submits the form, which saves it.
  // Enter in a number field on the full page lands here too, and is just
  // another change.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!compact) {
      notifyChanged();
      return;
    }
    const settings = currentSettings();
    for (const [key, input] of inputs) input.value = String(toUnit(settings[key]));
    for (const [key, input] of msInputs) input.value = String(settings[key]);
    steps = [...settings.rampStepHeightsMm];
    renderChips();
    persist(settings);
  });

  return form;
}
