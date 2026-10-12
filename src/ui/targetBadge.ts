/**
 * Main-screen target badge: the only thing the main screen shows about
 * target presets — a small pill, hidden while "Normal" (true level) is
 * active. Tapping it opens the Targets section, like the warning lamps,
 * but it is informational, so it has its own neutral style.
 */
import { t } from './i18n';

export interface TargetBadge {
  element: HTMLButtonElement;
  /** `null` hides the badge (Normal / no target active). */
  update(activeName: string | null): void;
}

export function createTargetBadge(onClick: () => void): TargetBadge {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'target-badge';
  button.hidden = true;
  button.addEventListener('click', onClick);
  return {
    element: button,
    update(activeName) {
      if (activeName === null) {
        button.hidden = true;
        return;
      }
      const label = t('targets.badge', { name: activeName });
      button.textContent = label;
      button.setAttribute('aria-label', label);
      button.hidden = false;
    },
  };
}
