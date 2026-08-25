/**
 * Calibration UI (one-shot + 180° flip), shared by the menu page and the
 * onboarding wizard. The host supplies sensor access through
 * `CalibrationOptions`; this module owns the DOM and the flow, and is the
 * single source of truth for both halves' copy and behavior — Settings
 * and the wizard show the exact same sensor-calibration and vehicle-zero
 * UI, never a wizard-only reduced rebuild of either (#184). The wizard
 * places the two halves on separate steps (design-review follow-up: one
 * concept per step, matching the rest of the wizard) via `sensorElement`/
 * `vehicleElement`; Settings shows both together via `element`.
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
import { ageText } from './calibrationAge';
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
  /** Both halves together, as Settings → Calibration shows them. */
  element: HTMLElement;
  /** Phone-sensor half alone (design-review follow-up): lets a caller —
   * the onboarding wizard — place the two halves on separate steps
   * instead of stacking both under one heading. Live in `element` too;
   * moving either into a different parent (e.g. a wizard step's body)
   * re-parents it away from `element`, which is fine — nothing here reads
   * from `element`'s children after construction. */
  sensorElement: HTMLElement;
  /** Vehicle-zero half alone — see `sensorElement`. */
  vehicleElement: HTMLElement;
  refresh(error?: string): void;
}

export function createCalibrationSection(options: CalibrationOptions): CalibrationSection {
  // Decided once, here — see the module doc comment (#109).
  const modern = options.appearance === 'modern';

  const calibrationBody = document.createElement('div');
  // Design review: the two-layer overview used to live only on the Help
  // page — moved here, at the top of the actual Kalibrering tab, where it
  // is actionable. Only a child of `calibrationBody` (not `sensorElement`/
  // `vehicleElement`), so the onboarding wizard — which re-parents those
  // two individually onto separate steps — never picks it up.
  const guideIntro = document.createElement('p');
  guideIntro.className = modern ? 'calibration-card__body' : 'menu__text';
  guideIntro.textContent = t('calibration.guide.intro');
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

  // Modern-only status pill (#109) — the roll/pitch numbers themselves
  // live only in `calibrationStatus`'s sentence below, the same "good
  // layout" the vehicle-zero card always used (design review, follow-up:
  // a separate numeric readout box here was tried and rejected — the
  // status sentence already says the numbers, a second copy was noise).
  const sensorPill = document.createElement('span');
  if (modern) sensorPill.className = 'calibration-card__pill';

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
  // All three calibrate actions (sensor, vehicle zero, flip) are equally
  // primary — a user only ever does one of them at a time, so there is no
  // "the real one" to single out as filled while the others fade to
  // outline (follow-up to #109's original secondary styling).
  vehicleButton.className = 'menu__action';
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
  // Primary-styled like the other two calibrate actions above — see that
  // comment.
  flipButton.className = 'menu__action';
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

  let sensorElement: HTMLElement;
  let vehicleElement: HTMLElement;

  if (modern) {
    // Two cards (#109): sensor calibration, then vehicle zero. Each
    // reuses the exact same elements/handlers built above — only the
    // container shape changes.
    const sensorHeader = document.createElement('div');
    sensorHeader.className = 'calibration-card__header';
    sensorHeader.append(sensorHeading, sensorPill);
    // Check + Clear side by side (design review, follow-up) — same
    // pairing as the vehicle-zero card's own row below, not paired with
    // the unrelated flip button.
    const checkClearRow = document.createElement('div');
    checkClearRow.className = 'calibration-card__row';
    checkClearRow.append(checkButton, clearButton);
    const sensorCard = document.createElement('div');
    sensorCard.className = 'calibration-card';
    sensorCard.append(
      sensorHeader,
      calibrationIntro,
      calibrateButton,
      flipIntro,
      flipButton,
      flipStatus,
      checkClearRow,
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
    calibrationBody.append(guideIntro, sensorCard, vehicleCard);
    sensorElement = sensorCard;
    vehicleElement = vehicleCard;
  } else {
    // Two plain wrapper divs, not flat siblings (design-review follow-up):
    // lets a caller split the two halves onto separate steps (the
    // onboarding wizard) while `element` below still shows both together,
    // identically to before — an unstyled div changes nothing visually.
    const sensorSection = document.createElement('div');
    sensorSection.append(
      sensorHeading,
      calibrationIntro,
      calibrationStatus,
      calibrateButton,
      flipIntro,
      flipButton,
      flipStatus,
      checkButton,
      clearButton,
    );
    const vehicleSection = document.createElement('div');
    vehicleSection.append(
      vehicleHeading,
      vehicleIntro,
      vehicleStatus,
      vehicleButton,
      vehicleCheckButton,
      vehicleClearButton,
    );
    calibrationBody.append(guideIntro, sensorSection, vehicleSection);
    sensorElement = sensorSection;
    vehicleElement = vehicleSection;
  }
  return { element: calibrationBody, sensorElement, vehicleElement, refresh: refreshCalibration };
}
