/**
 * Full-screen ✓ shown briefly when the vehicle reaches level (R16).
 *
 * `hideNow()` never animates: leaving the ✓ up, even mid-fade, once the
 * vehicle is no longer level would misinform.
 */
import { t } from './i18n';
import { setVisible } from './motion';

export interface LevelOverlay {
  element: HTMLElement;
  celebrate(): void;
  hideNow(): void;
}

const CELEBRATE_DURATION_MS = 2500;

export function createLevelOverlay(): LevelOverlay {
  const element = document.createElement('div');
  element.className = 'level-overlay';
  element.hidden = true;
  const mark = document.createElement('div');
  mark.className = 'level-overlay__mark';
  mark.textContent = '✓';
  const text = document.createElement('p');
  text.className = 'level-overlay__text';
  text.textContent = t('main.level');
  element.append(mark, text);

  let timer = 0;

  return {
    element,
    celebrate() {
      setVisible(element, true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(element, false), CELEBRATE_DURATION_MS);
    },
    hideNow() {
      window.clearTimeout(timer);
      element.classList.remove('is-visible');
      element.hidden = true;
    },
  };
}
