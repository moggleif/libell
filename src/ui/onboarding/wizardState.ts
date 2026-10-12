import { createElement } from '../dom';
import type { LevelSettings, VehicleType } from '../../domain/settings';
import { hasAvailableExternalSensor } from '../../sensor/externalSensors';
import type { OnboardingOptions, SensorChoice } from './types';

/**
 * Everything the steps share while the wizard is open (#415): the caller's
 * options, the decisions fixed when it opened, and the choices the user
 * makes along the way. Passed to every step instead of closure state.
 */
export interface WizardState {
  readonly options: OnboardingOptions;
  /** Decided once, from `initialSettings`, never while the wizard is open. */
  readonly isModern: boolean;
  /** Same gate `main.ts` uses before offering the "External sensor" page. */
  readonly sourceChoiceAvailable: boolean;
  /** A box is the active source already (#287). */
  readonly externalActive: boolean;
  /** Starts at what is stored; every later step is built for it (#184). */
  vehicleChoice: VehicleType;
  /** 'phone' until the user picks otherwise. */
  sensorChoice: SensorChoice;
  /** The wizard's own latest save, so a Back visit shows it (#189). */
  currentSettings: LevelSettings;
  /** Redraws the current step, re-resolving the step list first. */
  render(): void;
}

export function createWizardState(options: OnboardingOptions, render: () => void): WizardState {
  return {
    options,
    isModern: options.initialSettings.appearance === 'modern',
    sourceChoiceAvailable: hasAvailableExternalSensor(),
    externalActive: options.getSensorSource() !== 'phone',
    vehicleChoice: options.initialSettings.vehicleType,
    sensorChoice: 'phone',
    currentSettings: options.initialSettings,
    render,
  };
}

/** The paragraph style for step text in the current appearance. */
export function textClass(state: WizardState): string {
  return state.isModern ? 'onboarding__text--modern' : 'menu__text';
}

export function paragraph(className: string, text: string): HTMLParagraphElement {
  const p = createElement('p', className);
  p.textContent = text;
  return p;
}
