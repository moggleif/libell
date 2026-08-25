/**
 * App menu (issue #53): the ☰ button opens a navigation list; each item
 * opens a full-screen page with a ‹ Back header — the pattern users know
 * from every phone app, instead of accordions inside a drawer. The
 * History API is integrated so the Android back button/gesture closes
 * the page, then the menu, and only then leaves the app.
 */
import type { Calibration, LevelSettings, SensorSource, SoundPrefs } from '../domain/settings';
import type { TargetPreset } from '../domain/targetPresets';
import type { EasyLevelStatus } from '../sensor/easyLevelProtocol';
import type { SensorState } from '../sensor/orientation';
import { isWebBluetoothSupported } from '../sensor/easyLevelSensor';
import { createSettingsForm, type SettingsFormElement } from './settingsPanel';
import { createCalibrationSection } from './calibrationSection';
import { createTargetsSection } from './targetsSection';
import { createSensorSourceSection } from './sensorSourceSection';
import { createDiagnosticsSection } from './diagnosticsSection';
import { t } from './i18n';
import { setVisible } from './motion';

export type MenuSection = 'settings' | 'calibration' | 'targets' | 'sensorSource' | 'diagnostics';

export interface MenuOptions {
  initialSettings: LevelSettings;
  /** Open the first-run introduction again. */
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
   * topbar warning lamp's own condition. Drives the Modern menu's
   * Settings card status label ("Not saved", #107); unused in Classic.
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
   * EasyLevel BLE box (#116, ADR 0014) — an opt-in second `sensorSource`.
   * The menu page itself is only ever added when `isWebBluetoothSupported()`
   * is true (see below), so these are only wired up where they can work.
   */
  getSensorSource(): SensorSource;
  /** The active sensor's current state (#129) — see `SensorSourceOptions`. */
  getSensorState(): SensorState;
  connectEasyLevel(): Promise<SensorState>;
  disconnectEasyLevel(): void;
  /** `faf52c22-...` parsed into battery/temperature/firmware-tier (#123) —
   * see `SensorSourceOptions`/`DiagnosticsOptions`; shared by both the
   * "External sensor" and "Diagnostics" pages. */
  getEasyLevelStatus(): EasyLevelStatus | null;
  /**
   * The EasyLevel box's installation offset (#131, ADR 0014) — see
   * `SensorSourceOptions`. Its own independent stored value: never the
   * phone's `getVehicleCalibration()` above.
   */
  getInstallCalibration(): Calibration | null;
  calibrateInstall(): string | null;
  getInstallCalibrationCapturedAt(): number | null;
  checkInstallCalibration(): string;
  clearInstallCalibration(): void;
  /**
   * Diagnostics page (#133, R36) — development/support detail, reached
   * only from this menu, never during normal leveling. Shares
   * `getSensorSource`/`getSensorState` above; these four are the fields
   * nothing else in the menu already exposes.
   */
  getLastSampleAt(): number | null;
  /** Raw (uncalibrated) roll/pitch, or null before the first sample. */
  getRawTilt(): Calibration | null;
  /** Calibrated roll/pitch (sensor bias + vehicle zero + active target),
   * or null before the first sample. */
  getCalibratedTilt(): Calibration | null;
  /** The active target preset's name (#122), or null for "Normal". */
  getActiveTargetName(): string | null;
  /** Live soundOnLevel/soundGuidance (#161) — the bottom bar's mute
   * toggle can change these outside this form, so the Settings page
   * resyncs from here every time the menu (re)opens. */
  getSoundPrefs(): SoundPrefs;
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
  // Which structure the top-level list renders — decided once at
  // construction from the settings available then, same rule as every
  // other appearance-branching component (rvDiagram, settingsPanel,
  // calibrationSection, onboarding): never re-evaluated live (#107).
  const isModern = options.appearance === 'modern';

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

  // --- Modern-only containers (#107): a fullscreen card list instead
  // of Classic's flat item stack. Built either way so addSection() and
  // the others-row helper below have somewhere to append; simply never
  // attached to the drawer when Classic. ---
  const primaryList = document.createElement('div');
  primaryList.className = 'menu__primary-list';
  // Advanced (#152): optional, behavior-changing features (External
  // sensor, Targets) — split from the one-off meta items below so
  // scanning the menu tells the two kinds of item apart. Same row style
  // and heading class as "OTHER", just a second group above it.
  const advancedHeading = document.createElement('p');
  advancedHeading.className = 'menu__others-heading';
  advancedHeading.textContent = t('menu.advanced');
  const advancedList = document.createElement('div');
  advancedList.className = 'menu__others-list';
  const othersHeading = document.createElement('p');
  othersHeading.className = 'menu__others-heading';
  othersHeading.textContent = t('menu.others');
  const othersList = document.createElement('div');
  othersList.className = 'menu__others-list';
  const versionFooter = document.createElement('p');
  versionFooter.className = 'menu__version';
  if (__APP_VERSION__) versionFooter.textContent = `v${__APP_VERSION__}`;
  if (isModern) {
    drawer.append(
      primaryList,
      advancedHeading,
      advancedList,
      othersHeading,
      othersList,
      versionFooter,
    );
  }

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

  /** A primary section's pending status (#107): the Modern card's dot
   * lights `--warning` and shows `text` while `isPending()` is true. */
  interface SectionStatus {
    isPending(): boolean;
    text: string;
  }
  const cardRefreshers: (() => void)[] = [];

  function buildModernCard(
    id: MenuSection,
    label: string,
    status?: SectionStatus,
  ): HTMLButtonElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'menu__card';
    item.addEventListener('click', () => showPage(id));

    const dot = document.createElement('span');
    dot.className = 'menu__card-dot';
    dot.setAttribute('aria-hidden', 'true');

    const titleEl = document.createElement('span');
    titleEl.className = 'menu__card-title';
    titleEl.textContent = label;

    const statusEl = document.createElement('span');
    statusEl.className = 'menu__card-status';

    const chevron = document.createElement('span');
    chevron.className = 'menu__card-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';

    item.append(dot, titleEl, statusEl, chevron);
    primaryList.append(item);

    if (status) {
      cardRefreshers.push(() => {
        const pending = status.isPending();
        dot.classList.toggle('menu__card-dot--pending', pending);
        statusEl.textContent = pending ? status.text : '';
      });
    }
    return item;
  }

  function addSection(
    id: MenuSection,
    label: string,
    body: HTMLElement,
    status?: SectionStatus,
  ): void {
    let item: HTMLButtonElement;
    if (isModern) {
      item = buildModernCard(id, label, status);
    } else {
      item = document.createElement('button');
      item.type = 'button';
      item.className = 'menu__item';
      item.textContent = label;
      item.addEventListener('click', () => showPage(id));
      drawer.append(item);
    }
    sections.set(id, { label, body, item });
  }

  /** Which row group an item/section belongs to in Modern (#152) — Classic
   * ignores this entirely, since it has no headings at all (still one
   * flat, unheaded item list, exactly as before this issue). */
  type OtherGroup = 'advanced' | 'other';

  /** A bottom-of-list section (Modern: a plain row under "Advanced" or
   * "OTHER"; Classic: the same item style as everything else —
   * feedback/about, #107). */
  function addOtherSection(
    id: MenuSection,
    label: string,
    body: HTMLElement,
    group: OtherGroup = 'other',
  ): void {
    const item = addOtherItem(label, () => showPage(id), group);
    sections.set(id, { label, body, item });
  }

  /** A bottom-of-list action with no page of its own (the introduction
   * relaunch — Modern: a plain row under "Advanced" or "OTHER"; Classic:
   * same item style as everything else). */
  function addOtherItem(
    label: string,
    onClick: () => void,
    group: OtherGroup = 'other',
  ): HTMLButtonElement {
    if (!isModern) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'menu__item';
      item.textContent = label;
      item.addEventListener('click', onClick);
      drawer.append(item);
      return item;
    }
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'menu__row';
    const text = document.createElement('span');
    text.className = 'menu__row-title';
    text.textContent = label;
    const chevron = document.createElement('span');
    chevron.className = 'menu__row-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    item.append(text, chevron);
    item.addEventListener('click', onClick);
    (group === 'advanced' ? advancedList : othersList).append(item);
    return item;
  }

