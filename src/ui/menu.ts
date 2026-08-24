/**
 * App menu (issue #53): the ☰ button opens a navigation list; each item
 * opens a full-screen page with a ‹ Back header — the pattern users know
 * from every phone app, instead of accordions inside a drawer. The
 * History API is integrated so the Android back button/gesture closes
 * the page, then the menu, and only then leaves the app.
 */
import type { Calibration, LevelSettings } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';
import { createFeedbackSection } from './feedback';
import { createAboutSection } from './about';
import { createCalibrationSection } from './calibrationSection';
import { t, type MessageKey } from './i18n';
import { setVisible } from './motion';
import {
  calibrationIllustration,
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';

export type MenuSection = 'settings' | 'calibration' | 'feedback' | 'help' | 'about';

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
  const othersHeading = document.createElement('p');
  othersHeading.className = 'menu__others-heading';
  othersHeading.textContent = t('menu.others');
  const othersList = document.createElement('div');
  othersList.className = 'menu__others-list';
  const versionFooter = document.createElement('p');
  versionFooter.className = 'menu__version';
  if (__APP_VERSION__) versionFooter.textContent = `v${__APP_VERSION__}`;
  if (isModern) {
    drawer.append(primaryList, othersHeading, othersList, versionFooter);
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

  /** A bottom-of-list section (Modern: a plain "ÖVRIGT" row; Classic:
   * the same item style as everything else — feedback/about, #107). */
  function addOtherSection(id: MenuSection, label: string, body: HTMLElement): void {
    const item = addOtherItem(label, () => showPage(id));
    sections.set(id, { label, body, item });
  }

  /** A bottom-of-list action with no page of its own (the introduction
   * relaunch — Modern: a plain "ÖVRIGT" row; Classic: same item style
   * as everything else). */
  function addOtherItem(label: string, onClick: () => void): HTMLButtonElement {
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
    othersList.append(item);
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
    refreshModernCards();
    render();
  }

  function showPage(section: MenuSection): void {
    if (depth === 0) showDrawer();
    if (depth === 1) {
      history.pushState({ libellMenu: 2 }, '');
      depth = 2;
    }
    refreshCalibration();
    refreshModernCards();
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

  // Order mirrors the setup flow (and the warning lamps): measurements,
  // then the one-time phone calibration, then help, with the meta items
  // (introduction, feedback, about) at the bottom.

  // --- Settings ---
  const settingsBody = document.createElement('div');
  settingsBody.append(createSettingsForm(options.initialSettings, options.onSettingsSaved));
  addSection('settings', t('menu.settings'), settingsBody, {
    isPending: () => !options.hasSavedSettings(),
    text: t('menu.card.notSaved'),
  });

  // --- Calibration (one-shot + flip) ---
  const calibrationSection = createCalibrationSection(options);
  const refreshCalibration = calibrationSection.refresh;
  addSection('calibration', t('menu.calibration'), calibrationSection.element, {
    isPending: () => options.getCalibration() === null && options.getVehicleCalibration() === null,
    text: t('menu.card.notDone'),
  });

  // --- Help: illustration-first, short captions (#54) ---
  const HELP: {
    h: MessageKey;
    text: MessageKey;
    illustration?: (label: string) => SVGSVGElement;
  }[] = [
    { h: 'help.what.h', text: 'help.what.t', illustration: placementIllustration },
    { h: 'help.first.h', text: 'help.first.t' },
    { h: 'help.screen.h', text: 'help.screen.t', illustration: legendIllustration },
    { h: 'help.settings.h', text: 'help.settings.t', illustration: measuresIllustration },
    { h: 'help.calibration.h', text: 'help.calibration.t', illustration: calibrationIllustration },
    { h: 'help.notes.h', text: 'help.notes.t' },
  ];
  const helpBody = document.createElement('div');
  for (const { h, text, illustration } of HELP) {
    const heading = document.createElement('h3');
    heading.className = 'menu__heading';
    heading.textContent = t(h);
    helpBody.append(heading);
    if (illustration) helpBody.append(illustration(t(h)));
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = t(text);
    helpBody.append(p);
  }
  addSection('help', t('menu.help'), helpBody);

  // --- Reopen the introduction, feedback, about (bottom — reached
  // rarely; Modern groups these under an "ÖVRIGT" heading as plain
  // rows instead of cards, #107) ---
  addOtherItem(t('menu.intro'), () => {
    goBack();
    options.openOnboarding();
  });
  addOtherSection('feedback', t('menu.feedback'), createFeedbackSection());
  addOtherSection('about', t('menu.about'), createAboutSection());

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
