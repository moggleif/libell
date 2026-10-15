/**
 * What the calibration section says, as pure functions: no DOM, so every
 * decision is tested on its own.
 */
import type { Calibration, CaptureResult } from '../domain/calibration';
import { ageText } from './calibrationAge';
import { t } from './i18n';
import { signedDegrees } from './tiltText';

export type CalibrationKind = 'phone' | 'vehicle';

const STATUS_KEYS = {
  phone: { done: 'calibration.status', none: 'calibration.status.none' },
  vehicle: { done: 'calibration.vehicle.status', none: 'calibration.vehicle.status.none' },
} as const;

/** Empty in the checklist, whose step title carries ✓ and the age. */
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
      roll: signedDegrees(calibration.rollDeg),
      pitch: signedDegrees(calibration.pitchDeg),
    }) + ageText(capturedAt)
  );
}

/** A missing phone calibration is pending; a missing vehicle zero is
 * simply none. */
export function pillFor(kind: CalibrationKind, done: boolean): { text: string; className: string } {
  const base = 'calibration-card__pill';
  if (done) return { text: t('calibration.pill.done'), className: `${base} ${base}--done` };
  return kind === 'phone'
    ? { text: t('calibration.pill.notDone'), className: `${base} ${base}--pending` }
    : { text: t('calibration.pill.none'), className: base };
}

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

/** 'none' when the user closed the step; null follows the next undone
 * step. */
export type OpenStep = CalibrationKind | 'none' | null;

/** Guidance, never a gate: any step opens on a tap and stays open while it
 * shows a message. */
export function expandedStep(
  openStep: OpenStep,
  phoneDone: boolean,
  vehicleDone: boolean,
): CalibrationKind | 'none' {
  if (openStep !== null) return openStep;
  if (!phoneDone) return 'phone';
  return vehicleDone ? 'none' : 'vehicle';
}

/** Only a tilt warning offers an undo (#624): an error stored nothing. */
export interface CaptureMessage {
  text: string | null;
  undo: (() => void) | null;
}

export function captureMessage(result: CaptureResult): CaptureMessage {
  if (result !== null && typeof result === 'object') {
    return { text: result.warning, undo: result.undo };
  }
  return { text: result, undo: null };
}

export function externalStatusText(
  offset: Calibration | null,
  capturedAt: number | null,
  message?: string,
): string {
  if (message !== undefined) return message;
  if (!offset) return t('sensorSource.install.status.none');
  return (
    t('sensorSource.install.status', {
      roll: signedDegrees(offset.rollDeg),
      pitch: signedDegrees(offset.pitchDeg),
    }) + ageText(capturedAt)
  );
}
