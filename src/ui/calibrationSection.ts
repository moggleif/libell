/**
 * Calibration UI (one-shot + 180° flip), shared by the menu page and the
 * onboarding wizard. The host supplies sensor access through
 * `CalibrationOptions`; this module owns only the DOM and the flow.
 */
import type { Calibration } from '../domain/settings';
import { flipCalibration } from '../domain/calibration';
import { t } from './i18n';

export interface CalibrationOptions {
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point. Returns an error text, or null on success. */
  calibrate(): string | null;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
}

export interface CalibrationSection {
  element: HTMLElement;
  refresh(error?: string): void;
}

export function createCalibrationSection(options: CalibrationOptions): CalibrationSection {
  const calibrationBody = document.createElement('div');
  const calibrationIntro = document.createElement('p');
  calibrationIntro.className = 'menu__text';
  calibrationIntro.textContent = t('calibration.intro');
  const calibrationStatus = document.createElement('p');
  calibrationStatus.className = 'menu__text menu__text--status';
  const calibrateButton = document.createElement('button');
  calibrateButton.type = 'button';
  calibrateButton.className = 'menu__action';
  calibrateButton.textContent = t('calibration.now');
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'menu__action menu__action--secondary';
  clearButton.textContent = t('calibration.clear');

  function refreshCalibration(error?: string): void {
    const calibration = options.getCalibration();
    if (error) {
      calibrationStatus.textContent = error;
    } else if (calibration) {
      calibrationStatus.textContent = t('calibration.status', {
        roll: calibration.rollDeg.toFixed(1),
        pitch: calibration.pitchDeg.toFixed(1),
      });
    } else {
      calibrationStatus.textContent = t('calibration.status.none');
    }
    // Grayed out when there is nothing to clear.
    clearButton.disabled = !calibration;
  }
  calibrateButton.addEventListener('click', () => {
    refreshCalibration(options.calibrate() ?? undefined);
  });
  clearButton.addEventListener('click', () => {
    options.clearCalibration();
    refreshCalibration();
  });

  // Flip calibration: two captures with a 180° turn in between — works
  // on any reasonably flat spot, no known-level surface needed (#50).
  const flipIntro = document.createElement('p');
  flipIntro.className = 'menu__text';
  flipIntro.textContent = t('calibration.flip.intro');
  const flipStatus = document.createElement('p');
  flipStatus.className = 'menu__text menu__text--status';
  const flipButton = document.createElement('button');
  flipButton.type = 'button';
  flipButton.className = 'menu__action menu__action--secondary';
  let flipFirst: Calibration | null = null;

  function resetFlip(): void {
    flipFirst = null;
    flipButton.textContent = t('calibration.flip.start');
    flipStatus.textContent = '';
  }
  flipButton.addEventListener('click', () => {
    const reading = options.readTilt();
    if (typeof reading === 'string') {
      flipStatus.textContent = reading;
      return;
    }
    if (!flipFirst) {
      flipFirst = reading;
      flipButton.textContent = t('calibration.flip.capture');
      flipStatus.textContent = t('calibration.flip.rotate');
      return;
    }
    const result = flipCalibration(flipFirst, reading);
    if (!result.consistent) {
      resetFlip();
      flipStatus.textContent = t('calibration.flip.err.moved');
      return;
    }
    options.applyCalibration(result.bias);
    resetFlip();
    const surfaceMax = Math.max(
      Math.abs(result.surface.rollDeg),
      Math.abs(result.surface.pitchDeg),
    );
    flipStatus.textContent = t('calibration.flip.done', { surface: surfaceMax.toFixed(1) });
    refreshCalibration();
  });
  resetFlip();
  refreshCalibration();
  calibrationBody.append(
    calibrationIntro,
    calibrationStatus,
    calibrateButton,
    flipIntro,
    flipButton,
    flipStatus,
    clearButton,
  );
  return { element: calibrationBody, refresh: refreshCalibration };
}
