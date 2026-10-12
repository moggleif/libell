import type { VehicleType } from '../../domain/settings';
import { t, type MessageKey } from '../i18n';
import { buildChoiceGroup } from './choiceGroup';
import type { SensorChoice, Step } from './types';
import { paragraph, textClass, type WizardState } from './wizardState';

// 'menu.sensorSource' ("External sensor") is reused verbatim for the
// external radio's label (screen-cleanup follow-up) — no separate
// "Libell Sensor" product name, which was never real and never will be.
const SOURCE_OPTIONS: [SensorChoice, MessageKey][] = [
  ['phone', 'onboard.source.phone'],
  ['external', 'menu.sensorSource'],
];

// Reuses 'vehicle.motorhome'/'vehicle.caravan' — the exact labels
// Settings already shows for this same choice (#184).
const VEHICLE_OPTIONS: [VehicleType, MessageKey][] = [
  ['motorhome', 'vehicle.motorhome'],
  ['caravan', 'vehicle.caravan'],
];

// "How do you want to measure?" (#135, ADR 0014). Picking a source redraws
// at once, not only on Next (#189 follow-up): the "n / total" readout must
// match the path chosen while choosing it.
export function sourceStep(state: WizardState): Step {
  return {
    title: t('onboard.source.h'),
    build: () => [
      paragraph(textClass(state), t('onboard.source.intro')),
      ...externalActiveNote(state),
      buildChoiceGroup('onboarding-source', SOURCE_OPTIONS, state.sensorChoice, (value) => {
        state.sensorChoice = value;
        state.render();
      }),
    ],
  };
}

// With a box already active (#287), say up front what the phone path
// leaves out and where to switch — never switch from here (ADR 0014).
function externalActiveNote(state: WizardState): Element[] {
  if (!state.externalActive) return [];
  const text = t('onboard.source.externalActive', { disconnect: t('sensorSource.disconnect') });
  return [paragraph(textClass(state), text)];
}

// "What are you leveling?" (#184) — always asked once. Every later step
// reads `vehicleChoice` to match.
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
