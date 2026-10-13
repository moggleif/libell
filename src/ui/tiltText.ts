/**
 * A tilt in degrees, written the same way everywhere it is shown (#510):
 * front/back first, then side/side, each with its sign and one decimal.
 */
import type { Calibration } from '../domain/calibration';
import { t } from './i18n';

/** One angle: "+0.3°" or "−1.3°" (a true minus sign). */
export function signedDegrees(degrees: number): string {
  return `${degrees >= 0 ? '+' : '−'}${Math.abs(degrees).toFixed(1)}°`;
}

/** "Front/back +0.3° · Side/side −1.3°". */
export function tiltDegreesText(tilt: Calibration, separator = ' · '): string {
  return (
    `${t('tilt.frontBack')} ${signedDegrees(tilt.pitchDeg)}` +
    `${separator}${t('tilt.sideSide')} ${signedDegrees(tilt.rollDeg)}`
  );
}