  function refreshModernCards(): void {
    for (const refresh of cardRefreshers) refresh();
  }

  // --- History-integrated open/close state ---
  // depth 0 = closed, 1 = drawer, 2 = page. UI closes go through
  // history.back() so the browser/Android back gesture and our buttons
  // share one code path.
  let depth = 0;
  // Set right before a script-driven multi-step history.go() jump (#159),
  // so the one popstate that jump produces on arrival doesn't also run
  // the regular single-step-back handling below — the closing code has
  // already applied the closed state itself.
  let suppressNextPopstate = false;

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
    refreshTargets();
    refreshSensorSource();
    refreshDiagnostics();
    refreshModernCards();
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
    if (depth === 0) {
      history.pushState({ libellMenu: 1 }, '');
      depth = 1;
    }
    if (depth === 1) {
      history.pushState({ libellMenu: 2 }, '');
      depth = 2;
    }
    refreshCalibration();
    refreshTargets();
    refreshSensorSource();
    refreshDiagnostics();
    refreshModernCards();
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
    // Modern's Calibration/Targets entries are shortcuts into Settings
    // (#155, screen-cleanup follow-up) — jump its shared instance to the
    // matching tab every time either is opened.
    if (section === 'calibration') settingsForm.selectCalibrationTab?.();
    if (section === 'targets') settingsForm.selectTargetsTab?.();
    render(section);
  }

  window.addEventListener('popstate', () => {
    if (suppressNextPopstate) {
      suppressNextPopstate = false;
      return;
    }
    if (depth > 0) {
      depth -= 1;
      render();
    }
  });

  const goBack = () => {
    if (depth > 0) history.back();
  };

  /** Return all the way to the main level screen (#159) — a successful
   * Save reached via ☰ → Settings, from any depth. Unlike `goBack()`
   * (one step, shared with the physical back gesture), this jumps
   * straight to closed: the app's own state closes immediately, and the
   * matching number of history entries this menu pushed to get here are
   * unwound in the same script-driven step, so a later physical back
   * press still lands exactly where it would have before this shortcut. */
  const closeAll = () => {
    const stepsBack = depth;
    depth = 0;
    render();
    if (stepsBack > 0) {
      suppressNextPopstate = true;
      history.go(-stepsBack);
    }
  };
  close.addEventListener('click', goBack);
  back.addEventListener('click', goBack);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) goBack();
  });

  // Order mirrors the setup flow (and the warning lamps): measurements,
  // then the one-time phone calibration, then help, with the meta items
  // (introduction, feedback, about) at the bottom.

  // --- Settings ---
  const settingsBody = document.createElement('div');
  // `options` (MenuOptions) carries every field CalibrationOptions needs —
  // passed through so Modern mode's embedded Kalibrering tab (#108) talks
  // to the real sensor, not a stand-in.
  const settingsForm: SettingsFormElement = createSettingsForm(
    options.initialSettings,
    // Return to the main screen after a successful Save reached via ☰
    // (#159) — scoped to this menu-context wrapper alone, so onboarding's
    // own direct createSettingsForm call (its own Skip/Next flow) is
    // completely unaffected. Applies to the Settings page as a whole,
    // regardless of which Modern tab (Vehicle/Ramps/Kalibrering) Save was
    // tapped from, since they all share this one form instance.
    (settings) => {
      options.onSettingsSaved(settings);
      closeAll();
    },
    options,
    undefined,
    options,
  );
  settingsBody.append(settingsForm);
  addSection('settings', t('menu.settings'), settingsBody, {
    isPending: () => !options.hasSavedSettings(),
    text: t('menu.card.notSaved'),
  });

  // --- Calibration (one-shot + flip) ---
  // Modern (#155): a shortcut into Settings' own Kalibrering tab — the same
  // live component instance embedded there (settingsForm.selectCalibrationTab),
  // never a second independent createCalibrationSection render. Classic has
  // no tabs, so it keeps its own standalone page exactly as before.
  let refreshCalibration: (error?: string) => void = () => {};
  if (isModern) {
    addSection('calibration', t('menu.calibration'), settingsBody, {
      isPending: () =>
        options.getCalibration() === null && options.getVehicleCalibration() === null,
      text: t('menu.card.notDone'),
    });
  } else {
    const calibrationSection = createCalibrationSection(options);
    refreshCalibration = calibrationSection.refresh;
    addSection('calibration', t('menu.calibration'), calibrationSection.element, {
      isPending: () =>
        options.getCalibration() === null && options.getVehicleCalibration() === null,
      text: t('menu.card.notDone'),
    });
  }

  // Help/About/Feedback (screen-cleanup follow-up): no longer part of this
  // menu at all — they live on their own page, reached directly from the
  // bottom bar's "?" button (see `infoMenu.ts`). Folding them into this
  // menu's own drawer/page navigation used to let its back button pop
  // through to reveal this Settings drawer underneath by mistake — a
  // fully independent page has no such shared state to leak into.

  // --- Advanced (#152): optional, behavior-changing features — External
  // sensor first, then Targets — split from the meta items below (Modern
  // only; Classic stays one flat, unheaded list, exactly as before).
  //
  // EasyLevel BLE box (#116): omitted entirely — never a silently broken
  // option — on a browser without Web Bluetooth (Safari/iOS, most desktop
  // browsers). Decided once here, matching the `isModern` pattern: no live
  // re-check if the browser somehow changed mid-session.
  const easyLevelSupported = isWebBluetoothSupported();
  const sensorSourceSection = easyLevelSupported ? createSensorSourceSection(options) : null;
  const refreshSensorSource = sensorSourceSection?.refresh ?? (() => {});
  if (sensorSourceSection) {
    addOtherSection(
      'sensorSource',
      t('menu.sensorSource'),
      sensorSourceSection.element,
      'advanced',
    );
  }
  // Targets (#122, ADR 0013): an intentional non-level target, on top of
  // the zero point set up above — never a third block inside Calibration
  // (it's a *target*, not a calibration). The main-screen badge
  // (`targetBadge.ts`) jumps straight to it once a target is active.
  //
  // Modern (screen-cleanup follow-up): folded into Settings as a 4th tab
  // (settingsPanel.ts), same shortcut pattern as Calibration above — never
  // a second independent createTargetsSection render. Classic has no
  // tabs, so it keeps its own standalone page exactly as before.
  let refreshTargets: () => void = () => {};
  if (isModern) {
    addSection('targets', t('menu.targets'), settingsBody);
  } else {
    const targetsSection = createTargetsSection(options);
    refreshTargets = targetsSection.refresh;
    addOtherSection('targets', t('menu.targets'), targetsSection.element, 'advanced');
  }

  // --- OTHER (reached rarely; Modern groups these under an "ÖVRIGT"
  // heading as plain rows instead of cards, #107) ---
  addOtherItem(t('menu.intro'), () => {
    goBack();
    options.openOnboarding();
  });
  // Diagnostics (#133, R36): dev/support detail — deliberately grouped
  // with the other rarely-tapped "OTHER" items, never a primary Modern
  // card (this page is explicitly not part of first-run setup).
  const diagnosticsSection = createDiagnosticsSection(options);
  const refreshDiagnostics = diagnosticsSection.refresh;
  addOtherSection('diagnostics', t('menu.diagnostics'), diagnosticsSection.element);

  // ADVANCED now only ever holds External sensor (screen-cleanup
  // follow-up: Targets moved into the Settings tabs above) — never show
  // its heading over an empty list on a browser without Web Bluetooth.
  if (isModern) {
    const advancedEmpty = advancedList.children.length === 0;
    advancedHeading.hidden = advancedEmpty;
    advancedList.hidden = advancedEmpty;
  }

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
        if (depth > 0) {
          // Modern's gear icon jumps two levels in one tap below (drawer
          // + Settings page) — undo both in one tap here too, so the SAME
          // button always toggles fully open <-> fully closed, never
          // stopping halfway on the drawer. Classic only ever opens one
          // level via this button, so goBack() alone is still correct.
          if (isModern) closeAll();
          else goBack();
          return;
        }
        // Modern (screen-cleanup follow-up): the gear icon jumps straight
        // to the Settings tabs — Vehicle/Ramps/Kalibrering/Targets are all
        // one tap away with no intermediate list to click through first.
        // The drawer (External sensor, Diagnostics, Show introduction) is
        // still exactly one ‹ back-tap away from there, same as it always
        // was one tap from the drawer to any page — this just changes
        // which end of that hop happens first. Classic has no tabs to
        // land on, so it keeps opening the drawer first, as ever.
        if (isModern) showPage('settings');
        else showDrawer();
      });
    },
  };
}
