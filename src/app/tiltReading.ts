/**
 * Reading the active sensor's tilt in degrees (#374, step 2): the one
 * conversion every calibration, check and target action starts from.
 */
import { tiltFromGravity } from '../domain/leveling';
import type { Calibration } from '../domain/settings';
import type { OrientationSensor } from '../sensor/orientation';
import { t } from '../ui/i18n';

const RAD_TO_DEG = 180 / Math.PI;

/** A capture steeper than this on either axis is not "level", whatever it is. */
const MAX_CALIBRATION_DEG = 15;

/** Whether a reading is too steep to store as a calibration or a zero. */
export function exceedsCalibrationLimit(reading: Calibration): boolean {
  return (
    Math.abs(reading.rollDeg) > MAX_CALIBRATION_DEG ||
    Math.abs(reading.pitchDeg) > MAX_CALIBRATION_DEG
  );
}

/**
 * The sensor's raw tilt, or the message to show when there is none yet.
 * Starting the sensor on demand makes calibration work from the wizard
 * before the main screen exists (the tap itself is the iOS permission
 * gesture).
 */
export function readTilt(sensor: OrientationSensor): Calibration | string {
  const gravity = sensor.getGravity();
  if (!gravity) {
    void sensor.start();
    return t('calibration.err.notRunning');
  }
  return {
    rollDeg: Math.atan2(gravity.x, gravity.z) * RAD_TO_DEG,
    pitchDeg: Math.atan2(gravity.y, gravity.z) * RAD_TO_DEG,
  };
}

/**
 * The tilt with `calibration` subtracted, for a passive live readout (the
 * box page's reading row). Never starts the sensor: a refresh must never
 * itself trigger a permission prompt.
 */
export function calibratedTilt(
  sensor: OrientationSensor,
  calibration: Calibration | null,
): Calibration | null {
  const gravity = sensor.getGravity();
  if (!gravity) return null;
  const tilt = tiltFromGravity(gravity, calibration);
  return { rollDeg: tilt.roll * RAD_TO_DEG, pitchDeg: tilt.pitch * RAD_TO_DEG };
}
