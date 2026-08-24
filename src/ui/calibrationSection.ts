/**
 * Calibration UI (one-shot + 180° flip), shared by the menu page and the
 * onboarding wizard. The host supplies sensor access through
 * `CalibrationOptions`; this module owns only the DOM and the flow.
 *
 * Modern appearance (#109) restyles this into two cards — sensor
 * calibration and vehicle zero (#83) — with a status pill each. Which
 * structure gets built is decided once, from `options.appearance` at
 * construction time (the same pattern `rvDiagram.ts` uses for
 * `rearAxle`): there is deliberately no live mid-session restructuring
 * if appearance changes elsewhere while this component is on screen.
 * All calibration logic (capture, flip flow, vehicle zero, check/age) is
 * unchanged and shared by both branches — only the container DOM and
 * classes differ.
 */
import type { AppearanceSetting, Calibration } from '../domain/settings';
import { flipCalibration } from '../domain/calibration';
import { t } from './i18n';

export interface CalibrationOptions {
  /**
   * Visual preset (#104), read once at construction — see the module doc
   * comment below for why there is no live restructuring.
   */
  appearance: AppearanceSetting;
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point. Returns an error text, or null on success. */
  calibrate(): string | null;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
  /** The vehicle zero (#83): the phone spot's own tilt, captured with the vehicle verified level. */
  getVehicleCalibration(): Calibration | null;
  /** Capture the current position as level. Returns an error text, or null on success. */
  calibrateVehicle(): string | null;
  /** When each calibration was captured (#87) — null when unknown. */
  getCalibrationCapturedAt(): number | null;
  getVehicleCalibrationCapturedAt(): number | null;
  /** Compare the current reading against a calibration's promise of zero — returns a verdict text. */
  checkCalibration(): string;
  checkVehicleCalibration(): string;
  clearVehicleCalibration(): void;
}

export interface CalibrationSection {
  element: HTMLElement;
  refresh(error?: string): void;
}

