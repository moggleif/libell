import { boxPositionStep, connectStep } from './boxSteps';
import { sensorCalibrationStep } from './calibrationStep';
import { sourceStep, vehicleStep } from './choiceSteps';
import { placementStep, readScreenStep } from './placementSteps';
import { measurementsStep, preferenceStep, rampsStep } from './settingsSteps';
import type { Step } from './types';
import { welcomeStep } from './welcomeStep';
import type { WizardState } from './wizardState';

// With a box already active (#287) the phone path leaves the calibration
// step out: #285 disables every phone-calibration action while a box is
// active, and the wizard never switches the source itself (ADR 0014).
function phoneSteps(state: WizardState): Step[] {
  const steps = [placementStep(state), measurementsStep(state), rampsStep(state)];
  return state.externalActive ? steps : [...steps, sensorCalibrationStep(state)];
}

function externalSteps(state: WizardState): Step[] {
  return [
    connectStep(state),
    boxPositionStep(state),
    readScreenStep(state),
    measurementsStep(state),
    rampsStep(state),
  ];
}

/** The step list for the path chosen so far: welcome and the three
 * preference steps always lead; the source step only exists when an
 * external sensor is available, and decides the rest. */
export function resolveSteps(state: WizardState): Step[] {
  const leading = [
    welcomeStep(state),
    preferenceStep(state, 'settings.language', 'language'),
    preferenceStep(state, 'settings.appearance', 'appearance'),
    preferenceStep(state, 'onboard.sound.h', 'sound'),
  ];
  if (!state.sourceChoiceAvailable) return [...leading, vehicleStep(state), ...phoneSteps(state)];
  const path = state.sensorChoice === 'external' ? externalSteps(state) : phoneSteps(state);
  return [...leading, sourceStep(state), vehicleStep(state), ...path];
}
