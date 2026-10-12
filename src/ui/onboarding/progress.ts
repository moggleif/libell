import { createElement } from '../dom';

/** The visible "n / total" text is for sighted low-vision users: the bars
 * alone are unreadable at that size. */
export function buildModernProgress(current: number, total: number): HTMLElement {
  const wrap = createElement('div', 'onboarding__progress-wrap');

  const bars = createElement('div', 'onboarding__bars');
  bars.setAttribute('role', 'img');
  bars.setAttribute('aria-label', `${current + 1} / ${total}`);
  for (let i = 0; i < total; i += 1) {
    const bar = createElement(
      'span',
      i === current ? 'onboarding__bar onboarding__bar--active' : 'onboarding__bar',
    );
    bars.append(bar);
  }

  const text = createElement('span', 'onboarding__bars-text');
  text.setAttribute('aria-hidden', 'true');
  text.textContent = `${current + 1} / ${total}`;

  wrap.append(bars, text);
  return wrap;
}

export function buildClassicProgress(current: number, total: number): HTMLElement {
  const progress = createElement('p', 'onboarding__progress');
  progress.textContent = `${current + 1} / ${total}`;
  return progress;
}
