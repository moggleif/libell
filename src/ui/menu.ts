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
import type { Calibration, LevelSettings, SensorSource, SoundPrefs } from '../domain/settings';
import type { TargetPreset } from '../domain/targetPresets';
import type { GravityVector } from '../domain/leveling';
import type { ExternalSensorHealth } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import { createSettingsForm, type SettingsFormElement } from './settingsPanel';
import { createCalibrationSection } from './calibrationSection';
import { t } from './i18n';
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
  /** Capture the current tilt as the phone's zero point. Returns an error text, or null on success. */
  calibrate(): string | null;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
  /** The vehicle zero (#83) — see CalibrationOptions. */
  getVehicleCalibration(): Calibration | null;
  calibrateVehicle(): string | null;
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
  addTargetPreset(name: string): string | null;
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
   * The EasyLevel box's installation offset (#131, ADR 0014). Unused by
   * this Classic-only menu now; kept here since this options bag is
   * shared with `sensorPage.ts`.
   */
  getInstallCalibration(): Calibration | null;
  calibrateInstall(): string | null | Promise<string | null>;
  getInstallCalibrationCapturedAt(): number | null;
  checkInstallCalibration(): string;
  clearInstallCalibration(): void;
  /**
   * The sensor status page's live reading row (`easyLevelStatusPage.ts`) —
   * the same effective calibration (sensor bias + vehicle zero + active
   * target, #122) the leveling math itself uses. Unused by this
   * Classic-only menu now; kept here since this options bag is shared.
   */
  getCalibratedTilt(): Calibration | null;
  /** The active target preset's name (#122), or null for "Normal". */
  getActiveTargetName(): string | null;
  /**
   * EasyLevel-only debug info (`easyLevelStatusPage.ts`'s "Debug info"
   * disclosure) — raw values straight off the box, for troubleshooting a
   * box that isn't behaving as expected. Unused by this Classic-only menu
   * now; kept here since this options bag is shared.
   */
  getEasyLevelDeviceId(): string | null;
  getEasyLevelLastSampleAt(): number | null;
  getEasyLevelRawAccel(): GravityVector | null;
  getEasyLevelStatusBytes(): Uint8Array | null;
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
}

