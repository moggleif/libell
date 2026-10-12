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
 * Its `layout: 'wizard'` is those cards without Check/Clear (#365): a first
 * run has nothing to check or clear yet, and Settings keeps them under More.
 */
import type { AppearanceSetting, Calibration } from '../domain/settings';
import type { CaptureResult } from '../domain/calibration';
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
  /**
   * Visual preset (#104), read once at construction — see the module doc
   * comment below for why there is no live restructuring.
   */
  appearance: AppearanceSetting;
  getCalibration(): Calibration | null;
  /** Capture the current tilt as the phone's zero point: null on success,
   * an error text, or a warning that offers "Calibrate anyway" (#411) —
   * `anyway` is set when the user chose it. */
  calibrate(anyway?: boolean): CaptureResult;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  applyCalibration(calibration: Calibration): void;
  clearCalibration(): void;
  /** The vehicle zero (#83): the phone spot's own tilt, captured with the vehicle verified level. */
  getVehicleCalibration(): Calibration | null;
  /** Capture the current position as level — answers like `calibrate`,
   * with "Zero anyway" for its warning (#411). */
  calibrateVehicle(anyway?: boolean): CaptureResult;
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
  calibrateExternalSensor?(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
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

type Layout = 'cards' | 'checklist' | 'wizard';

/** One calibration's controls (the phone's, or the vehicle zero's),
 * shared by every layout — only the container differs. */
interface CalibrationControls {
  heading: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  capture: HTMLButtonElement;
  /** "… anyway" (#411): shown only while a capture's tilt warning is up. */
  anyway: HTMLButtonElement;
  /** Check (#87): compares the current reading against the stored zero. */
  check: HTMLButtonElement;
  clear: HTMLButtonElement;
  /** Modern only (#109): the numbers live in the status sentence alone. */
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
    // Every calibrate action is primary: a user only ever does one of them
    // at a time, so none is "the real one" (follow-up to #109).
    capture: button('menu__action', t(keys.capture)),
    anyway,
    check: button(secondary, t('calibration.check')),
    clear: button(secondary, t(keys.clear)),
    pill,
  };
}

/** Redraws one calibration's controls from what is stored. */
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
  // Grayed out when there is nothing to clear or check.
  controls.clear.disabled = !calibration;
  controls.check.disabled = !calibration;
  if (!look.modern) return;
  const pill = pillFor(kind, calibration !== null);
  controls.pill.textContent = pill.text;
  controls.pill.className = pill.className;
}

/** Shows a capture's answer; a tilt warning brings its "anyway" button. */
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

/** What a layout built: the two halves, everything that calibrates the
 * phone (hidden while a box is active), and, for the checklist, how to
 * redraw its steps. */
interface LayoutResult {
  sensorElement: HTMLElement;
  vehicleElement: HTMLElement;
  phoneElements: HTMLElement[];
  renderSteps: (() => void) | null;
}

/** The More disclosure holding a step's Check and Clear (#330). */
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

/** 1. The phone: lay it on something flat, or flip it where nothing is. */
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

/** 2. The vehicle zero: the vehicle levelled, the phone in its spot. */
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

/** Settings (#330): the two calibrations as two steps of the same
 * checklist the box's own setup uses (#314). */
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

/** Check + Clear side by side (design review, follow-up). */
function createRow(controls: CalibrationControls): HTMLElement {
  const row = createElement('div', 'calibration-card__row');
  row.append(controls.check, controls.clear);
  return row;
}

/** Modern (#109): two cards, sensor calibration then vehicle zero, each
 * with a status pill. The wizard's cards have no Check/Clear (#365). */
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

/** Classic: two plain wrapper divs, so a caller can split the halves onto
 * separate steps (the onboarding wizard) while `element` shows both. */
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

/** The box's own zero is built only for a host that offers an external
 * sensor (not the onboarding wizard's phone steps). */
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
  // Check/Clear are offered everywhere but the wizard (#365).
  const maintenance = layout !== 'wizard';
  if (layout === 'checklist') return layoutChecklist(options, parts, body, focus);
  if (options.appearance === 'modern') return layoutModernCards(options, parts, body, maintenance);
  return layoutClassic(options, parts, body, maintenance);
}

/**
 * While an external sensor is the active source (#285) every phone action
 * is greyed out and hidden (Morgan, after #290: a page of greyed-out phone
 * cards buried the one thing that applies, the box's own calibration). Run
 * last in every refresh so it wins over their own "nothing to clear/check".
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
  // Decided once, here — see the module doc comment (#109).
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
    // Reopening the page follows "the next undone step" again (#330).
    refresh: (error?: string) => {
      openStep = null;
      refresh.phone(error);
    },
  };
}

/**
 * Redraws each calibration. The phone's also redraws the vehicle zero
 * (clearing a message shown there); both redraw the checklist's steps and
 * end with the phone gate.
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
 * Every button's action. A step showing a message stays open in the
 * checklist; a success or a clear hands over to the next undone step.
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
