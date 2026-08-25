/**
 * Full-screen ✓ confirmation shown briefly when the vehicle reaches level
 * (R16). `celebrate()` fades/scales it in, holds it, then fades it back
 * out — via `setVisible` (motion.ts) it does so instantly, with no
 * animated transition, under `prefers-reduced-motion` (#124).
 *
 * `hideNow()` is a separate, always-instant abort: used whenever the
 * underlying state stops being level (or the menu/wizard opens) while the
 * overlay is showing. That is a correctness matter, not a motion
 * preference — leaving the ✓ up (even mid-fade) while the vehicle is no
 * longer level would misinform, so the abort path never animates.
 */
import { t } from './i18n';
import { setVisible } from './motion';

export interface LevelOverlay {
  element: HTMLElement;
  /** Shows the ✓, then hides it again after a brief pause. */
  celebrate(): void;
  /** Hides the ✓ immediately, with no transition, whatever its state. */
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
