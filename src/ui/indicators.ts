/**
 * Dashboard-style warning lamps in the top bar: each disappears once
 * handled, like a car that has nothing to warn about.
 */
import type { MenuSection } from './menu';
import { t } from './i18n';
import { setVisible } from './motion';
import { createElement } from './dom';

export type CalibrationLamp = 'calibrate' | 'zero' | null;

/**
 * Same order as the Calibration checklist (R11), so the lamp always names
 * the step that checklist opens on.
 */
export function phoneCalibrationLamp(calibrated: boolean, zeroed: boolean): CalibrationLamp {
  if (!calibrated) return 'calibrate';
  if (!zeroed) return 'zero';
  return null;
}

export interface Indicators {
  element: HTMLElement;
  update(state: {
    settingsSaved: boolean;
    calibrationLamp: CalibrationLamp;
    /** The calibration lamp is then about the sensor, never "the phone". */
    usesBox?: boolean;
  }): void;
}

type LampState = Parameters<Indicators['update']>[0];

export function createIndicators(openMenu: (section: MenuSection) => void): Indicators {
  const container = createElement('div', 'indicators');
  const settingsLamp = lamp(t('lamp.setup'), t('lamp.setup.title'), () => openMenu('vehicle'));
  const calibrationLamp = lamp(t('lamp.calibrate'), t('lamp.calibrate.title'), () =>
    openMenu('calibration'),
  );
  container.append(settingsLamp, calibrationLamp);

  // The first update() reflects state already true before the app painted:
  // apply it instantly, not animate a "change" that never visually happened.
  let first = true;

  return {
    element: container,
    update(state) {
      labelCalibrationLamp(calibrationLamp, state);
      const showSettings = !state.settingsSaved;
      const showCalibration = state.calibrationLamp !== null;
      if (!first) {
        setVisible(settingsLamp, showSettings);
        setVisible(calibrationLamp, showCalibration);
        return;
      }
      first = false;
      settingsLamp.hidden = !showSettings;
      calibrationLamp.hidden = !showCalibration;
      if (showSettings) settingsLamp.classList.add('is-visible');
      if (showCalibration) calibrationLamp.classList.add('is-visible');
    },
  };
}

function lamp(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'indicators__lamp';
  button.title = title;
  button.textContent = label;
  nameAfterVisibleText(button, title);
  button.addEventListener('click', onClick);
  return button;
}

function labelCalibrationLamp(
  calibrationLamp: HTMLButtonElement,
  { calibrationLamp: missing, usesBox = false }: LampState,
): void {
  // A box only ever lacks its zero.
  const step = usesBox ? 'zero' : (missing ?? 'calibrate');
  const calibrationTitle = t(
    usesBox
      ? 'lamp.calibrate.title.sensor'
      : step === 'zero'
        ? 'lamp.zero.title'
        : 'lamp.calibrate.title',
  );
  calibrationLamp.textContent = t(step === 'zero' ? 'lamp.zero' : 'lamp.calibrate');
  calibrationLamp.title = calibrationTitle;
  nameAfterVisibleText(calibrationLamp, calibrationTitle);
}

/** The accessible name starts with the lamp's own words, so voice control
 * can say what it sees, then says what is missing (#535). */
function nameAfterVisibleText(lamp: HTMLButtonElement, title: string): void {
  lamp.setAttribute('aria-label', `${lamp.textContent}. ${title}`);
}
