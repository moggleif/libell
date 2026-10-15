/**
 * The phone's and the vehicle's calibration controls, shared by every
 * layout in `calibrationLayouts.ts`: the same heading, intro, status and
 * action buttons, only placed differently.
 */
import type { Calibration } from '../domain/calibration';
import { pillFor, calibrationStatusText, type CalibrationKind } from './calibrationText';
import { createElement } from './dom';
import { t } from './i18n';

export interface CalibrationControls {
  heading: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  capture: HTMLButtonElement;
  /** Shown only while a capture's tilt warning is up: puts back what the
   * capture replaced (#624). */
  undo: HTMLButtonElement;
  check: HTMLButtonElement;
  clear: HTMLButtonElement;
  /** Modern only: the numbers live in the status sentence alone. */
  pill: HTMLElement;
}

const CONTROL_KEYS = {
  phone: {
    heading: 'calibration.sensor.h',
    intro: 'calibration.intro',
    capture: 'calibration.now',
    clear: 'calibration.clear',
  },
  vehicle: {
    heading: 'calibration.vehicle.h',
    intro: 'calibration.vehicle.intro',
    capture: 'calibration.vehicle.now',
    clear: 'calibration.vehicle.clear',
  },
} as const;

export function button(className: string, text: string): HTMLButtonElement {
  const element = createElement('button', className);
  element.type = 'button';
  element.textContent = text;
  return element;
}

export function createControls(kind: CalibrationKind, modern: boolean): CalibrationControls {
  const keys = CONTROL_KEYS[kind];
  const heading = createElement('h3', modern ? 'calibration-card__title' : 'menu__heading');
  heading.textContent = t(keys.heading);
  const intro = createElement('p', modern ? 'calibration-card__body' : 'menu__text');
  intro.textContent = t(keys.intro);
  const secondary = 'menu__action menu__action--secondary';
  const undo = button(secondary, t('calibration.undo'));
  undo.hidden = true;
  const pill = document.createElement('span');
  if (modern) pill.className = 'calibration-card__pill';
  return {
    heading,
    intro,
    status: createElement('p', 'menu__text menu__text--status'),
    // Every calibrate action is primary: a user only ever does one of them.
    capture: button('menu__action', t(keys.capture)),
    undo,
    check: button(secondary, t('calibration.check')),
    clear: button(secondary, t(keys.clear)),
    pill,
  };
}

export function drawControls(
  kind: CalibrationKind,
  controls: CalibrationControls,
  stored: { calibration: Calibration | null; capturedAt: number | null },
  look: { modern: boolean; checklist: boolean },
  message?: string,
): void {
  const { calibration, capturedAt } = stored;
  controls.undo.hidden = true;
  controls.status.classList.remove('menu__text--warning');
  controls.status.textContent = calibrationStatusText(
    kind,
    calibration,
    capturedAt,
    look.checklist,
    message,
  );
  // Nothing to clear: hidden, not greyed; Check explains instead (#517).
  controls.clear.hidden = !calibration;
  controls.clear.disabled = false;
  controls.check.disabled = false;
  if (!look.modern) return;
  const pill = pillFor(kind, calibration !== null);
  controls.pill.textContent = pill.text;
  controls.pill.className = pill.className;
}

export function showWarning(controls: CalibrationControls, warned: boolean): void {
  if (!warned) return;
  controls.status.classList.add('menu__text--warning');
  controls.undo.hidden = false;
}
