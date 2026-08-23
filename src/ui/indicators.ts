/**
 * Dashboard-style warning lamps in the top bar: one lights up while the
 * vehicle settings have never been saved, another while the phone is not
 * calibrated. Tapping a lamp opens the matching menu section; both
 * disappear once handled — like a car that has nothing to warn about.
 */
import type { MenuSection } from './menu';

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
    button.textContent = `⚠ ${label}`;
    button.addEventListener('click', () => openMenu(section));
    container.append(button);
    return button;
  }

  const settingsLamp = lamp(
    'Setup',
    'settings',
    'Vehicle settings have never been saved — tap to open Settings',
  );
  const calibrationLamp = lamp(
    'Calibrate',
    'calibration',
    'The phone is not calibrated — tap to open Calibration',
  );

  return {
    element: container,
    update({ settingsSaved, calibrated }) {
      settingsLamp.hidden = settingsSaved;
      calibrationLamp.hidden = calibrated;
    },
  };
}
