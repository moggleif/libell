/**
 * ☰ menu (Classic appearance only, screen-cleanup follow-up): a flat
 * navigation list — Vehicle, Ramps, Calibration, Level, General (#329) —
 * each opening a full-screen page with a ‹ Back header, the pattern users
 * know from every phone app. The History API is integrated so the Android
 * back button/gesture closes the page, then the drawer, and only then
 * leaves the app.
 *
 * Modern no longer uses this component at all: its gear icon opens
 * `settingsPage.ts` directly (the same five as tabs, no drawer). Help,
 * About, Feedback, Diagnostics and the introduction relaunch live on
 * `infoMenu.ts`'s own page, reached from "?" — and External sensor lives
 * on `sensorPage.ts`'s, reached from the top-right sensor-status icon —
 * both universal, reachable from Classic too.
 *
 * Vehicle/Ramps/Level/General are one settings form: `createSettingsForm`'s
 * `splitPages` option builds the same groups Modern's tabs use and exposes
 * them as `classicPages`; this drawer swaps whichever one is the shared
 * form's mounted content right before showing it (see `showPage` below).
 * Every change is stored as it is made (#328), whichever page it is on.
 * Same reuse principle as Calibration below — one real component,
 * reparented, never a copy; Calibration alone stays fully standalone.
 * The Level page keeps the section id 'targets', which the main screen's
 * target badge opens.
 */
import type { CaptureResult } from '../domain/calibration';
import type { Calibration, LevelSettings, SensorSource, SoundPrefs } from '../domain/settings';
import type { TargetPreset } from '../domain/targetPresets';
import type { ExternalSensorHealth } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import { createSettingsForm, type SettingsFormElement } from './settingsPanel';
import { createCalibrationSection } from './calibrationSection';
import { createElement } from './dom';
import { t, type MessageKey } from './i18n';
import { setVisible } from './motion';

export type MenuSection = 'general' | 'calibration' | 'vehicle' | 'ramps' | 'targets';

