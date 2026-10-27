import { button, createElement, paragraph } from '../dom';
import { t } from '../i18n';
import { buildClassicProgress, buildModernProgress } from './progress';
import type { Step } from './types';
import type { WizardState } from './wizardState';

export interface StepPosition {
  index: number;
  total: number;
  back(): void;
  skip(): void;
  next(): void;
}

export function buildHeader(state: WizardState, at: StepPosition, close: Element): HTMLElement {
  const header = createElement('div', 'onboarding__header');
  const progress = state.isModern
    ? buildModernProgress(at.index, at.total)
    : buildClassicProgress(at.index, at.total);
  header.append(progress, close);
  return header;
}

export function buildHeading(state: WizardState, step: Step): HTMLHeadingElement {
  const heading = createElement(
    'h2',
    state.isModern ? 'onboarding__title onboarding__title--modern' : 'onboarding__title',
  );
  heading.tabIndex = -1;
  heading.textContent = step.title;
  return heading;
}

export function buildBody(step: Step, heading: HTMLHeadingElement): HTMLElement {
  const body = createElement('div', 'onboarding__body');
  body.append(...step.build());
  foldCalibrationCardHeader(body, heading);
  removeRepeatedHeadings(body, step.title);
  return body;
}

// The embedded calibration card's header repeats the step heading word for
// word, so its pill moves up beside the step heading and the duplicate goes:
// that is what lets the step fit an iPhone SE.
function foldCalibrationCardHeader(body: HTMLElement, heading: HTMLHeadingElement): void {
  const cardHeader = body.querySelector('.calibration-card__header');
  if (!cardHeader) return;
  const pill = cardHeader.lastElementChild;
  if (pill && pill !== cardHeader.firstElementChild) heading.append(pill);
  cardHeader.remove();
}

// Classic's card has no header wrapper, so the duplicate is matched by text.
function removeRepeatedHeadings(body: HTMLElement, title: string): void {
  for (const embedded of body.querySelectorAll('h3')) {
    if (embedded.textContent?.trim() === title.trim()) embedded.remove();
  }
}

export function buildNav(state: WizardState, step: Step, at: StepPosition): HTMLElement {
  const nav = createElement(
    'div',
    state.isModern ? 'onboarding__nav onboarding__nav--modern' : 'onboarding__nav',
  );
  // Above the buttons it explains, so it stays visible when the body
  // scrolls.
  if (step.note) nav.append(paragraph('onboarding__skip-hint', step.note()));
  const secondaryRow = buildSecondaryRow(state, step, at);
  // An empty row would still cost its gap.
  if (secondaryRow.childElementCount > 0) nav.append(secondaryRow);
  nav.append(buildNextButton(state, at));
  return nav;
}

function buildSecondaryRow(state: WizardState, step: Step, at: StepPosition): HTMLElement {
  const row = createElement('div', 'onboarding__nav-row');
  if (at.index > 0) row.append(buildSecondaryButton(state, 'back', t('onboard.back'), at.back));
  if (step.skippable) {
    row.append(buildSecondaryButton(state, 'skip', t('onboard.skipStep'), at.skip));
  }
  return row;
}

function buildSecondaryButton(
  state: WizardState,
  kind: 'back' | 'skip',
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const className = state.isModern
    ? `menu__action menu__action--secondary onboarding__${kind}--modern`
    : 'menu__action menu__action--secondary';
  return button(className, label, onClick);
}

function buildNextButton(state: WizardState, at: StepPosition): HTMLButtonElement {
  const className = state.isModern ? 'menu__action onboarding__next--modern' : 'menu__action';
  const label = at.index === at.total - 1 ? t('onboard.done') : t('onboard.next');
  return button(className, label, at.next);
}

// The form's own Save row is not mounted in the wizard, so Next saves it.
// Dispatching submit reuses the form's real save path (validation, the
// vehicle merge). Submitting the form itself, e.g. with Enter, never
// advances.
export function submitEmbeddedForm(body: HTMLElement): void {
  body.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
}
