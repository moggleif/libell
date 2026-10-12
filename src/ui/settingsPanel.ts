/**
 * The Settings form: Vehicle, Ramps, Calibration, Level and General, each
 * built by its own tab module, sharing one state. Values are entered and
 * shown in the chosen unit; storage and math stay mm. Every change is
 * stored as it is made, with a "Saved · Undo" toast; the wizard's compact
 * steps save on Next instead.
 *
 * This file owns what the tabs share: the form state, how a change is
 * stored and undone, how an unusable number is reported, and which layout
 * the tabs are placed in. Modern shows them as tabs, Classic's ☰
 * menu as separate pages (`splitPages`), the wizard as single-topic
 * steps (`compact`), and anything else as one flat page.
 *
 * Which structure to build is decided once, from `initial.appearance`, at
 * construction time. Changing Appearance reloads the app rather than
 * restructuring the open form (see `settingsGeneralTab.ts`).
 */
import { DEFAULT_SETTINGS, measurementsDiffer, type LevelSettings } from '../domain/settings';
import { parseSettings } from '../domain/settingsParsing';
import { saveSettings, markMeasurementsSaved, loadSettings } from '../data/settingsStore';
import { showActionToast } from './toast';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createTargetsSection, type TargetsOptions } from './targetsSection';
import { createElement } from './dom';
import { t, type MessageKey } from './i18n';
import {
  createSectionHeading,
  fromUnit,
  type DisplayUnit,
  type NumberField,
  type RawSettings,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { createVehicleTab, type VehicleTab } from './settingsVehicleTab';
import { createRampsTab, type RampsTab } from './settingsRampsTab';
import { createLevelTab, type LevelTab } from './settingsLevelTab';
import { createGeneralTab, type GeneralTab, type GeneralTabActions } from './settingsGeneralTab';

type TabId = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'general';

/** The hosts behind the embedded calibration and targets sections. */
interface Hosts {
  calibration?: CalibrationOptions;
  targets?: TargetsOptions;
}

interface Tabs {
  vehicle: VehicleTab;
  ramps: RampsTab;
  level: LevelTab;
  general: GeneralTab;
}

/**
 * When no calibration host is wired — a standalone harness, or a unit test
 * building a Modern-mode form directly — the tab still renders with an
 * inert stand-in rather than throwing.
 */
function inertCalibrationOptions(): CalibrationOptions {
  return {
    // Only ever used from the Modern calibration tab.
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

/** Same fallback role as `inertCalibrationOptions`, for the targets. */
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
 * The `select*Tab` shortcuts are Modern only (Classic has no tabs): they
 * jump to a tab of this same live instance instead of mounting a second,
 * independent section.
 */
export type SettingsFormElement = HTMLFormElement & {
  selectCalibrationTab?: () => void;
  /** The Level tab, which holds the saved targets. */
  selectTargetsTab?: () => void;
  /** Any tab by id — Help's topic buttons. */
  selectTab?: (id: TabId) => void;
  /**
   * Resync the sound checkboxes (and the stored baseline for just those two
   * fields) from a value changed outside this form — the bottom bar's mute
   * toggle. Not a change of its own: the value is already stored, so
   * nothing is saved and no toast shows.
   */
  resyncSoundFields?: (sound: Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>) => void;
  /**
   * The four bodies the Classic ☰ drawer navigates between, sharing this
   * one form's state; the menu mounts one as this form's child right before
   * showing it. Undefined unless `splitPages` was requested.
   */
  classicPages?: {
    general: HTMLElement;
    vehicle: HTMLElement;
    ramps: HTMLElement;
    targets: HTMLElement;
  };
  /**
   * Refreshes the targets section in `classicPages.targets` — the preset
   * list can change from outside this form, so the menu calls this every
   * time it (re)opens. Undefined unless `splitPages` was requested.
   */
  refreshTargetsPage?: () => void;
  /**
   * Redraws the tab on screen from the host's current state (Modern only):
   * the calibration and targets tabs read the sensor and presets, which
   * change while Settings is closed — e.g. a box disconnected from its own
   * page. The Settings page calls this every time it (re)opens.
   */
  refreshOpenTab?: () => void;
};

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
  compact?: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps';
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
  const hosts = { calibration: calibrationOptions, targets: targetsOptions };
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

/** Reading the tabs' fields as settings, and showing settings in them. */
interface FormValues {
  numberFields: NumberField[];
  /** Rewrites every caption, after the unit or the vehicle changed. */
  relabelAll(): void;
  /** Relabels, then shows each number field's value, skipping undefined. */
  showNumbers(valueOf: (field: NumberField) => number | undefined): void;
  /** Re-renders every length in the unit just chosen, so nothing is lost. */
  showInNewUnit(previous: DisplayUnit): void;
  current(): LevelSettings;
  /** Fill every field from the given settings, with live theme preview. */
  populate(settings: LevelSettings): void;
  showRampSteps(stepsMm: number[]): void;
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
        const mm = fromUnit(field.control.valueAsNumber, previous);
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

/**
 * A number the user typed that cannot be used: empty, zero or
 * negative. Never refused silently and never replaced by a factory
 * default: the field goes back to the value in effect, and one line
 * under it says what was wrong, until the next change.
 */
function createInvalidNumberReport(numberFields: NumberField[]): {
  restore(inEffect: LevelSettings): void;
} {
  const errors = new Map<HTMLElement, HTMLParagraphElement>();
  function showError(field: HTMLElement, message: string | null): void {
    let error = errors.get(field);
    if (!message) {
      if (error) error.hidden = true;
      return;
    }
    if (!error) {
      error = createElement('p', 'settings__hint settings__error');
      error.setAttribute('role', 'alert');
      errors.set(field, error);
    }
    error.textContent = message;
    error.hidden = false;
    field.after(error);
  }
  return {
    /** Puts the value in effect back into every unusable number field. */
    restore(inEffect) {
      for (const field of numberFields) {
        const usable = field.isUsable();
        const message = field.allowZero ? 'settings.err.notNegative' : 'settings.err.positive';
        showError(field.element, usable ? null : t(message));
        if (!usable) field.show(inEffect[field.key]);
      }
    },
  };
}

interface AutoSave {
  saved(): LevelSettings;
  /** Stores the form's values at once; a no-op in a wizard step. */
  changed(): void;
  /** The wizard step's Next, or Enter in a number field on the full page. */
  submit(): void;
  /** A sound preference already stored elsewhere — not a change of its own. */
  acceptSound(sound: Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>): void;
}

/**
 * Every change is stored at once: there is no Save button and no
 * "unsaved" state to lose by closing the page. A toast offers to undo
 * it. The wizard's compact steps are the exception — they are saved by
 * their own Next, which submits this form.
 */
function createAutoSave(
  values: FormValues,
  initial: LevelSettings,
  compact: SettingsFormOptions['compact'],
  onSave: (settings: LevelSettings) => void,
): AutoSave {
  const invalidNumbers = createInvalidNumberReport(values.numberFields);
  const store = createSettingsStore(initial, compact, onSave);
  const saved = store.saved;
  const persist = store.persist;
  let undoToast: HTMLElement | null = null;

  function offerUndo(previous: LevelSettings): void {
    undoToast?.remove();
    undoToast = showActionToast(t('settings.saved'), t('settings.undo'), () => {
      values.populate(previous);
      invalidNumbers.restore(saved());
      persist(values.current());
    });
  }
  function changed(): void {
    if (compact) return;
    invalidNumbers.restore(saved());
    const next = values.current();
    if (sameFormValues(next, saved())) return;
    const previous = saved();
    // What parseSettings settled on (e.g. a motion delay clamped to the
    // rest delay) is what the fields show.
    for (const field of values.numberFields) field.show(next[field.key]);
    persist(next);
    offerUndo(previous);
  }
  return {
    saved,
    changed,
    submit() {
      if (!compact) {
        changed();
        return;
      }
      const settings = values.current();
      for (const field of values.numberFields) field.show(settings[field.key]);
      values.showRampSteps(settings.rampStepHeightsMm);
      persist(settings);
    },
    acceptSound: store.acceptSound,
  };
}

/** What was last stored, and storing the next settings. */
function createSettingsStore(
  initial: LevelSettings,
  compact: SettingsFormOptions['compact'],
  onSave: (settings: LevelSettings) => void,
): Pick<AutoSave, 'saved' | 'acceptSound'> & { persist(settings: LevelSettings): void } {
  let saved = initial;
  return {
    saved: () => saved,
    persist(settings) {
      // The ⚠ Setup lamp goes out with the measurements, not with any save:
      // a changed measurement, or the wizard's measurements step
      // confirmed with Next even if the values shown were kept.
      if (compact === 'measurements' || measurementsDiffer(saved, settings)) {
        markMeasurementsSaved();
      }
      saveSettings(settings);
      saved = settings;
      onSave(settings);
    },
    acceptSound(sound) {
      saved = { ...saved, soundOnLevel: sound.soundOnLevel, soundGuidance: sound.soundGuidance };
    },
  };
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

/** Only what this form edits — see `currentSettings` above. */
function sameFormValues(a: LevelSettings, b: LevelSettings): boolean {
  const formValues = ({ sensorSource, sensorDevices, ...rest }: LevelSettings): string => {
    void sensorSource;
    void sensorDevices;
    return JSON.stringify(rest);
  };
  return formValues(a) === formValues(b);
}

/**
 * Places the tabs' elements in the layout this form uses, and returns
 * what relabels the layout's own captions (tab labels, section headings).
 */
function layOut(
  form: SettingsFormElement,
  tabs: Tabs,
  appearance: LevelSettings['appearance'],
  formOptions: SettingsFormOptions | undefined,
  hosts: Hosts,
): () => void {
  if (formOptions?.compact) {
    form.append(...compactStep(tabs, formOptions.compact));
    return () => {};
  }
  if (appearance === 'modern') return layOutModernTabs(form, tabs, hosts);
  if (formOptions?.splitPages) {
    layOutClassicPages(form, tabs, hosts.targets);
    return () => {};
  }
  return layOutFlatPage(form, tabs);
}

/**
 * The wizard's reduced, single-topic steps — each just its own subset of
 * the same field elements the full form builds, never a duplicate. A
 * step already has its own Next/Skip/Back, and Next submits this form
 * directly: it is the step's only save.
 */
function compactStep(
  tabs: Tabs,
  compact: NonNullable<SettingsFormOptions['compact']>,
): HTMLElement[] {
  switch (compact) {
    // No tabs, no vehicle type or axle.
    case 'measurements':
      return [tabs.vehicle.measureHint, ...tabs.vehicle.measurements.map((m) => m.element)];
    // Still reloads immediately on change, same as Settings.
    case 'language':
      return [tabs.general.languageField];
    // Still live-previews on change, same as Settings.
    case 'appearance':
      return tabs.general.lookElements();
    case 'sound':
      return tabs.general.soundElements();
    // The ramps tab still hides the ramp count and its hints for a
    // caravan (it ramps one wheel), exactly as on the full form.
    case 'ramps':
      return [tabs.ramps.rampHint, tabs.ramps.stepsField, tabs.ramps.rampCountField];
  }
}

/**
 * Modern: tabs in the order a new owner sets things up in — the vehicle,
 * its ramps, calibration, what counts as level — with the app-wide
 * preferences last. Opens on Vehicle.
 */
function layOutModernTabs(form: SettingsFormElement, tabs: Tabs, hosts: Hosts): () => void {
  // The calibration and targets tabs are redrawn whenever they are shown,
  // since the form is built once, not on every open.
  const calibration = createCalibrationSection(
    hosts.calibration ?? inertCalibrationOptions(),
    'checklist',
  );
  const targets = createTargetsSection(hosts.targets ?? inertTargetsOptions());
  let openTab: TabId = 'vehicle';
  const bar = createTabBar(selectTab);
  fillModernTabs(bar, tabs, calibration.element, targets.element);

  function selectTab(id: TabId): void {
    openTab = id;
    bar.select(id);
    if (id === 'calibration') calibration.refresh();
    if (id === 'targets') targets.refresh();
  }
  form.selectCalibrationTab = () => selectTab('calibration');
  form.selectTargetsTab = () => selectTab('targets');
  form.selectTab = selectTab;
  form.refreshOpenTab = () => selectTab(openTab);

  form.append(bar.element, ...bar.panels.values());
  selectTab('vehicle');
  return bar.relabel;
}

/** Each tab's caption. */
const TAB_LABELS: Record<TabId, MessageKey> = {
  vehicle: 'settings.tab.vehicle',
  ramps: 'settings.tab.ramps',
  calibration: 'menu.calibration',
  targets: 'settings.tab.level',
  general: 'settings.general',
};

interface TabBar {
  element: HTMLElement;
  panels: Map<TabId, HTMLElement>;
  /** Adds a tab button and returns its (empty) panel. */
  addTab(id: TabId, panelClass?: string): HTMLElement;
  /** Marks one tab selected and shows only its panel. */
  select(id: TabId): void;
  relabel(): void;
}

function createTabBar(onClick: (id: TabId) => void): TabBar {
  const element = createElement('div', 'settings__tabs');
  element.setAttribute('role', 'tablist');
  const buttons = new Map<TabId, HTMLButtonElement>();
  const panels = new Map<TabId, HTMLElement>();
  return {
    element,
    panels,
    addTab(id, panelClass = 'settings__tabpanel') {
      const button = createElement('button', 'settings__tab');
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.dataset.tab = id;
      button.addEventListener('click', () => onClick(id));
      element.append(button);
      buttons.set(id, button);
      const panel = createElement('div', panelClass);
      // Mirrors the tab buttons' dataset.tab — lets callers (and tests)
      // find a panel by id instead of by DOM position.
      panel.dataset.tab = id;
      panels.set(id, panel);
      return panel;
    },
    select(id) {
      for (const [tid, button] of buttons) button.setAttribute('aria-selected', String(tid === id));
      for (const [tid, panel] of panels) panel.hidden = tid !== id;
    },
    relabel() {
      for (const [id, button] of buttons) button.textContent = t(TAB_LABELS[id]);
    },
  };
}

/** The calibration section is the same one the menu uses standalone. */
function fillModernTabs(
  bar: TabBar,
  tabs: Tabs,
  calibration: HTMLElement,
  targets: HTMLElement,
): void {
  bar.addTab('vehicle').append(...tabs.vehicle.elements());
  // The same page Classic's ☰ → Ramps shows.
  tabs.ramps.buildPage(bar.addTab('ramps', 'settings__tabpanel settings__tabpanel--klossar'));
  bar.addTab('calibration').append(calibration);
  // The Level tab. Its id stays 'targets' — the main screen's target badge
  // opens it through `selectTargetsTab`.
  bar.addTab('targets').append(...tabs.level.elements(targets));
  bar.addTab('general').append(...tabs.general.elements());
}

/**
 * Classic's ☰ pages: Modern's tab groups as drawer pages over one shared
 * `<form>`/state; the menu mounts whichever body it shows. Calibration
 * stays its own page outside this form.
 */
function layOutClassicPages(
  form: SettingsFormElement,
  tabs: Tabs,
  targetsOptions: TargetsOptions | undefined,
): void {
  const page = (...children: HTMLElement[]): HTMLElement => {
    const body = document.createElement('div');
    body.append(...children);
    return body;
  };
  // The same Ramps page as Modern's tab, not the wizard's select.
  const ramps = createElement('div', 'settings__tabpanel--klossar');
  tabs.ramps.buildPage(ramps);

  // One real `createTargetsSection` component, not a copy, below
  // Tolerance and Drain side.
  const targets = createTargetsSection(targetsOptions ?? inertTargetsOptions());
  form.refreshTargetsPage = targets.refresh;

  form.classicPages = {
    general: page(...tabs.general.elements()),
    vehicle: page(...tabs.vehicle.elements()),
    ramps,
    targets: page(...tabs.level.elements(targets.element)),
  };
  form.append(form.classicPages.vehicle);
}

/**
 * Classic as one flat page, in the same groups as the tabs. No screen in
 * the app shows it — the ☰ menu uses the split pages — so it keeps the
 * compact ramp select and leaves out the saved targets, which need a host.
 */
function layOutFlatPage(form: SettingsFormElement, tabs: Tabs): () => void {
  const vehicleHeading = createSectionHeading();
  const rampsHeading = createSectionHeading();
  const levelHeading = createSectionHeading();
  const generalHeading = createSectionHeading();
  form.append(
    vehicleHeading,
    ...tabs.vehicle.elements(),
    rampsHeading,
    tabs.ramps.stepsField,
    tabs.ramps.rampCountField,
    tabs.ramps.rampHint,
    levelHeading,
    ...tabs.level.fieldElements(),
    generalHeading,
    ...tabs.general.elements(),
  );
  return () => {
    vehicleHeading.textContent = t('settings.section.vehicle');
    rampsHeading.textContent = t('settings.section.ramps');
    levelHeading.textContent = t('settings.tab.level');
    generalHeading.textContent = t('settings.general');
  };
}
