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
  // `options` (MenuOptions) carries every field CalibrationOptions needs —
  // passed through so Modern mode's embedded Kalibrering tab (#108) talks
  // to the real sensor, not a stand-in.
  settingsBody.append(
    createSettingsForm(options.initialSettings, options.onSettingsSaved, options),
  );
  addSection('settings', t('menu.settings'), settingsBody);

  // --- Calibration (one-shot + flip) ---
  const calibrationSection = createCalibrationSection(options);
  const refreshCalibration = calibrationSection.refresh;
  addSection('calibration', t('menu.calibration'), calibrationSection.element);

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

  // --- Reopen the introduction ---
  const introItem = document.createElement('button');
  introItem.type = 'button';
  introItem.className = 'menu__item';
  introItem.textContent = t('menu.intro');
  introItem.addEventListener('click', () => {
    goBack();
    options.openOnboarding();
  });
  drawer.append(introItem);

  // --- Feedback and About (bottom — reached rarely) ---
  addSection('feedback', t('menu.feedback'), createFeedbackSection());
  addSection('about', t('menu.about'), createAboutSection());

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
