import type { VehicleType } from '../../domain/settings';
import { t, type MessageKey } from '../i18n';
import { buildChoiceGroup } from './choiceGroup';
import type { SensorChoice, Step } from './types';
import { textClass, type WizardState } from './wizardState';
import { paragraph } from '../dom';

const SOURCE_OPTIONS: [SensorChoice, MessageKey][] = [
  ['phone', 'onboard.source.phone'],
  ['external', 'menu.sensorSource'],
];

const VEHICLE_OPTIONS: [VehicleType, MessageKey][] = [
  ['motorhome', 'vehicle.motorhome'],
  ['caravan', 'vehicle.caravan'],
];

// ADR 0014. Picking a source redraws at once, not only on Next: the
// "n / total" readout must match the path while choosing it.
export function sourceStep(state: WizardState): Step {
  return {
    title: t('onboard.source.h'),
    build: () => [
      paragraph(textClass(state), t('onboard.source.intro')),
      // The box is not in Settings: say where it lives (#365).
      paragraph(textClass(state), t('onboard.source.sensorIcon')),
      ...externalActiveNote(state),
      buildChoiceGroup('onboarding-source', SOURCE_OPTIONS, state.sensorChoice, (value) => {
        state.sensorChoice = value;
        state.render();
      }),
    ],
  };
}

// Never switches the source from here (ADR 0014).
function externalActiveNote(state: WizardState): Element[] {
  if (!state.externalActive) return [];
  const text = t('onboard.source.externalActive', { disconnect: t('sensorSource.disconnect') });
  return [paragraph(textClass(state), text)];
}

// Always asked once; every later step reads `vehicleChoice`.
export function vehicleStep(state: WizardState): Step {
  return {
    title: t('onboard.vehicle.h'),
    build: () => [
      paragraph(textClass(state), t('onboard.vehicle.intro')),
      buildChoiceGroup('onboarding-vehicle', VEHICLE_OPTIONS, state.vehicleChoice, (value) => {
        state.vehicleChoice = value;
      }),
    ],
  };
}
