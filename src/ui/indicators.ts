/**
 * Dashboard-style warning lamps in the top bar: each disappears once
 * handled, like a car that has nothing to warn about.
 */
import type { MenuSection } from './menu';
import { t } from './i18n';
import { setVisible } from './motion';

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
    externalSensor?: boolean;
  }): void;
}

export function createIndicators(openMenu: (section: MenuSection) => void): Indicators {
  const container = document.createElement('div');
  container.className = 'indicators';

  function lamp(label: string, section: MenuSection, title: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'indicators__lamp';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.textContent = label;
    button.addEventListener('click', () => openMenu(section));
    container.append(button);
    return button;
  }

  const settingsLamp = lamp(t('lamp.setup'), 'vehicle', t('lamp.setup.title'));
  const calibrationLamp = lamp(t('lamp.calibrate'), 'calibration', t('lamp.calibrate.title'));

  // The first update() reflects state already true before the app painted:
  // apply it instantly, not animate a "change" that never visually happened.
  let first = true;

  return {
    element: container,
    update({ settingsSaved, calibrationLamp: missing, externalSensor = false }) {
      const calibrated = missing === null;
      // A box only ever lacks its zero.
      const step = externalSensor ? 'zero' : (missing ?? 'calibrate');
      const calibrationTitle = t(
        externalSensor
          ? 'lamp.calibrate.title.sensor'
          : step === 'zero'
            ? 'lamp.zero.title'
            : 'lamp.calibrate.title',
      );
      calibrationLamp.textContent = t(step === 'zero' ? 'lamp.zero' : 'lamp.calibrate');
      calibrationLamp.title = calibrationTitle;
      calibrationLamp.setAttribute('aria-label', calibrationTitle);
      if (first) {
        first = false;
        settingsLamp.hidden = settingsSaved;
        calibrationLamp.hidden = calibrated;
        if (!settingsSaved) settingsLamp.classList.add('is-visible');
        if (!calibrated) calibrationLamp.classList.add('is-visible');
        return;
      }
      setVisible(settingsLamp, !settingsSaved);
      setVisible(calibrationLamp, !calibrated);
    },
  };
}
