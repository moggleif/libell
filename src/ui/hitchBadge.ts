/**
 * Main-screen badge while a caravan goes back to its hitch height (#598),
 * in the target badge's place and look: the mode is on while it shows,
 * and a tap ends it, back to leveling as usual.
 */
import { t } from './i18n';

export interface HitchBadge {
  element: HTMLButtonElement;
  update(active: boolean): void;
}

export function createHitchBadge(onClick: () => void): HitchBadge {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hitch-badge';
  button.hidden = true;
  button.addEventListener('click', onClick);
  return {
    element: button,
    update(active) {
      button.textContent = t('hitch.badge');
      button.setAttribute('aria-label', t('hitch.badge.aria'));
      button.hidden = !active;
    },
  };
}
