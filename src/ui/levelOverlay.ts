/**
 * Full-screen ✓ shown briefly when the vehicle reaches level (R16).
 *
 * `hideNow()` never animates: leaving the ✓ up, even mid-fade, once the
 * vehicle is no longer level would misinform.
 */
import { t } from './i18n';
import { setVisible } from './motion';
import { createElement, paragraph, textElement } from './dom';

export interface LevelOverlay {
  element: HTMLElement;
  celebrate(): void;
  hideNow(): void;
}

const CELEBRATE_DURATION_MS = 2500;

export function createLevelOverlay(): LevelOverlay {
  const element = createElement('div', 'level-overlay');
  element.hidden = true;
  element.append(
    textElement('div', 'level-overlay__mark', '✓'),
    paragraph('level-overlay__text', t('main.level')),
  );

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
