/**
 * Anonymous counting, said plainly (#674): what is counted, what never is,
 * and the public statistics. The first-start choice (#699) shows it above
 * its two buttons, and the Privacy tab under its stored data with the
 * on/off switch.
 */
import { COUNTER_ORIGIN } from '../domain/usage';
import { boxNames } from './boxNames';
import { createElement, paragraph } from './dom';
import { getLanguage, t, type MessageKey } from './i18n';
import { createCheckboxField, createSectionHeading } from './settingsFields';

/** The stored choice (`countingStore.ts`), injected. */
export interface CountingChoice {
  isOn(): boolean;
  setOn(on: boolean): void;
}

function heading(key: MessageKey): HTMLParagraphElement {
  const h = createSectionHeading();
  h.textContent = t(key);
  return h;
}

function toggle(choice: CountingChoice): HTMLElement {
  const field = createCheckboxField(choice.isOn());
  field.caption.textContent = t('counting.toggle');
  field.control.addEventListener('change', () => choice.setOn(field.control.checked));
  return field.element;
}

function dashboardLink(): HTMLAnchorElement {
  const link = createElement('a', 'menu__link');
  link.href = COUNTER_ORIGIN;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('counting.dashboard');
  return link;
}

/** Sentences that share one paragraph, so the step fits a small phone whole. */
function joined(className: string, ...parts: (string | Element)[]): HTMLParagraphElement {
  const p = createElement('p', className);
  parts.forEach((part, i) => p.append(i > 0 ? ' ' : '', part));
  return p;
}

/** The choice says where to change it later; the Privacy tab, which is
 * that place, says what a browser privacy signal does instead. Kept to one
 * sentence each, so the choice fits a small phone whole. */
function closingSentence(place: 'choice' | 'privacy'): string {
  if (place === 'privacy') return t('counting.gpc');
  return t('counting.later', { help: t('bottombar.help'), tab: t('menu.privacy.tab') });
}

/** What is counted and what never is, without the switch. */
export function createCountingExplanation(
  place: 'choice' | 'privacy',
  textClass = 'menu__text',
): HTMLElement[] {
  return [
    joined(textClass, t('counting.intro'), dashboardLink()),
    heading('counting.sent.h'),
    paragraph(textClass, t('counting.sent', { boxes: boxNames(getLanguage(), 'disjunction') })),
    heading('counting.notSent.h'),
    joined(textClass, t('counting.notSent'), closingSentence(place)),
  ];
}

/** The Privacy tab's block: the explanation and the on/off switch. */
export function createCountingSection(choice: CountingChoice): HTMLElement {
  const body = document.createElement('div');
  body.append(...createCountingExplanation('privacy'), toggle(choice));
  return body;
}
