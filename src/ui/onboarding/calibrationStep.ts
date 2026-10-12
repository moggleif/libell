import { createCalibrationSection } from '../calibrationSection';
import { t } from '../i18n';
import type { Step } from './types';
import { paragraph, type WizardState } from './wizardState';

// The phone's own calibration only (#365): the vehicle zero needs the
// vehicle parked level, which a first run at home rarely is, so it waits
// for the first parking on both paths — said here, reminded by the lamp.
// `calibrationSection.ts`'s real card, without Check/Clear.
export function sensorCalibrationStep(state: WizardState): Step {
  return {
    title: t('calibration.sensor.h'),
    note: () => t('onboard.note.calibrate', { next: t('onboard.next'), lamp: t('lamp.calibrate') }),
    build: () => {
      const section = createCalibrationSection(state.options, 'wizard').sensorElement;
      // Inside the card, in its own text style: part of the same advice.
      const laterClass = state.isModern ? 'calibration-card__body' : 'menu__text';
      section.append(paragraph(laterClass, t('onboard.zeroLater', { lamp: t('lamp.zero') })));
      return [section];
    },
  };
}
