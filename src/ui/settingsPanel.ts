/**
 * The Settings form (#325): Vehicle, Ramps, Calibration, Level and General
 * (#329), each built by its own tab module, sharing one state. Values are
 * entered and shown in the chosen unit; storage and math stay mm. Every
 * change is stored as it is made, with a "Saved · Undo" toast (#328); the
 * wizard's compact steps save on Next instead.
 *
 * This file owns what the tabs share: the form state, how a change is
 * stored and undone, how an unusable number is reported, and which layout
 * the tabs are placed in. Modern (#108) shows them as tabs, Classic's ☰
 * menu as separate pages (`splitPages`), the wizard as single-topic
 * steps (`compact`), and anything else as one flat page.
 *
 * Which structure to build is decided once, from `initial.appearance`, at
 * construction time — same pattern as `rearAxle` deciding wheel-pair
 * markers in `rvDiagram.ts`. Changing Appearance reloads the app rather
 * than restructuring the open form (see `settingsGeneralTab.ts`).
 */
import {
  DEFAULT_SETTINGS,
  measurementsDiffer,
  parseSettings,
  type LevelSettings,
} from '../domain/settings';
import { saveSettings, markMeasurementsSaved, loadSettings } from '../data/settingsStore';
import { showActionToast } from './toast';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createTargetsSection, type TargetsOptions } from './targetsSection';
import { t, type MessageKey } from './i18n';
import {
  createSectionHeading,
  fromUnit,
  type DisplayUnit,
  type RawSettings,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { createVehicleTab, type VehicleTab } from './settingsVehicleTab';
import { createRampsTab, type RampsTab } from './settingsRampsTab';
import { createLevelTab, type LevelTab } from './settingsLevelTab';
import { createGeneralTab, type GeneralTab } from './settingsGeneralTab';

type TabId = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'general';

interface Tabs {
  vehicle: VehicleTab;
  ramps: RampsTab;
  level: LevelTab;
  general: GeneralTab;
}

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
  /** Any tab by id (#326, Help's topic buttons) — Modern only, like the two above. */
  selectTab?: (id: TabId) => void;
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
   * `<select>` + chip editor the flat Classic page uses, not the Ramps
   * page's brand-filtered catalogue — proportionate to a reduced first-run
   * step either way. Drain position stays on the Level tab, reachable from
   * Settings afterward, same as Tolerance/Stability.
   *
   * Any way, everything not listed above (Vehicle type, Rear axle,
   * Tolerance, Stability, Show lengths in, Drain position — including
   * General › More, not just collapsed but absent) stays
   * reachable from ☰ → Settings afterward.
   */
  compact?: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps';
  /**
   * Classic split pages (screen-cleanup follow-up): render Classic's
   * fields as four navigable bodies — General / Vehicle / Ramps / Level,
   * exposed as `classicPages` on the returned form — instead of one long
   * flat page, mirroring Modern's tab split (#108, #329) now
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

  const state: SettingsFormState = {
    unit: initial.displayUnit,
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const context: SettingsFormContext = {
    state,
    compact: compact !== undefined,
    changed: () => notifyChanged(),
    relabelAll: () => relabelAll(),
    currentSettings: () => currentSettings(),
  };

  const tabs: Tabs = {
    vehicle: createVehicleTab(initial, context, (settings) =>
      formOptions?.onShareVehicleSetup?.(settings),
    ),
    ramps: createRampsTab(initial, context),
    level: createLevelTab(initial, context),
    general: createGeneralTab(initial, context, {
      unitChanged: (previous) => showInNewUnit(previous),
      resetAll: () => {
        populate({ ...DEFAULT_SETTINGS, appearance: saved.appearance });
        notifyChanged();
      },
    }),
  };
  const numberFields = [
    ...tabs.vehicle.measurements,
    tabs.level.tolerance,
    ...tabs.general.fineTuning,
  ];

  // Decided once, at construction — see the file header comment.
  const relabelLayout = layOut(
    form,
    tabs,
    compact,
    formOptions?.splitPages,
    { calibration: calibrationOptions, targets: targetsOptions },
    initial.appearance,
  );

  function relabelAll(): void {
    for (const field of numberFields) field.relabel();
    tabs.vehicle.relabel();
    tabs.ramps.relabel();
    tabs.level.relabel();
    tabs.general.relabel();
    relabelLayout();
  }
  relabelAll();
  for (const field of numberFields) field.show(initial[field.key]);
  tabs.ramps.render();

  /** Re-renders every length in the unit just chosen, so nothing is lost. */
  function showInNewUnit(previous: DisplayUnit): void {
    const lengths = numberFields
      .filter((field) => field.inUnit)
      .map((field) => [field, fromUnit(field.control.valueAsNumber, previous)] as const);
    relabelAll();
    for (const [field, mm] of lengths) if (Number.isFinite(mm)) field.show(mm);
    tabs.ramps.render();
    notifyChanged();
  }

  // parseSettings guards against empty/invalid fields the same way it
  // guards against corrupt storage. Fields this form does not edit (the
  // sensor source and its device settings) come from what is stored now,
  // not from `initial`: they change while the form is open, and a save
  // from here must never put back an older sensor choice (#328 — with
  // every edit now saved at once, that would happen on any tap).
  function currentSettings(): LevelSettings {
    const stored = loadSettings();
    const raw: RawSettings = {
      sensorSource: stored.sensorSource,
      sensorDevices: stored.sensorDevices,
    };
    tabs.vehicle.read(raw);
    tabs.ramps.read(raw);
    tabs.level.read(raw);
    tabs.general.read(raw);
    for (const field of numberFields) raw[field.key] = field.read();
    return parseSettings(raw);
  }

  /** Fill every field from the given settings, with live theme preview. */
  function populate(settings: LevelSettings): void {
    state.unit = settings.displayUnit;
    state.vehicle = settings.vehicleType;
    state.axle = settings.rearAxle;
    tabs.vehicle.populate(settings);
    tabs.ramps.populate(settings);
    tabs.level.populate(settings);
    tabs.general.populate(settings);
    relabelAll();
    for (const field of numberFields) field.show(settings[field.key]);
    tabs.ramps.render();
  }

  // --- A number the user typed that cannot be used (#328): empty, zero or
  // negative. Never refused silently and never replaced by a factory
  // default: the field goes back to the value in effect, and one line
  // under it says what was wrong, until the next change.
  const fieldErrors = new Map<HTMLElement, HTMLParagraphElement>();
  function showFieldError(field: HTMLElement, message: string | null): void {
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
  }
  /** Puts the value in effect back into every unusable number field. */
  function restoreInvalidNumbers(): void {
    for (const field of numberFields) {
      const usable = field.isUsable();
      const message = field.allowZero ? 'settings.err.notNegative' : 'settings.err.positive';
      showFieldError(field.element, usable ? null : t(message));
      if (!usable) field.show(saved[field.key]);
    }
  }

  let saved = initial;
  let undoToast: HTMLElement | null = null;
  function persist(settings: LevelSettings): void {
    // The ⚠ Setup lamp goes out with the measurements, not with any save
    // (#364): a changed measurement, or the wizard's measurements step
    // confirmed with Next even if the values shown were kept.
    if (compact === 'measurements' || measurementsDiffer(saved, settings)) markMeasurementsSaved();
    saveSettings(settings);
    saved = settings;
    onSave(settings);
  }
  /**
   * Every change is stored at once (#328): there is no Save button and no
   * "unsaved" state to lose by closing the page. A toast offers to undo
   * it. The wizard's compact steps are the exception — they are saved by
   * their own Next, which submits this form (see the submit handler).
   */
  function notifyChanged(): void {
    if (compact) return;
    restoreInvalidNumbers();
    const next = currentSettings();
    if (sameFormValues(next, saved)) return;
    const previous = saved;
    // What parseSettings settled on (e.g. a motion delay clamped to the
    // rest delay) is what the fields show.
    for (const field of numberFields) field.show(next[field.key]);
    persist(next);
    undoToast?.remove();
    undoToast = showActionToast(t('settings.saved'), t('settings.undo'), () => {
      populate(previous);
      restoreInvalidNumbers();
      persist(currentSettings());
    });
  }
  // Selects and switches report a change at once; a number field when the
  // user leaves it or presses Enter, so a half-typed value is never saved.
  form.addEventListener('change', notifyChanged);

  form.resyncSoundFields = (sound) => {
    tabs.general.resyncSound(sound);
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
    for (const field of numberFields) field.show(settings[field.key]);
    tabs.ramps.showSteps(settings.rampStepHeightsMm);
    persist(settings);
  });

  return form;
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
  compact: SettingsFormOptions['compact'],
  splitPages: boolean | undefined,
  hosts: { calibration?: CalibrationOptions; targets?: TargetsOptions },
  appearance: LevelSettings['appearance'],
): () => void {
  if (compact) {
    form.append(...compactStep(tabs, compact));
    return () => {};
  }
  if (appearance === 'modern') return layOutModernTabs(form, tabs, hosts);
  if (splitPages) {
    layOutClassicPages(form, tabs, hosts.targets);
    return () => {};
  }
  return layOutFlatPage(form, tabs);
}

