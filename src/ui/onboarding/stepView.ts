/**
 * Draws one wizard step (#415): the header with progress and ✕, the
 * heading, the body the step builds, and the navigation under it.
 */
import { createElement } from '../dom';
import { t } from '../i18n';
import { buildClassicProgress, buildModernProgress } from './progress';
import type { Step } from './types';
import { paragraph, type WizardState } from './wizardState';

/** Where the step sits in the walk, and what each nav button does. */
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

// A calibration step embeds `calibrationSection.ts`'s real card, whose own
// header is [heading, status pill], and that heading is word for word the
// step heading right above it. So the header row is folded into the step
// heading (#239): the pill ("NOT DONE" / "DONE") moves up beside it and the
// duplicate heading goes, which is what lets the step fit an iPhone SE. The
// pill stays the element `refreshCalibration` keeps up to date.
function foldCalibrationCardHeader(body: HTMLElement, heading: HTMLHeadingElement): void {
  const cardHeader = body.querySelector('.calibration-card__header');
  if (!cardHeader) return;
  const pill = cardHeader.lastElementChild;
  if (pill && pill !== cardHeader.firstElementChild) heading.append(pill);
  cardHeader.remove();
}

// Classic builds the same card without that header wrapper, a bare
// `h3.menu__heading` and no pill, so the duplicate is dropped by what it
// says: only when the step heading already carries those exact words.
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
  // What leaving the step undone means (#365), first, so it reads as the
  // caption of the buttons under it and stays visible when the body
  // scrolls (#239).
  if (step.note) nav.append(paragraph('onboarding__skip-hint', step.note()));
  const secondaryRow = buildSecondaryRow(state, step, at);
  // Welcome has neither Back nor Skip, and an empty row would still cost its gap.
  if (secondaryRow.childElementCount > 0) nav.append(secondaryRow);
  nav.append(buildNextButton(state, at));
  return nav;
}

// Back and Skip share one row above Next (#239), which keeps the
// full-width bottom edge: the same Back, Skip, Next order top to bottom.
// Back (#189) from the second step on; Skip only where Next saves a form.
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
  return navButton(className, label, onClick);
}

function buildNextButton(state: WizardState, at: StepPosition): HTMLButtonElement {
  const className = state.isModern ? 'menu__action onboarding__next--modern' : 'menu__action';
  const label = at.index === at.total - 1 ? t('onboard.done') : t('onboard.next');
  return navButton(className, label, at.next);
}

function navButton(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

// Next is the only thing that saves a step's embedded settings form, since
// its own Save/Undo/Reset row is not mounted in the wizard. Dispatching
// submit reuses the form's real save path (validation, the vehicle merge).
// Only the settings steps hold a form, so elsewhere this does nothing.
// Submitting the form itself, e.g. with Enter, never advances (#159).
export function submitEmbeddedForm(body: HTMLElement): void {
  body.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
}
