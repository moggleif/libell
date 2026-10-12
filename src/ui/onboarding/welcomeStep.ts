import { t } from '../i18n';
import type { Step } from './types';
import { paragraph, textClass, type WizardState } from './wizardState';

// What Libell is for, before any question or form (design-review
// follow-up). Reuses 'about.text' rather than separate welcome-only copy.
export function welcomeStep(state: WizardState): Step {
  return {
    title: t('onboard.welcome.h'),
    build: () => {
      const what = paragraph(textClass(state), t('about.text'));
      const guide = paragraph(textClass(state), t('onboard.welcome.t'));
      if (!state.sourceChoiceAvailable) return [what, guide];
      // The box is not in Settings (#365): say where it lives.
      return [what, guide, paragraph(textClass(state), t('onboard.welcome.sensor'))];
    },
  };
}
