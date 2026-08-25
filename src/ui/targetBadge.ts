/**
 * Main-screen target badge (#122): the *only* thing the main screen ever
 * shows about target presets — a small, unobtrusive pill, hidden
 * whenever "Normal" (true level) is active, so the normal/level case
 * shows nothing extra at all. Tapping it opens the Targets menu section,
 * the same "tap the status to open the matching section" pattern the
 * topbar warning lamps use (`indicators.ts`) — but this is informational,
 * never a warning, so it gets its own neutral style, not the amber lamp
 * one.
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
