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
import { createCalibrationFlip } from './calibrationFlip';
import {
  type CalibrationControls,
  createControls,
  drawControls,
  showWarning,
} from './calibrationControls';
import { buildLayout, type Layout, type LayoutResult, type Parts } from './calibrationLayouts';
import { captureMessage, type CalibrationKind, type OpenStep } from './calibrationText';
import { createExternalCalibration } from './externalCalibration';
import { t } from './i18n';
import { createZeroTrimRow, type ZeroTrimOptions, type ZeroTrimRow } from './zeroTrimRow';

export interface CalibrationOptions {
  /** Read once at construction; see the module doc comment. */
  appearance: AppearanceSetting;
  getCalibration(): Calibration | null;
  /** Null on success, an error text, or — stored but steep — a warning
   * with an undo (#624). */
  calibrate(): CaptureResult;
  /** Raw (uncalibrated) tilt reading for the flip flow, or an error text. */
  readTilt(): Calibration | string;
  /** Returns how to put the previous calibration back (#624). */
  applyCalibration(calibration: Calibration): () => void;
  clearCalibration(): void;
  /** The phone spot's own tilt, captured with the vehicle verified level. */
  getVehicleCalibration(): Calibration | null;
  /** Answers like `calibrate`. */
  calibrateVehicle(): CaptureResult;
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
  getBox?(): BoxCalibrationState | null;
  /** The same action as on the box's own page (R34); asynchronous for a box
   * that zeroes itself. */
  calibrateBox?(): CaptureResult | Promise<CaptureResult>;
  /** No link is shown when omitted. */
  openBoxPage?(): void;
  /** Fine adjustment of the phone's vehicle zero (#596); no row when omitted. */
  vehicleZeroTrim?: ZeroTrimOptions;
}

export interface BoxCalibrationState {
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
    phone.undo,
    flip.button,
    flip.undo,
    vehicle.capture,
    vehicle.undo,
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
  const trim = createTrimRow(options, layout, built);

  const refresh = createRefreshers(options, parts, built, look, trim);
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

/** Under the vehicle zero it adjusts. A first run has no zero to adjust
 * yet, so the wizard has no row. */
function createTrimRow(
  options: CalibrationOptions,
  layout: Layout,
  built: LayoutResult,
): ZeroTrimRow | null {
  if (!options.vehicleZeroTrim || layout === 'wizard') return null;
  const row = createZeroTrimRow(options.vehicleZeroTrim);
  built.vehicleBody.append(row.element);
  return row;
}

/**
 * The phone's refresh also redraws the vehicle zero (clearing a message
 * shown there) and its fine adjustment; both end with the phone gate.
 */
function createRefreshers(
  options: CalibrationOptions,
  parts: Parts,
  built: LayoutResult,
  look: { modern: boolean; checklist: boolean },
  trim: ZeroTrimRow | null,
): Record<CalibrationKind, (message?: string) => void> {
  function vehicle(message?: string): void {
    const stored = {
      calibration: options.getVehicleCalibration(),
      capturedAt: options.getVehicleCalibrationCapturedAt(),
    };
    drawControls('vehicle', parts.vehicle, stored, look, message);
    trim?.refresh();
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

/** One button stores the capture (#624); a steep one warns, and Undo puts
 * back what was there before, keeping the step open. */
function wireCapture(
  kind: CalibrationKind,
  capture: () => CaptureResult,
  view: {
    controls: CalibrationControls;
    focus: { set(step: OpenStep): void };
    refresh: (message?: string) => void;
  },
): void {
  const { controls, focus, refresh } = view;
  let undo: (() => void) | null = null;
  controls.capture.addEventListener('click', () => {
    const message = captureMessage(capture());
    undo = message.undo;
    focus.set(message.text ? kind : null);
    refresh(message.text ?? undefined);
    showWarning(controls, undo !== null);
  });
  controls.undo.addEventListener('click', () => {
    undo?.();
    undo = null;
    focus.set(kind);
    refresh();
  });
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
  // Nothing stored: Check stays tappable and says how to get a value (#517).
  const checks = {
    phone: () =>
      options.getCalibration()
        ? options.checkCalibration()
        : t('calibration.check.none', { now: t('calibration.now') }),
    vehicle: () =>
      options.getVehicleCalibration()
        ? options.checkVehicleCalibration()
        : t('calibration.vehicle.check.none', { now: t('calibration.vehicle.now') }),
  };
  const clears = {
    phone: () => options.clearCalibration(),
    vehicle: () => options.clearVehicleCalibration(),
  };
  for (const kind of ['phone', 'vehicle'] as const) {
    const controls = parts[kind];
    const capture = kind === 'phone' ? () => options.calibrate() : () => options.calibrateVehicle();
    wireCapture(kind, capture, { controls, focus, refresh: refresh[kind] });
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
