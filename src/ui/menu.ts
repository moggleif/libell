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
import { t, type MessageKey } from './i18n';
import { flipCalibration } from '../domain/calibration';
import {
  calibrationIllustration,
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';

export type MenuSection = 'settings' | 'calibration' | 'feedback' | 'help';

export interface MenuOptions {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point. Returns an error text, or null on success. */
  calibrate(): string | null;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
}

export interface Menu {
  /** The drawer + page containers, appended to the document body. */
  element: HTMLElement;
  open(section: MenuSection): void;
  attach(button: HTMLButtonElement): void;
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
    backdrop.hidden = depth === 0;
    page.hidden = depth < 2;
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

  function showPage(section: MenuSection): void {
    if (depth === 0) showDrawer();
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

  // --- Settings ---
  const settingsBody = document.createElement('div');
  settingsBody.append(createSettingsForm(options.initialSettings, options.onSettingsSaved));
  addSection('settings', t('menu.settings'), settingsBody);

  // --- Calibration (one-shot + flip) ---
  const calibrationBody = document.createElement('div');
  const calibrationIntro = document.createElement('p');
  calibrationIntro.className = 'menu__text';
  calibrationIntro.textContent = t('calibration.intro');
  const calibrationStatus = document.createElement('p');
  calibrationStatus.className = 'menu__text menu__text--status';
  const calibrateButton = document.createElement('button');
  calibrateButton.type = 'button';
  calibrateButton.className = 'menu__action';
  calibrateButton.textContent = t('calibration.now');
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'menu__action menu__action--secondary';
  clearButton.textContent = t('calibration.clear');

  function refreshCalibration(error?: string): void {
    const calibration = options.getCalibration();
    if (error) {
      calibrationStatus.textContent = error;
    } else if (calibration) {
      calibrationStatus.textContent = t('calibration.status', {
        roll: calibration.rollDeg.toFixed(1),
        pitch: calibration.pitchDeg.toFixed(1),
      });
    } else {
      calibrationStatus.textContent = t('calibration.status.none');
    }
    // Grayed out when there is nothing to clear.
    clearButton.disabled = !calibration;
  }
  calibrateButton.addEventListener('click', () => {
    refreshCalibration(options.calibrate() ?? undefined);
  });
  clearButton.addEventListener('click', () => {
    options.clearCalibration();
    refreshCalibration();
  });

  // Flip calibration: two captures with a 180° turn in between — works
  // on any reasonably flat spot, no known-level surface needed (#50).
  const flipIntro = document.createElement('p');
  flipIntro.className = 'menu__text';
  flipIntro.textContent = t('calibration.flip.intro');
  const flipStatus = document.createElement('p');
  flipStatus.className = 'menu__text menu__text--status';
  const flipButton = document.createElement('button');
  flipButton.type = 'button';
  flipButton.className = 'menu__action menu__action--secondary';
  let flipFirst: Calibration | null = null;

  function resetFlip(): void {
    flipFirst = null;
    flipButton.textContent = t('calibration.flip.start');
    flipStatus.textContent = '';
  }
  flipButton.addEventListener('click', () => {
    const reading = options.readTilt();
    if (typeof reading === 'string') {
      flipStatus.textContent = reading;
      return;
    }
    if (!flipFirst) {
      flipFirst = reading;
      flipButton.textContent = t('calibration.flip.capture');
      flipStatus.textContent = t('calibration.flip.rotate');
      return;
    }
    const result = flipCalibration(flipFirst, reading);
    if (!result.consistent) {
      resetFlip();
      flipStatus.textContent = t('calibration.flip.err.moved');
      return;
    }
    options.applyCalibration(result.bias);
    resetFlip();
    const surfaceMax = Math.max(
      Math.abs(result.surface.rollDeg),
      Math.abs(result.surface.pitchDeg),
    );
    flipStatus.textContent = t('calibration.flip.done', { surface: surfaceMax.toFixed(1) });
    refreshCalibration();
  });
  resetFlip();
  refreshCalibration();
  calibrationBody.append(
    calibrationIntro,
    calibrationStatus,
    calibrateButton,
    flipIntro,
    flipButton,
    flipStatus,
    clearButton,
  );
  addSection('calibration', t('menu.calibration'), calibrationBody);

  // --- Feedback ---
  addSection('feedback', t('menu.feedback'), createFeedbackSection());

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

  return {
    element: container,
    open(section) {
      showPage(section);
    },
    attach(button) {
      button.addEventListener('click', () => {
        if (depth === 0) showDrawer();
        else goBack();
      });
    },
  };
}
