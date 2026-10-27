/**
 * Where the calibration controls go: the Modern cards, the Classic
 * sections, or the checklist's two numbered steps. Only the container DOM
 * differs; `calibrationSection.ts` wires the same controls into each.
 */
import type { CalibrationFlip } from './calibrationFlip';
import type { CalibrationControls } from './calibrationControls';
import type { CalibrationOptions } from './calibrationSection';
import { expandedStep, stepTitle, type CalibrationKind, type OpenStep } from './calibrationText';
import { createChecklistStep, expandStep, setStepDone, type ChecklistStep } from './checklistStep';
import { button, createElement, paragraph, textElement } from './dom';
import type { ExternalCalibration } from './externalCalibration';
import { t } from './i18n';

export type Layout = 'cards' | 'checklist' | 'wizard';

export interface Parts {
  phone: CalibrationControls;
  vehicle: CalibrationControls;
  flip: CalibrationFlip;
  external: ExternalCalibration;
}

/** `phoneElements` are hidden while a box is active. */
export interface LayoutResult {
  sensorElement: HTMLElement;
  vehicleElement: HTMLElement;
  /** Where more vehicle-zero content goes: inside the step's body in the
   * checklist, so it folds with it. */
  vehicleBody: HTMLElement;
  phoneElements: HTMLElement[];
  renderSteps: (() => void) | null;
}

function createMore(...buttons: HTMLButtonElement[]): HTMLDetailsElement {
  const more = createElement('details', 'menu__detail');
  const summary = textElement('summary', 'sensor-status__debug-summary', t('settings.more'));
  more.append(summary, ...buttons);
  return more;
}

function createPhoneStep(parts: Parts): ChecklistStep<CalibrationKind> {
  const step = createChecklistStep<CalibrationKind>('phone', 1);
  const flipLink = button('link-button', t('calibration.step.flipLink'));
  const flipBlock = document.createElement('div');
  flipBlock.hidden = true;
  const { flip, phone } = parts;
  flipBlock.append(flip.intro, flip.button, flip.status, flip.undo);
  flipLink.addEventListener('click', () => {
    flipBlock.hidden = !flipBlock.hidden;
    if (flipBlock.hidden) flip.reset();
  });
  step.body.append(
    paragraph('menu__text', t('calibration.step.phone.hint')),
    phone.capture,
    phone.status,
    phone.undo,
    flipLink,
    flipBlock,
    createMore(phone.check, phone.clear),
  );
  return step;
}

function createVehicleStep(vehicle: CalibrationControls): ChecklistStep<CalibrationKind> {
  const step = createChecklistStep<CalibrationKind>('vehicle', 2);
  vehicle.capture.textContent = t('calibration.step.vehicle.now');
  step.body.append(
    paragraph('menu__text', t('calibration.step.vehicle.hint')),
    vehicle.capture,
    vehicle.status,
    vehicle.undo,
    createMore(vehicle.check, vehicle.clear),
  );
  return step;
}

function layoutChecklist(
  options: CalibrationOptions,
  parts: Parts,
  body: HTMLElement,
  focus: { get(): OpenStep; set(step: OpenStep): void },
): LayoutResult {
  const steps = [createPhoneStep(parts), createVehicleStep(parts.vehicle)];
  const [phoneStep, vehicleStep] = steps as [
    ChecklistStep<CalibrationKind>,
    ChecklistStep<CalibrationKind>,
  ];
  const container = createElement('div', 'box-setup');
  container.append(phoneStep.element, vehicleStep.element);

  function renderSteps(): void {
    const phoneDone = options.getCalibration() !== null;
    const vehicleDone = options.getVehicleCalibration() !== null;
    phoneStep.title.textContent = stepTitle('phone', phoneDone, options.getCalibrationCapturedAt());
    vehicleStep.title.textContent = stepTitle(
      'vehicle',
      vehicleDone,
      options.getVehicleCalibrationCapturedAt(),
    );
    setStepDone(phoneStep, phoneDone);
    setStepDone(vehicleStep, vehicleDone);
    const open = expandedStep(focus.get(), phoneDone, vehicleDone);
    expandStep(steps, open === 'none' ? null : open);
    parts.phone.status.hidden = parts.phone.status.textContent === '';
    parts.vehicle.status.hidden = parts.vehicle.status.textContent === '';
  }
  for (const step of steps) {
    step.header.addEventListener('click', () => {
      focus.set(step.body.hidden ? step.id : 'none');
      renderSteps();
    });
  }

  // Keeps the box's card hidden in Modern (see `.calibration-cards`).
  if (options.appearance === 'modern') body.className = 'calibration-cards';
  if (offersExternal(options)) body.append(parts.external.element);
  body.append(container);
  return {
    sensorElement: phoneStep.element,
    vehicleElement: vehicleStep.element,
    vehicleBody: vehicleStep.body,
    phoneElements: [container],
    renderSteps,
  };
}