export interface MenuOptions {
  initialSettings: LevelSettings;
  /** Open the first-run introduction again — unused by this Classic-only
   * menu now (moved to `infoMenu.ts`), kept here since this options bag
   * is shared with other app-wide consumers. */
  openOnboarding(): void;
  onSettingsSaved(settings: LevelSettings): void;
  /**
   * Visual preset (#104), forwarded to the calibration section — decided
   * once from `initialSettings.appearance` at menu-construction time,
   * same as everywhere else this is threaded through (#109).
   */
  appearance: LevelSettings['appearance'];
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point — see CalibrationOptions. */
  calibrate(anyway?: boolean): CaptureResult;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
  /** The vehicle zero (#83) — see CalibrationOptions. */
  getVehicleCalibration(): Calibration | null;
  calibrateVehicle(anyway?: boolean): CaptureResult;
  /** When each calibration was captured (#87) — null when unknown. */
  getCalibrationCapturedAt(): number | null;
  getVehicleCalibrationCapturedAt(): number | null;
  /** Compare the current reading against a calibration's promise of zero — returns a verdict text. */
  checkCalibration(): string;
  checkVehicleCalibration(): string;
  clearVehicleCalibration(): void;
  /**
   * Whether the vehicle settings have ever been saved — mirrors the
   * topbar warning lamp's own condition. Drives the Modern Settings
   * page's status label ("Not saved", #107); unused in Classic.
   */
  hasSavedSettings(): boolean;
  /** Target presets (#122, ADR 0013) — an intentional non-level target,
   * architecturally distinct from the calibration fields above. */
  getTargetPresets(): TargetPreset[];
  getActiveTargetId(): string | null;
  selectTarget(id: string | null): void;
  addTargetPreset(name: string, anyway?: boolean): CaptureResult;
  deleteTargetPreset(id: string): void;
  /**
   * An external sensor source (#116, ADR 0014) — an opt-in alternative to
   * the phone's own sensor.
   * Unused by this Classic-only menu now (External sensor moved to
   * `sensorPage.ts`); kept here since this options bag is shared.
   */
  getSensorSource(): SensorSource;
  getSensorState(): SensorState;
  connectSensor(): Promise<SensorState>;
  disconnectSensor(): void;
  getHealth(): ExternalSensorHealth | null;
  /**
   * The box's installation offset (#131, ADR 0014). Unused by
   * this Classic-only menu now; kept here since this options bag is
   * shared with `sensorPage.ts`.
   */
  getInstallCalibration(): Calibration | null;
  calibrateInstall(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  getInstallCalibrationCapturedAt(): number | null;
  clearInstallCalibration(): void;
  /**
   * The sensor status page's live reading row (`boxStatusPage.ts`) —
   * the same effective calibration (sensor bias + vehicle zero + active
   * target, #122) the leveling math itself uses. Unused by this
   * Classic-only menu now; kept here since this options bag is shared.
   */
  getCalibratedTilt(): Calibration | null;
  /** The active target preset's name (#122), or null for "Normal". */
  getActiveTargetName(): string | null;
  /** Live soundOnLevel/soundGuidance (#161) — the bottom bar's mute
   * toggle can change these outside this form, so the Settings page
   * resyncs from here every time it (re)opens. */
  getSoundPrefs(): SoundPrefs;
  /** "Share vehicle setup" (R41, #207) — forwarded to the settings form's
   * own `onShareVehicleSetup`, see `settingsPanel.ts`. Optional so
   * existing option fixtures (tests, `infoMenu.ts`'s reused shape) that
   * predate this feature still satisfy the interface. */
  onShareVehicleSetup?(settings: LevelSettings): void;
}

export interface Menu {
  /** The drawer + page containers, appended to the document body. */
  element: HTMLElement;
  open(section: MenuSection): void;
  attach(button: HTMLButtonElement): void;
  /** True while the drawer or a page is showing — the app pauses guidance. */
  isOpen(): boolean;
  /**
   * Redraw the calibration and targets pages if the menu is open — the
   * active sensor changed underneath it, e.g. the box disconnected from its
   * own page, which opens on top of this one (#353).
   */
  refresh(): void;
}

export function createMenu(options: MenuOptions): Menu {
  const drawer = createDrawer();
  const page = createPage();
  const settingsForm = createMenuSettingsForm(options);
  const calibration = createCalibrationSection(options, 'checklist');
  const entries = createEntries(drawer, settingsForm, calibration.element, showPage);
  const view = createMenuView(drawer, page);
  const depth = createMenuHistory(() => view.render(depth.current()));

  function refreshPages(): void {
    calibration.refresh();
    settingsForm.refreshTargetsPage?.();
  }
  // The bottom bar's mute toggle (#161) can change soundOnLevel/
  // soundGuidance while the menu is closed — resync every reopen.
  function refreshBeforeShowing(): void {
    refreshPages();
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
  }
  function showDrawer(): void {
    depth.advanceTo(1);
    refreshBeforeShowing();
    view.render(depth.current());
  }
  function showPage(section: MenuSection): void {
    if (section !== 'calibration') {
      settingsForm.replaceChildren(settingsForm.classicPages![section]);
    }
    depth.advanceTo(2);
    refreshBeforeShowing();
    view.render(depth.current(), entries.get(section));
  }

  wireBackButtons(drawer, page, depth.back);
  return {
    element: wrap(drawer.backdrop, page.element),
    open: showPage,
    isOpen: () => depth.current() > 0,
    refresh() {
      if (depth.current() > 0) refreshPages();
    },
    attach(button) {
      button.addEventListener('click', () => {
        if (depth.current() === 0) showDrawer();
        else depth.back();
      });
    },
  };
}

/** 0 = closed, 1 = the drawer, 2 = a page on top of it. */
type Depth = 0 | 1 | 2;

interface Drawer {
  backdrop: HTMLElement;
  panel: HTMLElement;
  close: HTMLButtonElement;
}

function createDrawer(): Drawer {
  const backdrop = createElement('div', 'menu');
  backdrop.hidden = true;
  const panel = createElement('div', 'menu__drawer');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('menu.title'));

  const header = createElement('div', 'menu__header');
  const title = createElement('span', 'menu__title');
  title.textContent = t('menu.title');
  const close = createElement('button', 'menu__close');
  close.type = 'button';
  close.setAttribute('aria-label', t('menu.close'));
  close.textContent = '✕';
  header.append(title, close);
  panel.append(header);
  backdrop.append(panel);
  return { backdrop, panel, close };
}

interface MenuPage {
  element: HTMLElement;
  back: HTMLButtonElement;
  title: HTMLHeadingElement;
  body: HTMLElement;
}

