/**
 * What the calibration section (`calibrationSection.ts`) says for each
 * state, as pure functions of the values it reads — no DOM, so every
 * decision is tested on its own (#416).
 */
import type { CaptureResult } from '../domain/calibration';
import type { Calibration } from '../domain/settings';
import { ageText } from './calibrationAge';
import { t } from './i18n';

/** The two calibrations the section offers: the phone's own sensor, and
 * the vehicle zero (#83). */
export type CalibrationKind = 'phone' | 'vehicle';

const STATUS_KEYS = {
  phone: { done: 'calibration.status', none: 'calibration.status.none' },
  vehicle: { done: 'calibration.vehicle.status', none: 'calibration.vehicle.status.none' },
} as const;

/**
 * The status line under a calibration: a message when there is one; empty
 * in the checklist, whose step title carries ✓ and the age; else the stored
 * numbers with their age, or that there are none.
 */
export function calibrationStatusText(
  kind: CalibrationKind,
  calibration: Calibration | null,
  capturedAt: number | null,
  checklist: boolean,
  message?: string,
): string {
  if (message) return message;
  if (checklist) return '';
  if (!calibration) return t(STATUS_KEYS[kind].none);
  return (
    t(STATUS_KEYS[kind].done, {
      roll: calibration.rollDeg.toFixed(1),
      pitch: calibration.pitchDeg.toFixed(1),
    }) + ageText(capturedAt)
  );
}

/** The Modern cards' status pill (#109). A missing phone calibration is
 * pending; a missing vehicle zero is simply none. */
export function pillFor(kind: CalibrationKind, done: boolean): { text: string; className: string } {
  const base = 'calibration-card__pill';
  if (done) return { text: t('calibration.pill.done'), className: `${base} ${base}--done` };
  return kind === 'phone'
    ? { text: t('calibration.pill.notDone'), className: `${base} ${base}--pending` }
    : { text: t('calibration.pill.none'), className: base };
}

/** The checklist step's title: ✓ and the age when done (#330). */
export function stepTitle(kind: CalibrationKind, done: boolean, capturedAt: number | null): string {
  if (kind === 'phone') {
    return done
      ? t('calibration.step.phone.done') + ageText(capturedAt)
      : t('calibration.sensor.h');
  }
  return done
    ? t('calibration.step.vehicle.done') + ageText(capturedAt)
    : t('calibration.vehicle.h');
}

/** The checklist step kept open by the user or by a message shown in it
 * ('none' when the user closed it); null follows the next undone step. */
export type OpenStep = CalibrationKind | 'none' | null;

/** Guidance, never a gate: the next undone step is open, but any step
 * opens on a tap and stays open while it shows a message. */
export function expandedStep(
  openStep: OpenStep,
  phoneDone: boolean,
  vehicleDone: boolean,
): CalibrationKind | 'none' {
  if (openStep !== null) return openStep;
  if (!phoneDone) return 'phone';
  return vehicleDone ? 'none' : 'vehicle';
}

/** What a capture answered: nothing, an error, or a tilt warning (#411),
 * which alone offers "… anyway". */
export function captureMessage(result: CaptureResult): { text: string | null; warned: boolean } {
  if (result !== null && typeof result === 'object') return { text: result.warning, warned: true };
  return { text: result, warned: false };
}

/** The active box's zero (#290), by its offset when there is no message. */
export function externalStatusText(
  offset: Calibration | null,
  capturedAt: number | null,
  message?: string,
): string {
  if (message !== undefined) return message;
  if (!offset) return t('sensorSource.install.status.none');
  return (
    t('sensorSource.install.status', {
      roll: offset.rollDeg.toFixed(1),
      pitch: offset.pitchDeg.toFixed(1),
    }) + ageText(capturedAt)
  );
}
