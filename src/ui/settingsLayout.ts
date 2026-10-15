/**
 * Where the Settings tabs' elements go: Modern's tab bar, Classic's ☰
 * pages, the wizard's single-topic steps, or one flat page. Decided once,
 * at construction (see `settingsPanel.ts`).
 */
import type { LevelSettings, SoundPrefs } from '../domain/settings';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createElement } from './dom';
import { t, type MessageKey } from './i18n';
import { createSectionHeading } from './settingsFields';
import type { GeneralTab } from './settingsGeneralTab';
import type { LevelTab } from './settingsLevelTab';
import type { RampsTab } from './settingsRampsTab';
import type { VehicleTab } from './settingsVehicleTab';
import { createTargetsSection, type TargetsOptions } from './targetsSection';
import { createVehiclePicker, type VehiclePickerOptions } from './vehiclePicker';

/** The wizard's reduced single-topic steps; see `SettingsFormOptions`. */
export type CompactStep = 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps';

export type TabId = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'general';

/** The hosts behind the embedded calibration, targets and vehicle
 * picker sections. */
export interface Hosts {
  calibration?: CalibrationOptions;
  targets?: TargetsOptions;
  vehicles?: VehiclePickerOptions;
}

/** The vehicle picker above the Vehicle fields (#599), when wired. */
function vehicleElements(tabs: Tabs, vehicles: VehiclePickerOptions | undefined): HTMLElement[] {
  const picker = vehicles ? [createVehiclePicker(vehicles)] : [];
  return [...picker, ...tabs.vehicle.elements()];
}

export interface Tabs {
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
  resyncSoundFields?: (sound: SoundPrefs) => void;
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

/**
 * Places the tabs' elements in the layout this form uses, and returns
 * what relabels the layout's own captions (tab labels, section headings).
 */
export function layOut(
  form: SettingsFormElement,
  tabs: Tabs,
  appearance: LevelSettings['appearance'],
  formOptions: { compact?: CompactStep; splitPages?: boolean } | undefined,
  hosts: Hosts,
): () => void {
  if (formOptions?.compact) {
    form.append(...compactStep(tabs, formOptions.compact));
    return () => {};
  }
  if (appearance === 'modern') return layOutModernTabs(form, tabs, hosts);
  if (formOptions?.splitPages) {
    layOutClassicPages(form, tabs, hosts);
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
function compactStep(tabs: Tabs, compact: CompactStep): HTMLElement[] {
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
  fillModernTabs(bar, tabs, calibration.element, targets.element, hosts.vehicles);

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
  vehicles: VehiclePickerOptions | undefined,
): void {
  bar.addTab('vehicle').append(...vehicleElements(tabs, vehicles));
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
function layOutClassicPages(form: SettingsFormElement, tabs: Tabs, hosts: Hosts): void {
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
  const targets = createTargetsSection(hosts.targets ?? inertTargetsOptions());
  form.refreshTargetsPage = targets.refresh;

  form.classicPages = {
    general: page(...tabs.general.elements()),
    vehicle: page(...vehicleElements(tabs, hosts.vehicles)),
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
