/**
 * Calibration UI (one-shot + 180° flip), the single source of truth for both
 * Settings and the onboarding wizard: never a wizard-only reduced rebuild.
 * The wizard places the two halves on separate steps via `sensorElement`/
 * `vehicleElement`.
 *
 * The structure is decided once, at construction, from `options.appearance`
 * and `layout`: there is deliberately no live restructuring if appearance
 * changes while this is on screen. Only the container DOM differs between
 * layouts; the calibration logic is shared. `layout: 'wizard'` drops
 * Check/Clear: a first run has nothing to check or clear yet.
 */
import type { AppearanceSetting } from '../domain/settings';
import type { Calibration, CaptureResult } from '../domain/calibration';
import { createCalibrationFlip, type CalibrationFlip } from './calibrationFlip';
import {
  calibrationStatusText,
  captureMessage,
  expandedStep,
  pillFor,
  stepTitle,
  type CalibrationKind,
  type OpenStep,
} from './calibrationText';
import { createChecklistStep, expandStep, setStepDone, type ChecklistStep } from './checklistStep';
import { createElement } from './dom';
import { createExternalCalibration, type ExternalCalibration } from './externalCalibration';
import { t } from './i18n';

export interface CalibrationOptions {
  /** Read once at construction; see the module doc comment. */
  appearance: AppearanceSetting;
  getCalibration(): Calibration | null;
  /** Null on success, an error text, or a warning that offers "Calibrate
   * anyway"; `anyway` is set when the user chose it. */
  calibrate(anyway?: boolean): CaptureResult;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
  /** The phone spot's own tilt, captured with the vehicle verified level. */
  getVehicleCalibration(): Calibration | null;
  /** Answers like `calibrate`, with "Zero anyway" for its warning. */
  calibrateVehicle(anyway?: boolean): CaptureResult;
  /** Null when unknown. */
  getCalibrationCapturedAt(): number | null;
  getVehicleCalibrationCapturedAt(): number | null;
  /** Compares the current reading against the stored zero; returns a verdict text. */
  checkCalibration(): string;
  checkVehicleCalibration(): string;
  clearVehicleCalibration(): void;
  /**
   * Every action here calibrates the phone, which an external sensor never
   * reads, so while one is active they are hidden and the box's own zero is
   * shown instead. Omitted = phone.
   */
  isPhoneActive?(): boolean;
  /** Null while the phone is active. Omitted = never offered. */
  getExternalSensor?(): ExternalSensorCalibrationState | null;
  /** The same action as on the box's own page (R34); asynchronous for a box
   * that zeroes itself. */
  calibrateExternalSensor?(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  /** No link is shown when omitted. */
  openExternalSensor?(): void;
}

export interface ExternalSensorCalibrationState {
  name: string;
  offset: Calibration | null;
  capturedAt: number | null;
}

export interface CalibrationSection {
  /** Both halves together. */
  element: HTMLElement;
  /** Also inside `element`; re-parenting it elsewhere is safe, since nothing
   * reads `element`'s children after construction. */
  sensorElement: HTMLElement;
  /** See `sensorElement`. */
  vehicleElement: HTMLElement;
  refresh(error?: string): void;
}

type Layout = 'cards' | 'checklist' | 'wizard';

interface CalibrationControls {
  heading: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  capture: HTMLButtonElement;
  /** Shown only while a capture's tilt warning is up. */
  anyway: HTMLButtonElement;
  check: HTMLButtonElement;
  clear: HTMLButtonElement;
  /** Modern only: the numbers live in the status sentence alone. */
  pill: HTMLElement;
}

const CONTROL_KEYS = {
  phone: {
    heading: 'calibration.sensor.h',
    intro: 'calibration.intro',
    capture: 'calibration.now',
    anyway: 'calibration.anyway',
    clear: 'calibration.clear',
  },
  vehicle: {
    heading: 'calibration.vehicle.h',
    intro: 'calibration.vehicle.intro',
    capture: 'calibration.vehicle.now',
    anyway: 'calibration.vehicle.anyway',
    clear: 'calibration.vehicle.clear',
  },
} as const;

function button(className: string, text: string): HTMLButtonElement {
  const element = createElement('button', className);
  element.type = 'button';
  element.textContent = text;
  return element;
}

function createControls(kind: CalibrationKind, modern: boolean): CalibrationControls {
  const keys = CONTROL_KEYS[kind];
  const heading = createElement('h3', modern ? 'calibration-card__title' : 'menu__heading');
  heading.textContent = t(keys.heading);
  const intro = createElement('p', modern ? 'calibration-card__body' : 'menu__text');
  intro.textContent = t(keys.intro);
  const secondary = 'menu__action menu__action--secondary';
  const anyway = button(secondary, t(keys.anyway));
  anyway.hidden = true;
  const pill = document.createElement('span');
  if (modern) pill.className = 'calibration-card__pill';
  return {
    heading,
    intro,
    status: createElement('p', 'menu__text menu__text--status'),
    // Every calibrate action is primary: a user only ever does one of them.
    capture: button('menu__action', t(keys.capture)),
    anyway,
    check: button(secondary, t('calibration.check')),
    clear: button(secondary, t(keys.clear)),
    pill,
  };
}

function drawControls(
  kind: CalibrationKind,
  controls: CalibrationControls,
  stored: { calibration: Calibration | null; capturedAt: number | null },
  look: { modern: boolean; checklist: boolean },
  message?: string,
): void {
  const { calibration, capturedAt } = stored;
  controls.anyway.hidden = true;
  controls.status.classList.remove('menu__text--warning');
  controls.status.textContent = calibrationStatusText(
    kind,
    calibration,
    capturedAt,
    look.checklist,
    message,
  );
  controls.clear.disabled = !calibration;
  controls.check.disabled = !calibration;
  if (!look.modern) return;
  const pill = pillFor(kind, calibration !== null);
  controls.pill.textContent = pill.text;
  controls.pill.className = pill.className;
}

function showWarning(controls: CalibrationControls, warned: boolean): void {
  if (!warned) return;
  controls.status.classList.add('menu__text--warning');
  controls.anyway.hidden = false;
}

interface Parts {
  phone: CalibrationControls;
  vehicle: CalibrationControls;
  flip: CalibrationFlip;
  external: ExternalCalibration;
}

/** `phoneElements` are hidden while a box is active. */
interface LayoutResult {
  sensorElement: HTMLElement;
  vehicleElement: HTMLElement;
  phoneElements: HTMLElement[];
  renderSteps: (() => void) | null;
}

function createMore(...buttons: HTMLButtonElement[]): HTMLDetailsElement {
  const more = createElement('details', 'menu__detail');
  const summary = createElement('summary', 'sensor-status__debug-summary');
  summary.textContent = t('settings.more');
  more.append(summary, ...buttons);
  return more;
}

function hint(key: 'calibration.step.phone.hint' | 'calibration.step.vehicle.hint'): HTMLElement {
  const paragraph = createElement('p', 'menu__text');
  paragraph.textContent = t(key);
  return paragraph;
}

function createPhoneStep(parts: Parts): ChecklistStep<CalibrationKind> {
  const step = createChecklistStep<CalibrationKind>('phone', 1);
  const flipLink = button('link-button', t('calibration.step.flipLink'));
  const flipBlock = document.createElement('div');
  flipBlock.hidden = true;
  const { flip, phone } = parts;
  flipBlock.append(flip.intro, flip.button, flip.status, flip.anyway);
  flipLink.addEventListener('click', () => {
    flipBlock.hidden = !flipBlock.hidden;
    if (flipBlock.hidden) flip.reset();
  });
  step.body.append(
    hint('calibration.step.phone.hint'),
    phone.capture,
    phone.status,
    phone.anyway,
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
    hint('calibration.step.vehicle.hint'),
    vehicle.capture,
    vehicle.status,
    vehicle.anyway,
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
    flip.anyway,
    ...(maintenance ? [createRow(phone)] : []),
    phone.status,
    phone.anyway,
  );
  const vehicleCard = createCard(
    [vehicle.heading, vehicle.pill],
    vehicle.intro,
    vehicle.capture,
    ...(maintenance ? [createRow(vehicle)] : []),
    vehicle.status,
    vehicle.anyway,
  );
  body.className = 'calibration-cards';
  if (offersExternal(options)) body.append(external.element);
  body.append(sensorCard, vehicleCard);
  return {
    sensorElement: sensorCard,
    vehicleElement: vehicleCard,
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
    phone.anyway,
    phone.capture,
    flip.intro,
    flip.button,
    flip.status,
    flip.anyway,
    ...(maintenance ? [phone.check, phone.clear] : []),
  );
  const vehicleSection = document.createElement('div');
  vehicleSection.append(
    vehicle.heading,
    vehicle.intro,
    vehicle.status,
    vehicle.anyway,
    vehicle.capture,
    ...(maintenance ? [vehicle.check, vehicle.clear] : []),
  );
  if (offersExternal(options)) body.append(external.element);
  body.append(sensorSection, vehicleSection);
  return {
    sensorElement: sensorSection,
    vehicleElement: vehicleSection,
    phoneElements: [sensorSection, vehicleSection],
    renderSteps: null,
  };
}

function offersExternal(options: CalibrationOptions): boolean {
  return !!options.getExternalSensor && !!options.calibrateExternalSensor;
}

function buildLayout(
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

/**
 * While an external sensor is active every phone action is disabled and
 * hidden: greyed-out phone cards buried the one thing that applies, the
 * box's own calibration. Runs last in every refresh so it wins over their
 * own "nothing to clear/check".
 */
function applyPhoneGate(options: CalibrationOptions, parts: Parts, phoneElements: HTMLElement[]) {
  const phoneActive = options.isPhoneActive?.() ?? true;
  for (const element of phoneElements) element.hidden = !phoneActive;
  if (!parts.external.isWaiting()) parts.external.refresh();
  const { phone, vehicle, flip } = parts;
  const captures = [
    phone.capture,
    phone.anyway,
    flip.button,
    flip.anyway,
    vehicle.capture,
    vehicle.anyway,
  ];
  // Clear/Check are re-derived by the refreshes; the capture actions are
  // only ever disabled by this gate, so lift it here.
  for (const action of captures) action.disabled = !phoneActive;
  if (phoneActive) return;
  for (const action of [phone.clear, phone.check, vehicle.clear, vehicle.check]) {
    action.disabled = true;
  }
}

export function createCalibrationSection(
  options: CalibrationOptions,
  layout: Layout = 'cards',
): CalibrationSection {
  // Decided once, here; see the module doc comment.
  const look = { modern: options.appearance === 'modern', checklist: layout === 'checklist' };
  let openStep: OpenStep = null;
  const focus = { get: () => openStep, set: (step: OpenStep) => void (openStep = step) };
  const parts: Parts = {
    phone: createControls('phone', look.modern),
    vehicle: createControls('vehicle', look.modern),
    flip: createCalibrationFlip(options, look.modern, {
      onUsed: () => (openStep = 'phone'),
      onApplied: () => refresh.phone(),
    }),
    external: createExternalCalibration(options, look.modern),
  };
  const body = document.createElement('div');
  const built = buildLayout(layout, options, parts, body, focus);

  const refresh = createRefreshers(options, parts, built, look);
  wireActions(options, parts, focus, refresh);
  refresh.phone();
  return {
    element: body,
    sensorElement: built.sensorElement,
    vehicleElement: built.vehicleElement,
    // Reopening the page follows "the next undone step" again.
    refresh: (error?: string) => {
      openStep = null;
      refresh.phone(error);
    },
  };
}

/**
 * The phone's refresh also redraws the vehicle zero (clearing a message
 * shown there); both end with the phone gate.
 */
function createRefreshers(
  options: CalibrationOptions,
  parts: Parts,
  built: LayoutResult,
  look: { modern: boolean; checklist: boolean },
): Record<CalibrationKind, (message?: string) => void> {
  function vehicle(message?: string): void {
    const stored = {
      calibration: options.getVehicleCalibration(),
      capturedAt: options.getVehicleCalibrationCapturedAt(),
    };
    drawControls('vehicle', parts.vehicle, stored, look, message);
    built.renderSteps?.();
    applyPhoneGate(options, parts, built.phoneElements);
  }
  function phone(message?: string): void {
    const stored = {
      calibration: options.getCalibration(),
      capturedAt: options.getCalibrationCapturedAt(),
    };
    drawControls('phone', parts.phone, stored, look, message);
    vehicle();
    applyPhoneGate(options, parts, built.phoneElements);
  }
  return { phone, vehicle };
}

/**
 * A step showing a message stays open in the checklist; a success or a
 * clear hands over to the next undone step.
 */
function wireActions(
  options: CalibrationOptions,
  parts: Parts,
  focus: { set(step: OpenStep): void },
  refresh: Record<CalibrationKind, (message?: string) => void>,
): void {
  const captures = {
    phone: (anyway: boolean) => options.calibrate(anyway),
    vehicle: (anyway: boolean) => options.calibrateVehicle(anyway),
  };
  const checks = {
    phone: () => options.checkCalibration(),
    vehicle: () => options.checkVehicleCalibration(),
  };
  const clears = {
    phone: () => options.clearCalibration(),
    vehicle: () => options.clearVehicleCalibration(),
  };
  for (const kind of ['phone', 'vehicle'] as const) {
    const controls = parts[kind];
    const capture = (anyway: boolean) => {
      const { text, warned } = captureMessage(captures[kind](anyway));
      focus.set(text ? kind : null);
      refresh[kind](text ?? undefined);
      showWarning(controls, warned);
    };
    controls.capture.addEventListener('click', () => capture(false));
    controls.anyway.addEventListener('click', () => capture(true));
    controls.check.addEventListener('click', () => {
      focus.set(kind);
      refresh[kind](checks[kind]());
    });
    controls.clear.addEventListener('click', () => {
      clears[kind]();
      focus.set(null);
      refresh[kind]();
    });
  }
}
