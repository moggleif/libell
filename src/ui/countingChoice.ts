/**
 * The first-start choice (#699): anonymous counting is a choice the user
 * makes before anything else, on one screen with two equal buttons. Styled
 * as the intro (#691), which it comes before.
 */
import { createCountingExplanation } from './countingSection';
import { createDialog } from './dialog';
import { createElement } from './dom';
import { t } from './i18n';
import { button } from './intro';

export interface CountingChoiceOptions {
  /** True for "Yes, count anonymously", false for "No thanks"; the screen has closed. */
  onChoose(on: boolean): void;
}

export function showCountingChoice(options: CountingChoiceOptions): void {
  const dialog = createDialog({
    className: 'intro counting-choice',
    cardClassName: 'intro__card',
    headingId: 'counting-choice-heading',
    // The question is the heading: the buttons below answer it.
    heading: { className: 'intro__title', text: t('counting.ask') },
  });
  const choose = (on: boolean) => dialog.closeThen(() => options.onChoose(on));
  dialog.card.append(buildBody(dialog.heading), buildNav(choose(true), choose(false)));
  dialog.open();
}

function buildBody(heading: HTMLHeadingElement): HTMLElement {
  const body = createElement('div', 'intro__body');
  body.append(heading, ...createCountingExplanation('choice', 'intro__text'));
  return body;
}

/** Equal buttons: neither answer is the one the app leans towards. */
function buildNav(onYes: () => void, onNo: () => void): HTMLElement {
  const nav = createElement('div', 'intro__nav');
  nav.append(
    button('menu__action', t('counting.yes'), onYes),
    button('menu__action', t('counting.no'), onNo),
  );
  return nav;
}