export function createMenu(options: MenuOptions): Menu {
  const container = document.createElement('div');

  // --- Navigation drawer ---
  const backdrop = document.createElement('div');
  backdrop.className = 'menu';
  backdrop.hidden = true;
  const drawer = document.createElement('div');
  drawer.className = 'menu__drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', t('menu.title'));

  const header = document.createElement('div');
  header.className = 'menu__header';
  const title = document.createElement('span');
  title.className = 'menu__title';
  title.textContent = t('menu.title');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'menu__close';
  close.setAttribute('aria-label', t('menu.close'));
  close.textContent = '✕';
  header.append(title, close);
  drawer.append(header);
  backdrop.append(drawer);

  // --- Full-screen page ---
  const page = document.createElement('div');
  page.className = 'menu-page';
  page.hidden = true;
  const pageHeader = document.createElement('div');
  pageHeader.className = 'menu-page__header';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'menu-page__back';
  back.textContent = '‹';
  const pageTitle = document.createElement('h2');
  pageTitle.className = 'menu-page__title';
  pageTitle.tabIndex = -1;
  pageHeader.append(back, pageTitle);
  const pageBody = document.createElement('div');
  pageBody.className = 'menu-page__body';
  page.append(pageHeader, pageBody);

  container.append(backdrop, page);

  // --- Section registry ---
  const sections = new Map<
    MenuSection,
    { label: string; body: HTMLElement; item: HTMLButtonElement }
  >();
  let onPageClosed: (() => void) | null = null;

  function addSection(id: MenuSection, label: string, body: HTMLElement): void {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'menu__item';
    item.textContent = label;
    item.addEventListener('click', () => showPage(id));
    drawer.append(item);
    sections.set(id, { label, body, item });
  }

  // --- History-integrated open/close state ---
  // depth 0 = closed, 1 = drawer, 2 = page. UI closes go through
  // history.back() so the browser/Android back gesture and our buttons
  // share one code path.
  let depth = 0;

  function render(section?: MenuSection): void {
    setVisible(backdrop, depth > 0);
    setVisible(page, depth === 2);
    if (depth === 2 && section) {
      const entry = sections.get(section);
      if (entry) {
        pageTitle.textContent = entry.label;
        pageBody.replaceChildren(entry.body);
        pageTitle.focus();
        onPageClosed = () => entry.item.focus();
      }
    }
    if (depth === 1) {
      onPageClosed?.();
      onPageClosed = null;
    }
  }

  function showDrawer(): void {
    if (depth === 0) {
      history.pushState({ libellMenu: 1 }, '');
      depth = 1;
    }
    refreshCalibration();
    settingsForm.refreshTargetsPage?.();
    // The bottom bar's mute toggle (#161) can change soundOnLevel/
    // soundGuidance while the menu is closed — resync every reopen.
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
    render();
  }

  // Opening a page straight from closed (depth 0 -> 2) advances depth in
  // one step and calls render() exactly once at the final depth — not via
  // showDrawer() then again here. setVisible (#105) arms a ~400ms fallback
  // timer on every hide call; calling render() at the intermediate depth 1
  // would hide-then-immediately-reshow `page` in the same tick, leaving
  // that stale timer armed to forcibly close the page a moment after it
  // opened. Two pushState calls still land (0->1->2), so back/gesture
  // behavior is unchanged.
  function showPage(section: MenuSection): void {
    // General/Vehicle/Ramps/Targets share one settingsForm instance (see
    // the file header comment) — swap its mounted content to the
    // requested page before it's shown, same as Modern's own tab switch.
    if (
      section === 'general' ||
      section === 'vehicle' ||
      section === 'ramps' ||
      section === 'targets'
    ) {
      settingsForm.replaceChildren(settingsForm.classicPages![section]);
    }
    if (depth === 0) {
      history.pushState({ libellMenu: 1 }, '');
      depth = 1;
    }
    if (depth === 1) {
      history.pushState({ libellMenu: 2 }, '');
      depth = 2;
    }
    refreshCalibration();
    settingsForm.refreshTargetsPage?.();
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
    render(section);
  }

  window.addEventListener('popstate', () => {
    if (depth > 0) {
      depth -= 1;
      render();
    }
  });

  const goBack = () => {
    if (depth > 0) history.back();
  };

  close.addEventListener('click', goBack);
  back.addEventListener('click', goBack);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) goBack();
  });

  // --- Settings: Vehicle / Ramps / Level / General, one shared form
  // split into four drawer pages (see the file header comment) — order
  // matches Modern's tabs, with Calibration third (#329).
  const settingsForm: SettingsFormElement = createSettingsForm(
    options.initialSettings,
    // Every change is stored as it is made (#328); only ✕/back close the
    // drawer.
    (settings) => {
      options.onSettingsSaved(settings);
    },
    options,
    { splitPages: true, onShareVehicleSetup: options.onShareVehicleSetup },
    options,
  );
  addSection('vehicle', t('settings.tab.vehicle'), settingsForm);
  addSection('ramps', t('settings.tab.ramps'), settingsForm);

  // --- Calibration (one-shot + flip) — the one page that stays fully
  // standalone, outside the shared settingsForm (#122, ADR 0013 above).
  // As a two-step checklist (#330), same as Modern's tab.
  const calibrationSection = createCalibrationSection(options, 'checklist');
  const refreshCalibration = calibrationSection.refresh;
  addSection('calibration', t('menu.calibration'), calibrationSection.element);

  addSection('targets', t('settings.tab.level'), settingsForm);
  addSection('general', t('settings.general'), settingsForm);

  return {
    element: container,
    open(section) {
      showPage(section);
    },
    isOpen() {
      return depth > 0;
    },
    attach(button) {
      button.addEventListener('click', () => {
        if (depth === 0) showDrawer();
        else goBack();
      });
    },
  };
}
