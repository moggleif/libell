/**
 * Hamburger menu: a standard top-right ☰ button opening a drawer with
 * Settings, Calibration and Help sections (one open at a time), closed by
 * the ✕ button or a tap on the backdrop.
 */
import type { Calibration, LevelSettings } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';

export type MenuSection = 'settings' | 'calibration' | 'help';

export interface MenuOptions {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point. Returns an error text, or null on success. */
  calibrate(): string | null;
  clearCalibration(): void;
}

export interface Menu {
  /** The drawer + backdrop, appended to the document body. */
  element: HTMLElement;
  open(section: MenuSection): void;
  attach(button: HTMLButtonElement): void;
}

const HELP_TEXT: [string, string][] = [
  [
    'What LevelMate does',
    'Lay your phone flat inside the RV with the top edge pointing toward the front. ' +
      'The diagram shows your RV from above: green wheels are fine, orange wheels need ' +
      'raising, and red means even your tallest ramp step is not enough. Above each ' +
      'wheel you see the ramp step to drive up onto; below it the height it is missing. ' +
      'The bubble in the middle works like a spirit level — center it and you are done.',
  ],
  [
    'Settings',
    'Wheelbase is the distance between the front and rear axle. Track width is the ' +
      'distance between the left and right wheels — front and rear can differ. Ramp ' +
      'step heights are the heights of your leveling ramp steps in mm, separated by ' +
      'semicolons (e.g. 20; 40; 60). Tolerance is how many degrees of tilt still ' +
      'count as level. Stability is how much a reading must change (in mm) before ' +
      'the display updates — raise it if numbers or colors flicker, set 0 to turn ' +
      'it off.',
  ],
  [
    'Calibration',
    'Phones and cases are rarely perfectly flat. Put the phone on a surface you know ' +
      'is level and tap "Calibrate now" — that tilt becomes the zero point for all ' +
      'measurements. Clear it to go back to the raw sensor.',
  ],
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
  title.textContent = 'Menu';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'menu__close';
  close.setAttribute('aria-label', 'Close menu');
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
  addSection('settings', 'Settings', settingsBody);

  // --- Calibration ---
  const calibrationBody = document.createElement('div');
  const calibrationIntro = document.createElement('p');
  calibrationIntro.className = 'menu__text';
  calibrationIntro.textContent =
    'Put the phone on a surface you know is level, then tap Calibrate now. ' +
    'The current tilt becomes the zero point.';
  const calibrationStatus = document.createElement('p');
  calibrationStatus.className = 'menu__text menu__text--status';
  const calibrateButton = document.createElement('button');
  calibrateButton.type = 'button';
  calibrateButton.className = 'menu__action';
  calibrateButton.textContent = 'Calibrate now';
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'menu__action menu__action--secondary';
  clearButton.textContent = 'Clear calibration';

  function renderCalibrationStatus(error?: string): void {
    const calibration = options.getCalibration();
    if (error) {
      calibrationStatus.textContent = error;
    } else if (calibration) {
      calibrationStatus.textContent =
        `Calibrated: side/side ${calibration.rollDeg.toFixed(1)}°, ` +
        `front/back ${calibration.pitchDeg.toFixed(1)}°.`;
    } else {
      calibrationStatus.textContent = 'Not calibrated — using the raw sensor.';
    }
    clearButton.hidden = !calibration;
  }
  calibrateButton.addEventListener('click', () => {
    renderCalibrationStatus(options.calibrate() ?? undefined);
  });
  clearButton.addEventListener('click', () => {
    options.clearCalibration();
    renderCalibrationStatus();
  });
  renderCalibrationStatus();
  calibrationBody.append(calibrationIntro, calibrationStatus, calibrateButton, clearButton);
  addSection('calibration', 'Calibration', calibrationBody);

  // --- Help ---
  const helpBody = document.createElement('div');
  for (const [heading, text] of HELP_TEXT) {
    const h = document.createElement('h2');
    h.className = 'menu__heading';
    h.textContent = heading;
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = text;
    helpBody.append(h, p);
  }
  addSection('help', 'Help', helpBody);

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
