/**
 * The Settings form: Vehicle, Ramps, Calibration, Level and General, each
 * built by its own tab module, sharing one state. Values are entered and
 * shown in the chosen unit; storage and math stay mm. Every change is
 * stored as it is made, with a "Saved · Undo" toast; the wizard's compact
 * steps save on Next instead.
 *
 * This file owns what the tabs share: the form state and reading and
 * showing its values. How a change is stored and undone, and how an
 * unusable number is reported, is `settingsAutoSave.ts`; which layout the
 * tabs are placed in is `settingsLayout.ts`. Modern shows them as tabs,
 * Classic's ☰ menu as separate pages (`splitPages`), the wizard as
 * single-topic steps (`compact`), and anything else as one flat page.
 *
 * Which structure to build is decided once, from `initial.appearance`, at
 * construction time. Changing Appearance reloads the app rather than
 * restructuring the open form (see `settingsGeneralTab.ts`).
 */
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { unitToMm } from '../domain/lengths';
import { parseSettings } from '../domain/settingsParsing';
import { loadSettings } from '../data/settingsStore';
import type { CalibrationOptions } from './calibrationSection';
import type { TargetsOptions } from './targetsSection';
import type { VehiclePickerOptions } from './vehiclePicker';
import { createElement } from './dom';
import { createAutoSave, type AutoSave, type FormValues } from './settingsAutoSave';
import {
  type NumberField,
  type RawSettings,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { layOut, type CompactStep, type SettingsFormElement, type Tabs } from './settingsLayout';
import { createVehicleTab } from './settingsVehicleTab';
import { createRampsTab } from './settingsRampsTab';
import { createLevelTab } from './settingsLevelTab';
import { createGeneralTab, type GeneralTab, type GeneralTabActions } from './settingsGeneralTab';

interface SettingsFormOptions {
  /**
   * Reduced onboarding-only renderings, each just its own subset of the
   * same field elements the full form builds — never a wizard-only
   * duplicate. Everything not in a step stays reachable from Settings
   * afterward.
   *
   * 'measurements': only Wheelbase and Track width front/rear — the numbers
   * first-run users have on hand from the registration document.
   *
   * 'language' / 'appearance' / 'sound': one step per decision. Language
   * stands alone because it must resolve before the rest of the guide is
   * legible; Theme + Appearance are "how it looks", Chime + audio guidance
   * "what it sounds like".
   *
   * 'ramps': the step-height picker and ramp count, as the flat Classic
   * page's single `<select>` + chip editor, not the Ramps page's
   * brand-filtered catalogue.
   */
  compact?: CompactStep;
  /**
   * Render Classic's fields as four navigable bodies, exposed as
   * `classicPages`, instead of one flat page. Ignored for Modern (already
   * split by tabs) or when `compact` is set. Only the ☰ menu opts in.
   */
  splitPages?: boolean;
  /**
   * "Share vehicle setup": called with the form's current settings — the
   * host picks out the shareable geometry (`domain/vehicleShare.ts`).
   * Omitted for the onboarding `compact` steps, with nothing yet to share.
   */
  onShareVehicleSetup?: (settings: LevelSettings) => void;
  /** Several vehicles (#599): the picker at the top of Vehicle. Omitted
   * for the onboarding `compact` steps. */
  vehicles?: VehiclePickerOptions;
}

export function createSettingsForm(
  initial: LevelSettings,
  onSave: (settings: LevelSettings) => void,
  calibrationOptions?: CalibrationOptions,
  formOptions?: SettingsFormOptions,
  targetsOptions?: TargetsOptions,
): SettingsFormElement {
  const compact = formOptions?.compact;
  const form: SettingsFormElement = createElement('form', 'settings__form');

  const state = stateOf(initial);
  // The tabs call back into the form, which in turn needs the tabs: both
  // are bound below, before any tab can call.
  let values!: FormValues;
  let autoSave!: AutoSave;
  const context: SettingsFormContext = {
    state,
    compact: compact !== undefined,
    changed: () => autoSave.changed(),
    relabelAll: () => values.relabelAll(),
    currentSettings: () => values.current(),
  };
  const tabs = createTabs(initial, context, formOptions?.onShareVehicleSetup, {
    unitChanged: (previous) => {
      values.showInNewUnit(previous);
      autoSave.changed();
    },
    resetAll: () => {
      values.populate({ ...DEFAULT_SETTINGS, appearance: autoSave.saved().appearance });
      autoSave.changed();
    },
  });

  // Decided once, at construction — see the file header comment.
  const hosts = {
    calibration: calibrationOptions,
    targets: targetsOptions,
    vehicles: formOptions?.vehicles,
  };
  const relabelLayout = layOut(form, tabs, initial.appearance, formOptions, hosts);
  values = createFormValues(tabs, state, relabelLayout);
  values.showNumbers((field) => initial[field.key]);
  autoSave = createAutoSave(values, initial, compact, onSave);
  wireForm(form, tabs.general, autoSave);
  return form;
}

function stateOf(settings: LevelSettings): SettingsFormState {
  return { unit: settings.displayUnit, vehicle: settings.vehicleType, axle: settings.rearAxle };
}

function createTabs(
  initial: LevelSettings,
  context: SettingsFormContext,
  onShareVehicleSetup: SettingsFormOptions['onShareVehicleSetup'],
  generalActions: GeneralTabActions,
): Tabs {
  return {
    vehicle: createVehicleTab(initial, context, (settings) => onShareVehicleSetup?.(settings)),
    ramps: createRampsTab(initial, context),
    level: createLevelTab(initial, context),
    general: createGeneralTab(initial, context, generalActions),
  };
}

function createFormValues(
  tabs: Tabs,
  state: SettingsFormState,
  relabelLayout: () => void,
): FormValues {
  const numberFields = [
    ...tabs.vehicle.measurements,
    tabs.level.tolerance,
    ...tabs.general.fineTuning,
  ];
  const eachTab = [tabs.vehicle, tabs.ramps, tabs.level, tabs.general];

  function relabelAll(): void {
    for (const field of numberFields) field.relabel();
    for (const tab of eachTab) tab.relabel();
    relabelLayout();
  }
  function showNumbers(valueOf: (field: NumberField) => number | undefined): void {
    relabelAll();
    for (const field of numberFields) {
      const value = valueOf(field);
      if (value !== undefined) field.show(value);
    }
    tabs.ramps.render();
  }
  return {
    numberFields,
    relabelAll,
    showNumbers,
    showInNewUnit(previous) {
      const lengths = new Map<NumberField, number>();
      for (const field of numberFields.filter((f) => f.inUnit)) {
        const mm = unitToMm(field.control.valueAsNumber, previous);
        if (Number.isFinite(mm)) lengths.set(field, mm);
      }
      showNumbers((field) => lengths.get(field));
    },
    current: () => readSettings(eachTab, numberFields),
    populate(settings) {
      Object.assign(state, stateOf(settings));
      for (const tab of eachTab) tab.populate(settings);
      showNumbers((field) => settings[field.key]);
    },
    showRampSteps: (stepsMm) => tabs.ramps.showSteps(stepsMm),
  };
}

/**
 * parseSettings guards against empty/invalid fields the same way it
 * guards against corrupt storage. Fields this form does not edit (the
 * sensor source and its device settings) come from what is stored now,
 * not from `initial`: they change while the form is open, and a save
 * from here must never put back an older sensor choice — with every edit
 * saved at once, that would happen on any tap.
 */
function readSettings(
  eachTab: { read(raw: RawSettings): void }[],
  numberFields: NumberField[],
): LevelSettings {
  const stored = loadSettings();
  const raw: RawSettings = {
    sensorSource: stored.sensorSource,
    sensorDevices: stored.sensorDevices,
  };
  for (const tab of eachTab) tab.read(raw);
  for (const field of numberFields) raw[field.key] = field.read();
  return parseSettings(raw);
}

function wireForm(form: SettingsFormElement, general: GeneralTab, autoSave: AutoSave): void {
  // Selects and switches report a change at once; a number field when the
  // user leaves it or presses Enter, so a half-typed value is never saved.
  form.addEventListener('change', () => autoSave.changed());
  form.resyncSoundFields = (sound) => {
    general.resyncSound(sound);
    autoSave.acceptSound(sound);
  };
  // The wizard's compact steps: Next submits the form, which saves it.
  // Enter in a number field on the full page lands here too, and is just
  // another change.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    autoSave.submit();
  });
}
