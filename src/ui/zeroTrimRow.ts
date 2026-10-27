/**
 * "Fine-tune the zero" (#596): four nudges and a reset under a stored zero,
 * for the phone's vehicle zero and each box's own. Shown only once there is
 * a zero to adjust; the step above it is what guides the user to one.
 */
import type { Calibration } from '../domain/calibration';
import { isTrimmed, trimSummary, type TrimDirection } from '../domain/zeroTrim';
import { button, createElement, paragraph } from './dom';
import { t, type MessageKey } from './i18n';
import { signedDegrees } from './tiltText';

export interface ZeroTrimOptions {
  hasZero(): boolean;
  getTrim(): Calibration;
  nudge(direction: TrimDirection): void;
  reset(): void;
}

export interface ZeroTrimRow {
  element: HTMLElement;
  refresh(): void;
}

/** Side by side as on the vehicle: left and right, then front and back. */
const BUTTONS: Array<[TrimDirection, MessageKey]> = [
  ['left', 'zeroTrim.left'],
  ['right', 'zeroTrim.right'],
  ['front', 'zeroTrim.front'],
  ['back', 'zeroTrim.back'],
];

const SIDE: Record<TrimDirection, MessageKey> = {
  left: 'zeroTrim.side.left',
  right: 'zeroTrim.side.right',
  front: 'zeroTrim.side.front',
  back: 'zeroTrim.side.back',
};

/** "Front +0.1° · Left +0.2°", or that there is none. */
export function zeroTrimText(trim: Calibration): string {
  const parts = trimSummary(trim).map(({ side, deg }) => `${t(SIDE[side])} ${signedDegrees(deg)}`);
  return parts.length ? t('zeroTrim.total', { trim: parts.join(' · ') }) : t('zeroTrim.none');
}

export function createZeroTrimRow(options: ZeroTrimOptions): ZeroTrimRow {
  const element = createElement('div', 'zero-trim');
  const title = paragraph('menu__text zero-trim__title', t('zeroTrim.title'));
  const hint = paragraph('menu__text', t('zeroTrim.hint'));
  const buttons = createElement('div', 'zero-trim__buttons');
  const total = createElement('p', 'menu__text menu__text--status');
  total.setAttribute('aria-live', 'polite');
  const reset = button('link-button', t('zeroTrim.reset'));
  function refresh(): void {
    element.hidden = !options.hasZero();
    const trim = options.getTrim();
    total.textContent = zeroTrimText(trim);
    reset.disabled = !isTrimmed(trim);
  }
  for (const [direction, key] of BUTTONS) {
    const nudge = () => {
      options.nudge(direction);
      refresh();
    };
    buttons.append(button('menu__action menu__action--secondary', t(key), nudge));
  }
  reset.addEventListener('click', () => {
    options.reset();
    refresh();
  });
  element.append(title, hint, buttons, total, reset);
  refresh();
  return { element, refresh };
}
