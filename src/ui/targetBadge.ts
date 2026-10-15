/**
 * Main-screen badges for what the leveling works toward (#616): the active
 * target while there is more than Normal to choose from (ADR 0013), and the
 * active vehicle while there are several (#599). Tapping one opens its part
 * of Settings, like the warning lamps, but they are informational, so they
 * have their own neutral style.
 */
import { t, type MessageKey } from './i18n';

export interface NameBadge {
  element: HTMLButtonElement;
  /** `null` hides the badge: nothing to choose between. */
  update(name: string | null): void;
}

function createNameBadge(className: string, key: MessageKey, onClick: () => void): NameBadge {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.hidden = true;
  button.addEventListener('click', onClick);
  return {
    element: button,
    update(name) {
      if (name === null) {
        button.hidden = true;
        return;
      }
      const label = t(key, { name });
      button.textContent = label;
      button.setAttribute('aria-label', label);
      button.hidden = false;
    },
  };
}

export const createTargetBadge = (onClick: () => void): NameBadge =>
  createNameBadge('target-badge', 'targets.badge', onClick);

export const createVehicleBadge = (onClick: () => void): NameBadge =>
  createNameBadge('vehicle-badge', 'vehicles.badge', onClick);
