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
import { createElement } from './dom';
import { t } from './i18n';
import { resolveSteps } from './onboarding/stepList';
import {
  buildBody,
  buildHeader,
  buildHeading,
  buildNav,
  submitEmbeddedForm,
  type StepPosition,
} from './onboarding/stepView';
import type { OnboardingOptions } from './onboarding/types';
import { createWizardState } from './onboarding/wizardState';

export type { OnboardingOptions, SensorChoice } from './onboarding/types';

export function showOnboarding(options: OnboardingOptions): void {
  const state = createWizardState(options, () => renderStep());
  const card = createElement('div', 'onboarding__card');
  const overlay = createElement('div', 'onboarding');
  overlay.append(card);
  const close = buildCloseButton(() => finish(false));
  let index = 0;

  function finish(done: boolean): void {
    overlay.remove();
    options.onFinished(done, state.sourceChoiceAvailable ? state.sensorChoice : 'phone');
  }

  function goTo(nextIndex: number): void {
    index = nextIndex;
    renderStep();
  }

  function renderStep(): void {
    const steps = resolveSteps(state);
    const step = steps[index];
    if (!step) return finish(true);
    card.replaceChildren();
    const heading = buildHeading(state, step);
    const body = buildBody(step, heading);
    const at: StepPosition = {
      index,
      total: steps.length,
      back: () => goTo(index - 1),
      skip: () => goTo(index + 1),
      next: () => {
        submitEmbeddedForm(body);
        goTo(index + 1);
      },
    };
    card.append(buildHeader(state, at, close), heading, body, buildNav(state, step, at));
    heading.focus();
  }

  document.body.append(overlay);
  renderStep();
}

// Always escapable: ✕ closes the wizard from any step. It can be reopened
// from the "Show introduction" button on the "?" page's Help tab.
function buildCloseButton(onClose: () => void): HTMLButtonElement {
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'onboarding__close';
  close.setAttribute('aria-label', t('onboard.close'));
  close.textContent = '✕';
  close.addEventListener('click', onClose);
  return close;
}
