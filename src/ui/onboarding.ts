/**
 * First-run onboarding wizard.
 *
 * Nothing blocks: Next always advances, and whatever is left undone stays
 * flagged by the warning lamps. Skip appears only where Next would save a
 * form; elsewhere a step-specific note says what leaving it undone means.
 * Neither path zeroes the vehicle: a first run is usually at home, so the
 * zero waits for the first parking and the lamp reminds until then.
 *
 * Every step reuses the real settings form, calibration card and
 * sensor-source section for its fields and logic, never a wizard-only copy
 * that can drift. It leaves out their Save/Undo/Reset chrome, since a
 * linear wizard and a persistent settings page are different interaction
 * models: Next alone submits the embedded form.
 *
 * `onboarding/stepList.ts` decides which steps the chosen path walks; this
 * file draws the current one: progress, heading, body, nav.
 */
import { holdFocus, type FocusHold } from './focusHold';
import { createElement } from './dom';
import { t } from './i18n';
import { saveVehicleChoice } from './onboarding/settingsSteps';
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'onboarding-heading');
  overlay.append(card);
  let hold: FocusHold | null = null;
  const close = buildCloseButton(() => finish(false));
  let index = 0;

  function finish(done: boolean): void {
    if (done) saveVehicleChoice(state);
    overlay.remove();
    hold?.release();
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
    heading.id = 'onboarding-heading';
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
  hold = holdFocus(overlay);
  renderStep();
}

// Always escapable; reopened from "Show introduction" on the "?" page.
function buildCloseButton(onClose: () => void): HTMLButtonElement {
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'onboarding__close';
  close.setAttribute('aria-label', t('onboard.close'));
  close.textContent = '✕';
  close.addEventListener('click', onClose);
  return close;
}