/** The full-screen page with its ‹ Back header. */
function createPage(): MenuPage {
  const element = createElement('div', 'menu-page');
  element.hidden = true;
  const header = createElement('div', 'menu-page__header');
  const back = createElement('button', 'menu-page__back');
  back.type = 'button';
  back.textContent = '‹';
  const title = createElement('h2', 'menu-page__title');
  title.tabIndex = -1;
  header.append(back, title);
  const body = createElement('div', 'menu-page__body');
  element.append(header, body);
  return { element, back, title, body };
}

/** ✕, ‹ and a tap on the backdrop outside the drawer all go one step back. */
function wireBackButtons(drawer: Drawer, page: MenuPage, back: () => void): void {
  drawer.close.addEventListener('click', back);
  page.back.addEventListener('click', back);
  drawer.backdrop.addEventListener('click', (event) => {
    if (event.target === drawer.backdrop) back();
  });
}

function wrap(...children: HTMLElement[]): HTMLElement {
  const container = document.createElement('div');
  container.append(...children);
  return container;
}

/**
 * Vehicle / Ramps / Level / General: one shared form split into four
 * drawer pages (see the file header comment). Every change is stored as
 * it is made (#328); only ✕/back close the drawer.
 */
function createMenuSettingsForm(options: MenuOptions): SettingsFormElement {
  return createSettingsForm(
    options.initialSettings,
    (settings) => options.onSettingsSaved(settings),
    options,
    { splitPages: true, onShareVehicleSetup: options.onShareVehicleSetup },
    options,
  );
}

interface MenuEntry {
  label: string;
  body: HTMLElement;
  item: HTMLButtonElement;
}

/** The drawer's entries, in Modern's tab order with Calibration third (#329). */
const ENTRY_LABELS: readonly [MenuSection, MessageKey][] = [
  ['vehicle', 'settings.tab.vehicle'],
  ['ramps', 'settings.tab.ramps'],
  ['calibration', 'menu.calibration'],
  ['targets', 'settings.tab.level'],
  ['general', 'settings.general'],
];

/**
 * One drawer item per entry. Calibration is the one page that stays
 * fully standalone, outside the shared settings form (#122, ADR 0013).
 */
function createEntries(
  drawer: Drawer,
  settingsForm: SettingsFormElement,
  calibrationBody: HTMLElement,
  showPage: (section: MenuSection) => void,
): Map<MenuSection, MenuEntry> {
  const entries = new Map<MenuSection, MenuEntry>();
  for (const [section, labelKey] of ENTRY_LABELS) {
    const label = t(labelKey);
    const item = createElement('button', 'menu__item');
    item.type = 'button';
    item.textContent = label;
    item.addEventListener('click', () => showPage(section));
    drawer.panel.append(item);
    const body = section === 'calibration' ? calibrationBody : settingsForm;
    entries.set(section, { label, body, item });
  }
  return entries;
}

/**
 * Shows the drawer and the page for a depth. Opening a page focuses its
 * title; going back to the drawer returns focus to the entry that opened it.
 */
function createMenuView(drawer: Drawer, page: MenuPage) {
  let returnFocus: (() => void) | null = null;
  function showEntry(entry: MenuEntry): void {
    page.title.textContent = entry.label;
    page.body.replaceChildren(entry.body);
    page.title.focus();
    returnFocus = () => entry.item.focus();
  }
  return {
    render(depth: Depth, entry?: MenuEntry): void {
      setVisible(drawer.backdrop, depth > 0);
      setVisible(page.element, depth === 2);
      if (depth === 2 && entry) showEntry(entry);
      if (depth === 1) {
        returnFocus?.();
        returnFocus = null;
      }
    },
  };
}

/**
 * The menu's depth, kept in the browser history so the Android back
 * button/gesture and our own buttons share one code path: every close
 * goes through `history.back()` and lands in `onBack`.
 *
 * Opening a page straight from closed pushes both entries (0 → 1 → 2) but
 * the caller renders only once, at the final depth. setVisible (#105) arms
 * a ~400ms fallback timer on every hide; rendering at the intermediate
 * depth would hide-then-reshow the page in one tick and leave that timer
 * armed to close the page a moment after it opened.
 */
function createMenuHistory(onBack: () => void) {
  let depth: Depth = 0;
  window.addEventListener('popstate', () => {
    if (depth === 0) return;
    depth -= 1;
    onBack();
  });
  return {
    current: (): Depth => depth,
    advanceTo(target: Depth): void {
      while (depth < target) {
        history.pushState({ libellMenu: depth + 1 }, '');
        depth += 1;
      }
    },
    back(): void {
      if (depth > 0) history.back();
    },
  };
}
