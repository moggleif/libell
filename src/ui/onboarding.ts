/**
 * First-run onboarding wizard (#43, reworked #184, #189 and #365): what
 * Libell does, language, appearance and sound, which vehicle, how to place
 * the phone or connect the box, the measurements, the ramps and the phone's
 * calibration.
 *
 * Nothing blocks: Next always advances, and whatever is left undone stays
 * flagged by the warning lamps. Skip appears only where Next would save a
 * form; elsewhere a step-specific note says what leaving it undone means.
 * Neither path zeroes the vehicle: a first run is usually at home, so the
 * zero waits for the first parking and the lamp reminds until then.
 *
 * Every step reuses the real settings form, calibration card and
 * sensor-source section for its fields and logic, never a wizard-only copy
 * that can drift (#184). It leaves out their Save/Undo/Reset chrome, since a
 * linear wizard and a persistent settings page are different interaction
 * models: Next alone submits the embedded form.
 *
 * The steps live in `onboarding/`, sharing one `WizardState` (#415), and
 * `onboarding/stepList.ts` decides which of them the chosen path walks. This
 * file draws the current step around them: progress, heading, body, nav.
 */
import { t } from './i18n';
import { buildClassicProgress, buildModernProgress } from './onboarding/progress';
import { resolveSteps } from './onboarding/stepList';
import type { OnboardingOptions } from './onboarding/types';
import { createWizardState, paragraph } from './onboarding/wizardState';

export type { OnboardingOptions, SensorChoice } from './onboarding/types';

// What leaving a step undone means (#189, made step-specific by #365).
// Lives in the nav next to the buttons it explains, not at the end of
// the step's body (#239): it reads as their caption, it stays visible
// when a tall step's body scrolls, and it costs no body height.
function stepNote(text: string): HTMLParagraphElement {
  return paragraph('onboarding__skip-hint', text);
}

export function showOnboarding(options: OnboardingOptions): void {
  const state = createWizardState(options, () => renderStep());
  const { isModern } = state;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding';

  const card = document.createElement('div');
  card.className = 'onboarding__card';
  overlay.append(card);

  // Always escapable: ✕ closes the wizard from any step. It can be
  // reopened any time from the "Show introduction" button at the top of
  // the "?" page's Help tab (screen-cleanup follow-up).
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'onboarding__close';
  close.setAttribute('aria-label', t('onboard.close'));
  close.textContent = '✕';
  close.addEventListener('click', () => finish(false));

  let index = 0;

  function finish(done: boolean): void {
    overlay.remove();
    options.onFinished(done, state.sourceChoiceAvailable ? state.sensorChoice : 'phone');
  }

  function renderStep(): void {
    const steps = resolveSteps(state);
    const step = steps[index];
    if (!step) {
      finish(true);
      return;
    }
    card.replaceChildren();

    const header = document.createElement('div');
    header.className = 'onboarding__header';
    const progress = isModern
      ? buildModernProgress(index, steps.length)
      : buildClassicProgress(index, steps.length);
    header.append(progress, close);

    const heading = document.createElement('h2');
    heading.className = isModern
      ? 'onboarding__title onboarding__title--modern'
      : 'onboarding__title';
    heading.tabIndex = -1;
    heading.textContent = step.title;

    const body = document.createElement('div');
    body.className = 'onboarding__body';
    body.append(...step.build());

    // A calibration step embeds `calibrationSection.ts`'s real card, whose
    // own header is [heading, status pill] — and that heading is word for
    // word the step heading right above it. So the header row is folded
    // into the step heading (#239): the pill, the one thing the heading
    // does not say ("NOT DONE" / "DONE"), moves up beside it, and the
    // duplicate heading goes. Worth ~23 px, which is the difference
    // between this step fitting an iPhone SE screen and not. The pill is
    // still the same element `refreshCalibration` holds a reference to and
    // keeps up to date — only its place in the DOM changed. Settings'
    // own copy of the card, where no such outer heading exists, is
    // untouched.
    const cardHeader = body.querySelector('.calibration-card__header');
    if (cardHeader) {
      const pill = cardHeader.lastElementChild;
      if (pill && pill !== cardHeader.firstElementChild) heading.append(pill);
      cardHeader.remove();
    }
    // Classic builds the same card without that header wrapper — a bare
    // `h3.menu__heading` and no pill — so the duplicate is dropped by what
    // it says rather than by where it sits. Matching on the text is the
    // point, not a shortcut: it removes a heading only when the step
    // heading above already carries those exact words, whatever component
    // put it there and whatever the appearance calls it.
    for (const embedded of body.querySelectorAll('h3')) {
      if (embedded.textContent?.trim() === step.title.trim()) embedded.remove();
    }

    const nav = document.createElement('div');
    nav.className = isModern ? 'onboarding__nav onboarding__nav--modern' : 'onboarding__nav';
    // The note first, so it reads as a caption for the buttons right under
    // it (#239 — see stepNote above).
    if (step.note) nav.append(stepNote(step.note()));
    // Back and Skip share one row above Next (#239): stacked full width
    // they were three buttons and 174 px of a 553 px iPhone SE screen,
    // spent entirely on navigation. Side by side they are one 43 px row,
    // and Next keeps the full-width bottom edge — the same top-to-bottom
    // order (Back, Skip, Next) and the same "closest to the thumb wins"
    // rule as before, in Classic and Modern alike.
    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'onboarding__nav-row';
    // Back (#189): a wrong tap on vehicle type or sensor source used to be
    // fixable only by finishing the wizard and correcting it in Settings,
    // or closing (✕) and restarting from step 1. Never shown on the first
    // step, matching Skip's own "not always present" convention.
    if (index > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = isModern
        ? 'menu__action menu__action--secondary onboarding__back--modern'
        : 'menu__action menu__action--secondary';
      back.textContent = t('onboard.back');
      back.addEventListener('click', () => {
        index -= 1;
        renderStep();
      });
      secondaryRow.append(back);
    }
    if (step.skippable) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = isModern
        ? 'menu__action menu__action--secondary onboarding__skip--modern'
        : 'menu__action menu__action--secondary';
      skip.textContent = t('onboard.skipStep');
      skip.addEventListener('click', () => {
        index += 1;
        renderStep();
      });
      secondaryRow.append(skip);
    }
    // Welcome has neither, and an empty row would still cost its gap.
    if (secondaryRow.childElementCount > 0) nav.append(secondaryRow);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = isModern ? 'menu__action onboarding__next--modern' : 'menu__action';
    next.textContent = index === steps.length - 1 ? t('onboard.done') : t('onboard.next');
    next.addEventListener('click', () => {
      // Leaving a step with its own embedded settings form (measurements,
      // language, appearance, sound, ramps): its own Save/Undo/Reset row
      // isn't mounted here at all (design review — see the file header
      // comment), so Next is the only thing that persists it. Dispatching
      // submit directly reuses the form's real save path (validation, the
      // vehicle full-object merge, etc.) rather than re-deriving it here.
      // No step-identity check needed — only these steps' body ever
      // contains a <form> at all (calibration/connect never do), and the
      // optional chaining below is already a no-op otherwise. #159's
      // separate guard — that submitting this form directly, e.g. by
      // pressing Enter in a field, never itself advances or closes the
      // wizard — is unrelated and unaffected: only this Next click both
      // submits and advances.
      body.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      index += 1;
      renderStep();
    });
    nav.append(next);

    card.append(header, heading, body, nav);
    heading.focus();
  }

  document.body.append(overlay);
  renderStep();
}
