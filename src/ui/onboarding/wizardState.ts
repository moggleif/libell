import type { LevelSettings, VehicleType } from '../../domain/settings';
import { hasAvailableBox } from '../../sensor/boxes';
import type { OnboardingOptions, SensorChoice } from './types';

/** Passed to every step instead of closure state. */
export interface WizardState {
  readonly options: OnboardingOptions;
  /** Decided once, from `initialSettings`, never while the wizard is open. */
  readonly isModern: boolean;
  /** Same gate `main.ts` uses before offering the "External sensor" page. */
  readonly sourceChoiceAvailable: boolean;
  readonly externalActive: boolean;
  /** Starts at what is stored; every later step is built for it. */
  vehicleChoice: VehicleType;
  /** 'phone' until the user picks otherwise. */
  sensorChoice: SensorChoice;
  /** The wizard's own latest save, so a Back visit shows it. */
  currentSettings: LevelSettings;
  /** Re-resolves the step list first. */
  render(): void;
}

export function createWizardState(options: OnboardingOptions, render: () => void): WizardState {
  return {
    options,
    isModern: options.initialSettings.appearance === 'modern',
    sourceChoiceAvailable: hasAvailableBox(),
    externalActive: options.getSensorSource() !== 'phone',
    vehicleChoice: options.initialSettings.vehicleType,
    sensorChoice: 'phone',
    currentSettings: options.initialSettings,
    render,
  };
}

export function textClass(state: WizardState): string {
  return state.isModern ? 'onboarding__text--modern' : 'menu__text';
}
