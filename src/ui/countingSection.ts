/**
 * Anonymous counting, said plainly (#674): what is counted, what never is,
 * the on/off switch and the public statistics. The introduction wizard
 * shows it as a step of its own, and the Privacy tab under its stored data.
 */
import { COUNTER_ORIGIN } from '../domain/usage';
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { createElement } from './dom';
import { t, type MessageKey } from './i18n';
import { createCheckboxField, createSectionHeading } from './settingsFields';

/** The stored choice (`countingStore.ts`), injected. */
export interface CountingChoice {
  isOn(): boolean;
  setOn(on: boolean): void;
}

function paragraph(
  className: string,
  key: MessageKey,
  vars: Record<string, string>,
): HTMLParagraphElement {
  const p = createElement('p', className);
  p.textContent = t(key, vars);
  return p;
}

/** Brands never live in a catalogue (#267), so they are filled in here. */
function boxNames(): Record<string, string> {
  return { boxes: EXTERNAL_SENSORS.map((box) => box.displayName).join(', ') };
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

/** The guide says where the switch lives later; the Privacy tab, which is
 * that place, says what a browser privacy signal does instead. Kept to one
 * sentence each, so the guide step fits a small phone whole. */
function closingSentence(place: 'guide' | 'privacy'): string {
  if (place === 'privacy') return t('counting.gpc');
  return t('counting.later', { help: t('bottombar.help'), tab: t('menu.privacy.tab') });
}

export function createCountingSection(
  choice: CountingChoice,
  place: 'guide' | 'privacy',
  textClass = 'menu__text',
): HTMLElement {
  const body = document.createElement('div');
  body.append(
    joined(textClass, t('counting.intro'), dashboardLink()),
    heading('counting.sent.h'),
    paragraph(textClass, 'counting.sent', boxNames()),
    heading('counting.notSent.h'),
    joined(textClass, t('counting.notSent'), closingSentence(place)),
    toggle(choice),
  );
  return body;
}
