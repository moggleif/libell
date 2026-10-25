/**
 * Anonymous counting, said plainly (#674): what is counted, what never is,
 * the on/off switch and the public statistics. The introduction wizard
 * shows it as a step of its own.
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
  vars?: Record<string, string>,
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

function dashboardLink(className: string): HTMLParagraphElement {
  const line = createElement('p', className);
  const link = createElement('a', 'menu__link');
  link.href = COUNTER_ORIGIN;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('counting.dashboard');
  line.append(link);
  return line;
}

export function createCountingSection(
  choice: CountingChoice,
  textClass = 'menu__text',
): HTMLElement {
  const body = document.createElement('div');
  body.append(
    paragraph(textClass, 'counting.intro'),
    heading('counting.sent.h'),
    paragraph(textClass, 'counting.sent', boxNames()),
    heading('counting.notSent.h'),
    paragraph(textClass, 'counting.notSent'),
    paragraph(textClass, 'counting.gpc'),
    toggle(choice),
    dashboardLink(textClass),
  );
  return body;
}
