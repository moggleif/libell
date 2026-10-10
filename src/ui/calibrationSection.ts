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
 *
 * Settings (#330) asks for a third shape, `layout: 'checklist'`: the two
 * calibrations as two steps of the same checklist the box's own setup uses
 * (#314) — ✓ and age when done, the one action when not, only the next
 * undone step expanded and Check/Clear under a collapsed More in each.
 * The wizard keeps the cards: it already shows one calibration per step.
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
  /**
   * Whether the phone itself is the active sensor (#285). Every action here
   * calibrates the phone, which an external sensor never reads, so while one
   * is active they are hidden and the box's own zero is shown in their
   * place (#316). Omitted = phone.
   */
  isPhoneActive?(): boolean;
  /**
   * The active external sensor, or null while the phone is active (#290):
   * its name and its installation-offset state. With one, this tab offers
   * to calibrate the sensor itself rather than only saying why the phone's
   * calibration is switched off. Omitted = never offered.
   */
  getExternalSensor?(): ExternalSensorCalibrationState | null;
  /** "Set vehicle level" for that sensor — the same action as on its own
   * page (R34), which for a box that zeroes itself is asynchronous. Returns
   * an error text, or null on success. */
  calibrateExternalSensor?(): string | null | Promise<string | null>;
  /** Opens the active box's own page (#316), for its position and
   * direction; no link is shown when omitted. */
  openExternalSensor?(): void;
}

export interface ExternalSensorCalibrationState {
  name: string;
  offset: Calibration | null;
  capturedAt: number | null;
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

export function createCalibrationSection(
  options: CalibrationOptions,
  layout: 'cards' | 'checklist' = 'cards',
): CalibrationSection {
  // Decided once, here — see the module doc comment (#109).
  const modern = options.appearance === 'modern';
  const checklist = layout === 'checklist';
  /** Checklist only: the step kept open by the user or by a message
   * shown in it; null follows "the next undone step". */
  let openStep: 'phone' | 'vehicle' | 'none' | null = null;
  /** Checklist only: redraws the steps, set once the layout exists. */
  let renderSteps: (() => void) | null = null;

  const calibrationBody = document.createElement('div');
  /** Everything that calibrates the phone, hidden while a box is active. */
  const phoneElements: HTMLElement[] = [];

  // Calibrating the active external sensor (#290), in the place a user
  // looks for calibration: shown only while one is active, above the
  // phone's own (then disabled) controls. Not built at all for a host that
  // offers no external sensor (the onboarding wizard's phone steps).
  const offersExternal = !!options.getExternalSensor && !!options.calibrateExternalSensor;
  const externalSection = document.createElement('div');
  externalSection.className = modern ? 'calibration-card' : '';
  externalSection.hidden = true;
  const externalHeading = document.createElement('h3');
  externalHeading.className = modern ? 'calibration-card__title' : 'menu__heading';
  const externalIntro = document.createElement('p');
  externalIntro.className = modern ? 'calibration-card__body' : 'menu__text';
  externalIntro.textContent = t('calibration.external.intro');
  const externalButton = document.createElement('button');
  externalButton.type = 'button';
  externalButton.className = 'menu__action';
  externalButton.textContent = t('sensorSource.install.now');
  const externalStatus = document.createElement('p');
  externalStatus.className = 'menu__text menu__text--status';
  externalSection.append(externalHeading, externalIntro, externalButton, externalStatus);
  // The way to the rest of the box's setup (#316): its position and
  // direction live on its own page, one quiet link away.
  if (options.openExternalSensor) {
    const openBox = document.createElement('button');
    openBox.type = 'button';
    openBox.className = 'link-button';
    openBox.textContent = t('pose.openSensorPage');
    openBox.addEventListener('click', () => options.openExternalSensor?.());
    externalSection.append(openBox);
  }

  function refreshExternal(message?: string): void {
    const external = options.getExternalSensor?.() ?? null;
    externalSection.hidden = external === null;
    if (!external) return;
    externalHeading.textContent = t('calibration.external.h', { name: external.name });
    if (message !== undefined) {
      externalStatus.textContent = message;
    } else if (external.offset) {
      externalStatus.textContent =
        t('sensorSource.install.status', {
          roll: external.offset.rollDeg.toFixed(1),
          pitch: external.offset.pitchDeg.toFixed(1),
        }) + ageText(external.capturedAt);
    } else {
      externalStatus.textContent = t('sensorSource.install.status.none');
    }
  }

  externalButton.addEventListener('click', () => {
    const name = options.getExternalSensor?.()?.name ?? '';
    const done = (error: string | null) =>
      refreshExternal(error ?? t('calibration.external.done', { name }));
    const result = options.calibrateExternalSensor?.() ?? null;
    if (!(result instanceof Promise)) {
      done(result);
      return;
    }
    externalButton.disabled = true;
    refreshExternal(t('calibration.external.working'));
    void result.then((error) => {
      externalButton.disabled = false;
      done(error);
    });
  });
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

  // Greys out every phone-calibration action while an external sensor is
  // the active source (#285) — run last in both refreshes so it wins over
  // their own "nothing to clear/check" logic.
  function applyPhoneGate(): void {
    const phoneActive = options.isPhoneActive?.() ?? true;
    // And hides them (Morgan, after #290): a page of greyed-out phone
    // cards buried the one thing that applies, the box's own calibration.
    for (const element of phoneElements) element.hidden = !phoneActive;
    if (externalButton.disabled === false) refreshExternal();
    if (phoneActive) {
      // Clear/Check are re-derived by the refreshes; the capture actions
      // are only ever disabled by this gate, so lift it here.
      for (const button of [calibrateButton, flipButton, vehicleButton]) button.disabled = false;
      return;
    }
    for (const button of [
      calibrateButton,
      clearButton,
      checkButton,
      flipButton,
      vehicleButton,
      vehicleClearButton,
      vehicleCheckButton,
    ]) {
      button.disabled = true;
    }
  }

  function refreshCalibration(error?: string): void {
    const calibration = options.getCalibration();
    if (error) {
      calibrationStatus.textContent = error;
    } else if (checklist) {
      // The step's title carries ✓ and the age; the line is for messages.
      calibrationStatus.textContent = '';
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
    applyPhoneGate();
  }

  function refreshVehicle(error?: string): void {
    const vehicle = options.getVehicleCalibration();
    if (error) {
      vehicleStatus.textContent = error;
    } else if (checklist) {
      vehicleStatus.textContent = '';
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
    renderSteps?.();
    applyPhoneGate();
  }
  // `openStep` (checklist only): a step showing a message stays open; a
  // success or a clear hands over to the next undone step.
  vehicleButton.addEventListener('click', () => {
    const error = options.calibrateVehicle() ?? undefined;
    openStep = error ? 'vehicle' : null;
    refreshVehicle(error);
  });
  vehicleClearButton.addEventListener('click', () => {
    options.clearVehicleCalibration();
    openStep = null;
    refreshVehicle();
  });
  checkButton.addEventListener('click', () => {
    openStep = 'phone';
    refreshCalibration(options.checkCalibration());
  });
  vehicleCheckButton.addEventListener('click', () => {
    openStep = 'vehicle';
    refreshVehicle(options.checkVehicleCalibration());
  });
  calibrateButton.addEventListener('click', () => {
    const error = options.calibrate() ?? undefined;
    openStep = error ? 'phone' : null;
    refreshCalibration(error);
  });
  clearButton.addEventListener('click', () => {
    options.clearCalibration();
    openStep = null;
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
    openStep = 'phone';
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

  if (checklist) {
    // Same step DOM and classes as the box's checklist (#314).
    const makeStep = (
      id: 'phone' | 'vehicle',
      number: number,
    ): { element: HTMLElement; mark: HTMLElement; title: HTMLElement; body: HTMLElement } => {
      const element = document.createElement('div');
      element.className = 'box-step';
      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'box-step__header';
      const mark = document.createElement('span');
      mark.className = 'box-step__mark';
      mark.textContent = String(number);
      const title = document.createElement('span');
      title.className = 'box-step__title';
      header.append(mark, title);
      const body = document.createElement('div');
      body.className = 'box-step__body';
      body.hidden = true;
      element.append(header, body);
      header.addEventListener('click', () => {
        openStep = body.hidden ? id : 'none';
        renderSteps?.();
      });
      return { element, mark, title, body };
    };
    const makeMore = (...buttons: HTMLButtonElement[]): HTMLDetailsElement => {
      const more = document.createElement('details');
      more.className = 'menu__detail box-more';
      const summary = document.createElement('summary');
      summary.className = 'sensor-status__debug-summary';
      summary.textContent = t('settings.more');
      more.append(summary, ...buttons);
      return more;
    };
    const hint = (key: 'calibration.step.phone.hint' | 'calibration.step.vehicle.hint') => {
      const p = document.createElement('p');
      p.className = 'menu__text';
      p.textContent = t(key);
      return p;
    };

    // 1. The phone: lay it on something flat, or flip it where nothing is.
    const phoneStep = makeStep('phone', 1);
    const flipLink = document.createElement('button');
    flipLink.type = 'button';
    flipLink.className = 'link-button';
    flipLink.textContent = t('calibration.step.flipLink');
    const flipBlock = document.createElement('div');
    flipBlock.hidden = true;
    flipBlock.append(flipIntro, flipButton, flipStatus);
    flipLink.addEventListener('click', () => {
      flipBlock.hidden = !flipBlock.hidden;
      if (flipBlock.hidden) resetFlip();
    });
    phoneStep.body.append(
      hint('calibration.step.phone.hint'),
      calibrateButton,
      calibrationStatus,
      flipLink,
      flipBlock,
      makeMore(checkButton, clearButton),
    );

    // 2. The vehicle zero: the vehicle levelled, the phone in its spot.
    const vehicleStep = makeStep('vehicle', 2);
    vehicleButton.textContent = t('calibration.step.vehicle.now');
    vehicleStep.body.append(
      hint('calibration.step.vehicle.hint'),
      vehicleButton,
      vehicleStatus,
      makeMore(vehicleCheckButton, vehicleClearButton),
    );

    const steps = document.createElement('div');
    steps.className = 'box-setup';
    steps.append(phoneStep.element, vehicleStep.element);

    renderSteps = (): void => {
      const phoneDone = options.getCalibration() !== null;
      const vehicleDone = options.getVehicleCalibration() !== null;
      phoneStep.title.textContent = phoneDone
        ? t('calibration.step.phone.done') + ageText(options.getCalibrationCapturedAt())
        : t('calibration.sensor.h');
      vehicleStep.title.textContent = vehicleDone
        ? t('calibration.step.vehicle.done') + ageText(options.getVehicleCalibrationCapturedAt())
        : t('calibration.vehicle.h');
      for (const [step, done, n] of [
        [phoneStep, phoneDone, 1],
        [vehicleStep, vehicleDone, 2],
      ] as const) {
        step.element.classList.toggle('is-done', done);
        step.mark.textContent = done ? '✓' : String(n);
      }
      // Guidance, never a gate: the next undone step is open, but any
      // step opens on a tap and stays open while it shows a message.
      const open = openStep ?? (!phoneDone ? 'phone' : !vehicleDone ? 'vehicle' : 'none');
      for (const [step, id] of [
        [phoneStep, 'phone'],
        [vehicleStep, 'vehicle'],
      ] as const) {
        step.body.hidden = open !== id;
        step.element.classList.toggle('is-open', open === id);
      }
      calibrationStatus.hidden = calibrationStatus.textContent === '';
      vehicleStatus.hidden = vehicleStatus.textContent === '';
    };

    // Keeps the box's card hidden in Modern (see `.calibration-cards`).
    if (modern) calibrationBody.className = 'calibration-cards';
    if (offersExternal) calibrationBody.append(externalSection);
    calibrationBody.append(steps);
    phoneElements.push(steps);
    sensorElement = phoneStep.element;
    vehicleElement = vehicleStep.element;
    renderSteps();
  } else if (modern) {
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
    if (offersExternal) calibrationBody.append(externalSection);
    calibrationBody.append(sensorCard, vehicleCard);
    phoneElements.push(sensorCard, vehicleCard);
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
    if (offersExternal) calibrationBody.append(externalSection);
    calibrationBody.append(sensorSection, vehicleSection);
    phoneElements.push(sensorSection, vehicleSection);
    sensorElement = sensorSection;
    vehicleElement = vehicleSection;
  }
  // The first refresh ran before the layout existed; hide what it could not.
  applyPhoneGate();
  return {
    element: calibrationBody,
    sensorElement,
    vehicleElement,
    // Reopening the page follows "the next undone step" again (#330).
    refresh: (error?: string) => {
      openStep = null;
      refreshCalibration(error);
    },
  };
}