export function createCalibrationSection(options: CalibrationOptions): CalibrationSection {
  // Decided once, here — see the module doc comment (#109).
  const modern = options.appearance === 'modern';

  const calibrationBody = document.createElement('div');
  const sensorHeading = document.createElement('h3');
  sensorHeading.className = modern ? 'calibration-card__title' : 'menu__heading';
  sensorHeading.textContent = t('calibration.sensor.h');
  const calibrationIntro = document.createElement('p');
  calibrationIntro.className = modern ? 'calibration-card__body' : 'menu__text';
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

  // Modern-only status pill and side-by-side roll/pitch readings — the
  // same underlying values as `calibrationStatus`, just laid out as a
  // card instead of a sentence (#109). Never mounted in Classic mode.
  const sensorPill = document.createElement('span');
  const rollValue = document.createElement('span');
  const pitchValue = document.createElement('span');
  let sensorReadings: HTMLDivElement | null = null;
  if (modern) {
    sensorPill.className = 'calibration-card__pill';
    const rollLabel = document.createElement('span');
    rollLabel.className = 'calibration-card__reading-label';
    rollLabel.textContent = t('tilt.sideSide');
    rollValue.className = 'calibration-card__reading-value';
    const rollBox = document.createElement('div');
    rollBox.className = 'calibration-card__reading';
    rollBox.append(rollLabel, rollValue);

    const pitchLabel = document.createElement('span');
    pitchLabel.className = 'calibration-card__reading-label';
    pitchLabel.textContent = t('tilt.frontBack');
    pitchValue.className = 'calibration-card__reading-value';
    const pitchBox = document.createElement('div');
    pitchBox.className = 'calibration-card__reading';
    pitchBox.append(pitchLabel, pitchValue);

    sensorReadings = document.createElement('div');
    sensorReadings.className = 'calibration-card__readings';
    sensorReadings.append(rollBox, pitchBox);
  }

  // --- Vehicle zero (#83): the phone spot's own tilt — set with the
  // vehicle verified level and the phone in its normal place.
  const vehicleHeading = document.createElement('h3');
  vehicleHeading.className = modern ? 'calibration-card__title' : 'menu__heading';
  vehicleHeading.textContent = t('calibration.vehicle.h');
  const vehicleIntro = document.createElement('p');
  vehicleIntro.className = modern ? 'calibration-card__body' : 'menu__text';
  vehicleIntro.textContent = t('calibration.vehicle.intro');
  const vehicleStatus = document.createElement('p');
  vehicleStatus.className = 'menu__text menu__text--status';
  const vehicleButton = document.createElement('button');
  vehicleButton.type = 'button';
  // Modern wants this action secondary-styled, unlike the filled sensor
  // "Calibrate now" button (design handoff for #109).
  vehicleButton.className = modern ? 'menu__action menu__action--secondary' : 'menu__action';
  vehicleButton.textContent = t('calibration.vehicle.now');
  const vehicleClearButton = document.createElement('button');
  vehicleClearButton.type = 'button';
  vehicleClearButton.className = 'menu__action menu__action--secondary';
  vehicleClearButton.textContent = t('calibration.vehicle.clear');
  const vehiclePill = document.createElement('span');
  if (modern) vehiclePill.className = 'calibration-card__pill';

  // Check buttons (#87): compare the current reading against the stored
  // zero and answer plainly — grayed out while nothing is stored.
  const checkButton = document.createElement('button');
  checkButton.type = 'button';
  checkButton.className = 'menu__action menu__action--secondary';
  checkButton.textContent = t('calibration.check');
  const vehicleCheckButton = document.createElement('button');
  vehicleCheckButton.type = 'button';
  vehicleCheckButton.className = 'menu__action menu__action--secondary';
  vehicleCheckButton.textContent = t('calibration.check');

  /** "(14 days ago)" from a capture timestamp — empty when unknown (#87). */
  function ageText(capturedAt: number | null): string {
    if (capturedAt === null) return '';
    const days = Math.max(0, Math.floor((Date.now() - capturedAt) / 86_400_000));
    return ' ' + (days === 0 ? t('calibration.age.today') : t('calibration.age.days', { n: days }));
  }

  function refreshCalibration(error?: string): void {
    const calibration = options.getCalibration();
    if (error) {
      calibrationStatus.textContent = error;
    } else if (calibration) {
      calibrationStatus.textContent =
        t('calibration.status', {
          roll: calibration.rollDeg.toFixed(1),
          pitch: calibration.pitchDeg.toFixed(1),
        }) + ageText(options.getCalibrationCapturedAt());
    } else {
      calibrationStatus.textContent = t('calibration.status.none');
    }
    // Grayed out when there is nothing to clear or check.
    clearButton.disabled = !calibration;
    checkButton.disabled = !calibration;
    if (modern) {
      sensorPill.textContent = calibration
        ? t('calibration.pill.done')
        : t('calibration.pill.notDone');
      sensorPill.className = calibration
        ? 'calibration-card__pill calibration-card__pill--done'
        : 'calibration-card__pill calibration-card__pill--pending';
      rollValue.textContent = calibration ? `${calibration.rollDeg.toFixed(1)}°` : '—';
      pitchValue.textContent = calibration ? `${calibration.pitchDeg.toFixed(1)}°` : '—';
    }
    refreshVehicle();
  }

  function refreshVehicle(error?: string): void {
    const vehicle = options.getVehicleCalibration();
    if (error) {
      vehicleStatus.textContent = error;
    } else if (vehicle) {
      vehicleStatus.textContent =
        t('calibration.vehicle.status', {
          roll: vehicle.rollDeg.toFixed(1),
          pitch: vehicle.pitchDeg.toFixed(1),
        }) + ageText(options.getVehicleCalibrationCapturedAt());
    } else {
      vehicleStatus.textContent = t('calibration.vehicle.status.none');
    }
    vehicleClearButton.disabled = !vehicle;
    vehicleCheckButton.disabled = !vehicle;
    if (modern) {
      vehiclePill.textContent = vehicle ? t('calibration.pill.done') : t('calibration.pill.none');
      vehiclePill.className = vehicle
        ? 'calibration-card__pill calibration-card__pill--done'
        : 'calibration-card__pill';
    }
  }
  vehicleButton.addEventListener('click', () => {
    refreshVehicle(options.calibrateVehicle() ?? undefined);
  });
  vehicleClearButton.addEventListener('click', () => {
    options.clearVehicleCalibration();
    refreshVehicle();
  });
  checkButton.addEventListener('click', () => {
    refreshCalibration(options.checkCalibration());
  });
  vehicleCheckButton.addEventListener('click', () => {
    refreshVehicle(options.checkVehicleCalibration());
  });
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
  flipIntro.className = modern ? 'calibration-card__body' : 'menu__text';
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

  if (modern) {
    // Two cards (#109): sensor calibration, then vehicle zero. Each
    // reuses the exact same elements/handlers built above — only the
    // container shape changes.
    const sensorHeader = document.createElement('div');
    sensorHeader.className = 'calibration-card__header';
    sensorHeader.append(sensorHeading, sensorPill);
    const flipRow = document.createElement('div');
    flipRow.className = 'calibration-card__row';
    flipRow.append(flipButton, checkButton);
    const sensorCard = document.createElement('div');
    sensorCard.className = 'calibration-card';
    sensorCard.append(
      sensorHeader,
      calibrationIntro,
      // sensorReadings is always set when modern — see its declaration.
      sensorReadings as HTMLDivElement,
      calibrateButton,
      flipIntro,
      flipRow,
      flipStatus,
      clearButton,
      calibrationStatus,
    );

    const vehicleHeader = document.createElement('div');
    vehicleHeader.className = 'calibration-card__header';
    vehicleHeader.append(vehicleHeading, vehiclePill);
    const vehicleRow = document.createElement('div');
    vehicleRow.className = 'calibration-card__row';
    vehicleRow.append(vehicleCheckButton, vehicleClearButton);
    const vehicleCard = document.createElement('div');
    vehicleCard.className = 'calibration-card';
    vehicleCard.append(vehicleHeader, vehicleIntro, vehicleButton, vehicleRow, vehicleStatus);

    calibrationBody.className = 'calibration-cards';
    calibrationBody.append(sensorCard, vehicleCard);
  } else {
    calibrationBody.append(
      sensorHeading,
      calibrationIntro,
      calibrationStatus,
      calibrateButton,
      flipIntro,
      flipButton,
      flipStatus,
      checkButton,
      clearButton,
      vehicleHeading,
      vehicleIntro,
      vehicleStatus,
      vehicleButton,
      vehicleCheckButton,
      vehicleClearButton,
    );
  }
  return { element: calibrationBody, refresh: refreshCalibration };
}
