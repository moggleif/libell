/**
 * Dashboard-style warning lamps in the top bar: one lights up while the
 * vehicle settings have never been saved, another while the phone is not
 * calibrated. Tapping a lamp opens the matching menu section; both
 * disappear once handled — like a car that has nothing to warn about.
 */
import type { MenuSection } from './menu';
import { t } from './i18n';
import { setVisible } from './motion';

export interface Indicators {
  element: HTMLElement;
  update(state: { settingsSaved: boolean; calibrated: boolean }): void;
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

  // Routes to the Vehicle page (screen-cleanup follow-up, #108 follow-up)
  // — this lamp's own title ("Vehicle settings have never been saved")
  // already named the destination; 'settings' stopped being a valid
  // MenuSection once ☰ Settings split into General/Vehicle/Ramps pages.
  const settingsLamp = lamp(t('lamp.setup'), 'vehicle', t('lamp.setup.title'));
  const calibrationLamp = lamp(t('lamp.calibrate'), 'calibration', t('lamp.calibrate.title'));

  // The very first update() call reflects state that was already true
  // before the app ever painted (e.g. demo mode's pre-configured
  // settings) — it must apply instantly, not animate a "change" that
  // never visually happened. Only later, user-triggered changes fade.
  let first = true;

  return {
    element: container,
    update({ settingsSaved, calibrated }) {
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
