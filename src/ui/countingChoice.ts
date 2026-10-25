/**
 * The first-start choice (#699): anonymous counting is a choice the user
 * makes before anything else, on one screen with two equal buttons. Styled
 * as the intro (#691), which it comes before.
 */
import { createCountingExplanation } from './countingSection';
import { createElement } from './dom';
import { holdFocus } from './focusHold';
import { t } from './i18n';

export interface CountingChoiceOptions {
  /** True for "Count", false for "Don't count"; the screen has closed. */
  onChoose(on: boolean): void;
}

export function showCountingChoice(options: CountingChoiceOptions): void {
  const overlay = createElement('div', 'intro counting-choice');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'counting-choice-heading');
  const card = createElement('div', 'intro__card');
  overlay.append(card);
  const heading = buildHeading();

  function choose(on: boolean): () => void {
    return () => {
      overlay.remove();
      hold.release();
      options.onChoose(on);
    };
  }

  card.append(buildBody(heading), buildNav(choose(true), choose(false)));
  document.body.append(overlay);
  const hold = holdFocus(overlay);
  heading.focus();
}

function buildHeading(): HTMLHeadingElement {
  const heading = createElement('h2', 'intro__title');
  heading.id = 'counting-choice-heading';
  heading.tabIndex = -1;
  // The question is the heading: the buttons below answer it.
  heading.textContent = t('counting.ask');
  return heading;
}

function buildBody(heading: HTMLHeadingElement): HTMLElement {
  const body = createElement('div', 'intro__body');
  body.append(heading, ...createCountingExplanation('choice', 'intro__text'));
  return body;
}

/** Equal buttons: neither answer is the one the app leans towards. */
function buildNav(onYes: () => void, onNo: () => void): HTMLElement {
  const nav = createElement('div', 'intro__nav');
  nav.append(button(t('counting.yes'), onYes), button(t('counting.no'), onNo));
  return nav;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = createElement('button', 'menu__action');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}