/**
 * The wizard's reduced, single-topic steps — each just its own subset of
 * the same field elements the full form builds, never a duplicate. A
 * step already has its own Next/Skip/Back, and Next submits this form
 * directly: it is the step's only save (#328 left the wizard that way).
 */
function compactStep(
  tabs: Tabs,
  compact: NonNullable<SettingsFormOptions['compact']>,
): HTMLElement[] {
  switch (compact) {
    // #156: no tabs, no vehicle type or axle. A short note pointing to ☰
    // is added by onboarding.ts itself, next to this form.
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
 * Modern (#108): tabs instead of one long page, in the order a new owner
 * sets things up in (#329) — the vehicle, its ramps, calibration, what
 * counts as level — with the app-wide preferences last. Opens on Vehicle.
 */
function layOutModernTabs(
  form: SettingsFormElement,
  tabs: Tabs,
  hosts: { calibration?: CalibrationOptions; targets?: TargetsOptions },
): () => void {
  const tabsBar = document.createElement('div');
  tabsBar.className = 'settings__tabs';
  tabsBar.setAttribute('role', 'tablist');

  const buttons = new Map<TabId, HTMLButtonElement>();
  const panels = new Map<TabId, HTMLElement>();
  const addTab = (id: TabId, panelClass = 'settings__tabpanel'): HTMLElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings__tab';
    button.setAttribute('role', 'tab');
    button.dataset.tab = id;
    button.addEventListener('click', () => selectTab(id));
    tabsBar.append(button);
    buttons.set(id, button);
    const panel = document.createElement('div');
    panel.className = panelClass;
    // Mirrors the tab buttons' dataset.tab — lets callers (and tests) find
    // a panel by id instead of by DOM position.
    panel.dataset.tab = id;
    panels.set(id, panel);
    return panel;
  };

  const vehiclePanel = addTab('vehicle');
  vehiclePanel.append(...tabs.vehicle.elements());

  // The same page Classic's ☰ → Ramps shows (#331).
  const rampsPanel = addTab('ramps', 'settings__tabpanel settings__tabpanel--klossar');
  tabs.ramps.buildPage(rampsPanel);

  // The same calibration section the menu uses standalone (#109), as a
  // two-step checklist (#330). Refreshed whenever the tab is shown, since
  // the form is built once, not on every open.
  const calibration = createCalibrationSection(
    hosts.calibration ?? inertCalibrationOptions(),
    'checklist',
  );
  addTab('calibration').append(calibration.element);

  // The Level tab (#329). Its id stays 'targets' — the main screen's
  // target badge opens it through `selectTargetsTab`.
  const targets = createTargetsSection(hosts.targets ?? inertTargetsOptions());
  addTab('targets').append(...tabs.level.elements(targets.element));

  addTab('general').append(...tabs.general.elements());

  let openTab: TabId = 'vehicle';
  function selectTab(id: TabId): void {
    openTab = id;
    for (const [tid, button] of buttons) button.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of panels) panel.hidden = tid !== id;
    if (id === 'calibration') calibration.refresh();
    if (id === 'targets') targets.refresh();
  }
  form.selectCalibrationTab = () => selectTab('calibration');
  form.selectTargetsTab = () => selectTab('targets');
  form.selectTab = selectTab;
  form.refreshOpenTab = () => selectTab(openTab);

  form.append(tabsBar, ...panels.values());
  selectTab('vehicle');

  const labels: Record<TabId, MessageKey> = {
    vehicle: 'settings.tab.vehicle',
    ramps: 'settings.tab.ramps',
    calibration: 'menu.calibration',
    targets: 'settings.tab.level',
    general: 'settings.general',
  };
  return () => {
    for (const [id, button] of buttons) button.textContent = t(labels[id]);
  };
}

/**
 * Classic's ☰ pages (screen-cleanup follow-up): the same groups as
 * Modern's tabs (#329), as drawer pages — Classic has no tab bar. One
 * shared `<form>`/state underneath: the menu swaps whichever body is this
 * form's mounted child, and every change is stored as it is made (#328),
 * whichever page it is on. Calibration stays its own page outside this
 * form.
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
  // The same Ramps page as Modern's tab (#331), not the wizard's select.
  const ramps = document.createElement('div');
  ramps.className = 'settings__tabpanel--klossar';
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
 * Classic as one flat page, in the same groups as the tabs (#329). No
 * screen in the app shows it any more — the ☰ menu always uses the split
 * pages — so it keeps the compact ramp select rather than the Ramps page
 * (#331), and leaves out the saved targets, which need a host.
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
