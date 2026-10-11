/**
 * What the dashboard lamps show (#392, step 3), as a pure decision.
 *
 * The calibration lamp follows the ACTIVE source (#131, ADR 0014): the
 * phone's sensor calibration, then its vehicle zero (#364), while the
 * phone is in use, or just the box's installation offset while a box is
 * — never both, so connecting a box with no offset yet still warns even
 * if the phone was calibrated long ago, and vice versa. A box chosen in
 * the wizard but not connected yet (#365) counts as the box. Demo mode
 * presents as a configured app (#70).
 */
import { phoneCalibrationLamp, type CalibrationLamp, type Indicators } from '../ui/indicators';

export interface IndicatorInputs {
  demo: boolean;
  /** The vehicle measurements have been saved (#364). */
  measurementsSaved: boolean;
  phoneActive: boolean;
  boxPending: boolean;
  phoneCalibrated: boolean;
  phoneZeroed: boolean;
  /** The active box has an installation offset. */
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
