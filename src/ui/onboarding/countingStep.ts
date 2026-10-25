import { createCountingSection } from '../countingSection';
import { t } from '../i18n';
import type { Step } from './types';
import { textClass, type WizardState } from './wizardState';

/** Anonymous counting gets a step of its own, on from the start (#674). The
 * switch stores at once, so there is nothing to skip. */
export function countingStep(state: WizardState): Step {
  return {
    title: t('counting.title'),
    build: () => [createCountingSection(state.options.counting, textClass(state))],
  };
}
