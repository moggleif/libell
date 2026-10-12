/**
 * The calibration lamp follows the ACTIVE source (ADR 0014): the phone's
 * sensor calibration, then its vehicle zero, while the phone is in use, or
 * just the box's installation offset while a box is — never both, so
 * connecting a box with no offset yet still warns even if the phone was
 * calibrated long ago, and vice versa. A box chosen in the wizard but not
 * connected yet counts as the box. Demo mode presents as a configured app.
 */
import { phoneCalibrationLamp, type CalibrationLamp, type Indicators } from '../ui/indicators';

export interface IndicatorInputs {
  demo: boolean;
  measurementsSaved: boolean;
  phoneActive: boolean;
  boxPending: boolean;
  phoneCalibrated: boolean;
  phoneZeroed: boolean;
  boxZeroed: boolean;
}

export type IndicatorState = Required<Parameters<Indicators['update']>[0]>;

export function indicatorState(inputs: IndicatorInputs): IndicatorState {
  const awaitingBox = inputs.phoneActive && inputs.boxPending;
  return {
    settingsSaved: inputs.demo || inputs.measurementsSaved,
    calibrationLamp: inputs.demo ? null : calibrationLamp(inputs, awaitingBox),
    externalSensor: !inputs.phoneActive || awaitingBox,
  };
}

function calibrationLamp(inputs: IndicatorInputs, awaitingBox: boolean): CalibrationLamp {
  if (awaitingBox) return 'zero';
  if (inputs.phoneActive) return phoneCalibrationLamp(inputs.phoneCalibrated, inputs.phoneZeroed);
  return inputs.boxZeroed ? null : 'zero';
}
