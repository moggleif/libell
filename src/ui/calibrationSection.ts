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
import { createControls, drawControls, showWarning } from './calibrationControls';
import { buildLayout, type Layout, type LayoutResult, type Parts } from './calibrationLayouts';
import { captureMessage, type CalibrationKind, type OpenStep } from './calibrationText';
import { createExternalCalibration } from './externalCalibration';
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
  getBox?(): BoxCalibrationState | null;
  /** The same action as on the box's own page (R34); asynchronous for a box
   * that zeroes itself. */
  calibrateBox?(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  /** No link is shown when omitted. */
  openBoxPage?(): void;
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
