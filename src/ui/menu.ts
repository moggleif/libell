/**
 * Hamburger menu: a standard top-right ☰ button opening a drawer with
 * Settings, Calibration and Help sections (one open at a time), closed by
 * the ✕ button or a tap on the backdrop.
 */
import type { Calibration, LevelSettings } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';
import { createFeedbackSection } from './feedback';
import { t, type MessageKey } from './i18n';
import { flipCalibration } from '../domain/calibration';

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
  /** The drawer + backdrop, appended to the document body. */
  element: HTMLElement;
  open(section: MenuSection): void;
  attach(button: HTMLButtonElement): void;
}

const HELP_SECTIONS: [MessageKey, MessageKey][] = [
  ['help.what.h', 'help.what.t'],
  ['help.first.h', 'help.first.t'],
  ['help.screen.h', 'help.screen.t'],
  ['help.settings.h', 'help.settings.t'],
  ['help.calibration.h', 'help.calibration.t'],
  ['help.notes.h', 'help.notes.t'],
];

export function createMenu(options: MenuOptions): Menu {
  const backdrop = document.createElement('div');
  backdrop.className = 'menu';
  backdrop.hidden = true;

  const drawer = document.createElement('div');
  drawer.className = 'menu__drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'Menu');

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

  const sections = new Map<MenuSection, { toggle: HTMLButtonElement; body: HTMLElement }>();

  function addSection(id: MenuSection, label: string, body: HTMLElement): void {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'menu__item';
    toggle.textContent = label;
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.add('menu__section');
    body.hidden = true;
    toggle.addEventListener('click', () => {
      const isOpen = !body.hidden;
      for (const { toggle: t, body: b } of sections.values()) {
        b.hidden = true;
        t.setAttribute('aria-expanded', 'false');
      }
      if (!isOpen) {
        body.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    drawer.append(toggle, body);
    sections.set(id, { toggle, body });
  }

  // --- Settings ---
  const settingsBody = document.createElement('div');
  settingsBody.append(createSettingsForm(options.initialSettings, options.onSettingsSaved));
  addSection('settings', t('menu.settings'), settingsBody);

  // --- Calibration ---
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

  function renderCalibrationStatus(error?: string): void {
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
    renderCalibrationStatus(options.calibrate() ?? undefined);
  });
  clearButton.addEventListener('click', () => {
    options.clearCalibration();
    renderCalibrationStatus();
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
    renderCalibrationStatus();
  });
  resetFlip();

  renderCalibrationStatus();
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

  // --- Help ---
  const helpBody = document.createElement('div');
  for (const [heading, text] of HELP_SECTIONS) {
    const h = document.createElement('h2');
    h.className = 'menu__heading';
    h.textContent = t(heading);
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = t(text);
    helpBody.append(h, p);
  }
  addSection('help', t('menu.help'), helpBody);

  backdrop.append(drawer);

  const hide = () => {
    backdrop.hidden = true;
  };
  close.addEventListener('click', hide);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) hide();
  });

  function open(section: MenuSection): void {
    backdrop.hidden = false;
    renderCalibrationStatus();
    for (const [id, { toggle, body }] of sections) {
      const active = id === section;
      body.hidden = !active;
      toggle.setAttribute('aria-expanded', String(active));
    }
  }

  return {
    element: backdrop,
    open,
    attach(button) {
      button.addEventListener('click', () => {
        if (backdrop.hidden) {
          backdrop.hidden = false;
          renderCalibrationStatus();
        } else {
          hide();
        }
      });
    },
  };
}
