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
    'What Libell does',
    'Libell helps you park your motorhome level, using nothing but your phone. ' +
      'Lay the phone flat inside the vehicle — on the table or the floor — with the ' +
      'top of the phone pointing toward the front of the vehicle. The screen then ' +
      'shows your motorhome from above, and each wheel tells you what to do.',
  ],
  [
    'Before the first use',
    'Two things, both under the ☰ menu, and the app reminds you with yellow warning ' +
      'signs in the top bar until they are done. 1) Open Settings and fill in your ' +
      "vehicle's measurements and the step heights of your leveling ramps — the " +
      'numbers are usually in the vehicle papers, or measure with a tape measure. ' +
      '2) Calibrate the phone (see below). You only do this once; everything is ' +
      'remembered.',
  ],
  [
    'Reading the screen',
    'Green wheel: leave it alone, it is fine. Orange wheel: drive that wheel up on ' +
      'a ramp — the text above the wheel says which step to stop on (for example ' +
      '"↑ 40 mm"), and the number below says how much the wheel is missing. Red ' +
      'wheel: even your highest ramp step is not enough — do not bother driving up; ' +
      'move the vehicle to a flatter spot instead. The round bubble in the middle ' +
      'works like an ordinary spirit level: when the dot rests in the middle and ' +
      'everything is green, the app says "Your RV is level!" — then you are done.',
  ],
  [
    'The settings, one by one',
    'Wheelbase: the distance from the front wheels to the rear wheels, in cm. ' +
      'Track width front / rear: the distance between the left and right wheel on ' +
      'each axle, in cm — they may differ, so there is one field for each. ' +
      'Ramp step heights: your leveling ramps are like small staircases; write the ' +
      'height of every step in mm with semicolons between, for example 20; 40; 60. ' +
      'Tolerance: how many mm lower a wheel may stand than the highest wheel and ' +
      'still count as level — smaller number, stricter leveling. ' +
      'Stability: keeps the numbers calm when the phone lies still; raise it if ' +
      'anything flickers. The defaults are fine to start with.',
  ],
  [
    'Calibration',
    'No phone is perfectly flat — the case, a screen protector or the phone itself ' +
      'adds a small tilt. To cancel it: put the phone on a surface you know is ' +
      'level (check with a spirit level if unsure), open ☰ → Calibration and tap ' +
      '"Calibrate now". From then on that position counts as perfectly flat. ' +
      '"Clear calibration" undoes it.',
  ],
  [
    'Good to know',
    'The app works completely without internet once it has been opened — a campsite ' +
      'without signal is no problem. Add it to your home screen to use it like an ' +
      'ordinary app: on iPhone via Share → "Add to Home Screen", on Android via the ' +
      'Install button. On iPhone you also tap "Start" each time you open the app — ' +
      'Apple requires that before the phone shares its tilt sensors. The version ' +
      'number at the bottom of the screen is useful if you ever report a problem.',
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