function createCard(header: HTMLElement[], ...content: HTMLElement[]): HTMLElement {
  const headerRow = createElement('div', 'calibration-card__header');
  headerRow.append(...header);
  const card = createElement('div', 'calibration-card');
  card.append(headerRow, ...content);
  return card;
}

function createRow(controls: CalibrationControls): HTMLElement {
  const row = createElement('div', 'calibration-card__row');
  row.append(controls.check, controls.clear);
  return row;
}

function layoutModernCards(
  options: CalibrationOptions,
  { phone, vehicle, flip, external }: Parts,
  body: HTMLElement,
  maintenance: boolean,
): LayoutResult {
  const sensorCard = createCard(
    [phone.heading, phone.pill],
    phone.intro,
    phone.capture,
    flip.intro,
    flip.button,
    flip.status,
    flip.undo,
    ...(maintenance ? [createRow(phone)] : []),
    phone.status,
    phone.undo,
  );
  const vehicleCard = createCard(
    [vehicle.heading, vehicle.pill],
    vehicle.intro,
    vehicle.capture,
    ...(maintenance ? [createRow(vehicle)] : []),
    vehicle.status,
    vehicle.undo,
  );
  body.className = 'calibration-cards';
  if (offersExternal(options)) body.append(external.element);
  body.append(sensorCard, vehicleCard);
  return {
    sensorElement: sensorCard,
    vehicleElement: vehicleCard,
    vehicleBody: vehicleCard,
    phoneElements: [sensorCard, vehicleCard],
    renderSteps: null,
  };
}

/** Two plain wrapper divs, so the wizard can split the halves onto
 * separate steps while `element` shows both. */
function layoutClassic(
  options: CalibrationOptions,
  { phone, vehicle, flip, external }: Parts,
  body: HTMLElement,
  maintenance: boolean,
): LayoutResult {
  const sensorSection = document.createElement('div');
  sensorSection.append(
    phone.heading,
    phone.intro,
    phone.status,
    phone.undo,
    phone.capture,
    flip.intro,
    flip.button,
    flip.status,
    flip.undo,
    ...(maintenance ? [phone.check, phone.clear] : []),
  );
  const vehicleSection = document.createElement('div');
  vehicleSection.append(
    vehicle.heading,
    vehicle.intro,
    vehicle.status,
    vehicle.undo,
    vehicle.capture,
    ...(maintenance ? [vehicle.check, vehicle.clear] : []),
  );
  if (offersExternal(options)) body.append(external.element);
  body.append(sensorSection, vehicleSection);
  return {
    sensorElement: sensorSection,
    vehicleElement: vehicleSection,
    vehicleBody: vehicleSection,
    phoneElements: [sensorSection, vehicleSection],
    renderSteps: null,
  };
}

function offersExternal(options: CalibrationOptions): boolean {
  return !!options.getBox && !!options.calibrateBox;
}

export function buildLayout(
  layout: Layout,
  options: CalibrationOptions,
  parts: Parts,
  body: HTMLElement,
  focus: { get(): OpenStep; set(step: OpenStep): void },
): LayoutResult {
  const maintenance = layout !== 'wizard';
  if (layout === 'checklist') return layoutChecklist(options, parts, body, focus);
  if (options.appearance === 'modern') return layoutModernCards(options, parts, body, maintenance);
  return layoutClassic(options, parts, body, maintenance);
}
