/**
 * One step of a setup checklist, shared by the box's setup and the
 * calibration checklist in Settings so both look the same.
 */
import { createElement } from './dom';

export interface ChecklistStep<Id extends string> {
  id: Id;
  number: number;
  element: HTMLElement;
  header: HTMLButtonElement;
  mark: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
}

export function createChecklistStep<Id extends string>(id: Id, number: number): ChecklistStep<Id> {
  const element = createElement('div', 'box-step');
  const header = createElement('button', 'box-step__header');
  header.type = 'button';
  const mark = createElement('span', 'box-step__mark');
  mark.textContent = String(number);
  const title = createElement('span', 'box-step__title');
  header.append(mark, title);
  const body = createElement('div', 'box-step__body');
  body.hidden = true;
  element.append(header, body);
  return { id, number, element, header, mark, title, body };
}

export function setStepDone(step: ChecklistStep<string>, done: boolean): void {
  step.element.classList.toggle('is-done', done);
  step.mark.textContent = done ? '✓' : String(step.number);
}

export function expandStep<Id extends string>(
  steps: readonly ChecklistStep<Id>[],
  expanded: Id | null,
): void {
  for (const step of steps) {
    step.body.hidden = step.id !== expanded;
    step.element.classList.toggle('is-open', step.id === expanded);
  }
}
