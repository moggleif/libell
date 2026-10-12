/**
 * What a box's card and setup checklist show, as pure functions: no DOM, so
 * every decision is tested on its own.
 */
import type { CaptureResult } from '../domain/calibration';
import type { Calibration } from '../domain/settings';
import { isMountedRight } from '../domain/uprightMount';
import type { SensorState } from '../sensor/orientation';
import type { BoxConnection } from './boxConnection';
import { ageText } from './calibrationAge';
import { t } from './i18n';
import type { BoxShape } from './mountingPicker';

export function cardMark(connection: BoxConnection): string {
  if (connection === 'notConnected') return '+';
  return connection === 'connected' ? '✓' : '!';
}

/** Empty while not in use: the Connect button shows instead. */
export function cardStateText(connection: BoxConnection): string {
  return connection === 'notConnected' ? '' : t(`box.state.${connection}`);
}

export function connectErrorText(state: SensorState, name: string): string | null {
  if (state === 'granted') return null;
  return state === 'unsupported'
    ? t('sensorSource.err.unsupported')
    : t('sensorSource.err.failed', { name });
}

/** `ok` is null while there is no reading yet. */
export interface PositionReport {
  text: string;
  ok: boolean | null;
}

export function positionReport(tilt: Calibration | null, shape: BoxShape): PositionReport {
  if (!tilt) return { text: t('box.step.position.waiting'), ok: null };
  const ok = isMountedRight(tilt);
  // A flat box past a right angle has its lid down, which Libell does not
  // support.
  const upsideDown =
    shape === 'flat' && (Math.abs(tilt.pitchDeg) > 90 || Math.abs(tilt.rollDeg) > 90);
  const text = upsideDown
    ? t('box.step.position.flat.upsideDown')
    : t(`box.step.position.${shape}.${ok ? 'ok' : 'bad'}`);
  return { text, ok };
}

export function positionMark(ok: boolean | null): string {
  if (ok === null) return '';
  return ok ? '✓ ' : '! ';
}

export function directionTitle(picked: string | null): string {
  return picked
    ? `${t('box.step.direction.done')}: ${picked.toLowerCase()}`
    : t('box.step.direction.todo');
}

export function zeroTitle(zeroed: boolean, capturedAt: number | null): string {
  return zeroed ? t('box.step.zero.done') + ageText(capturedAt) : t('box.step.zero.todo');
}

/** Only a tilt warning (`warned`) offers "Zero anyway". */
export interface ZeroMessage {
  text: string | null;
  warned: boolean;
}

export function zeroMessage(result: CaptureResult): ZeroMessage {
  if (result !== null && typeof result === 'object') return { text: result.warning, warned: true };
  return { text: result, warned: false };
}

export type SetupStep = 'direction' | 'zero';

/**
 * Which step is expanded: the first not yet done ('next'), the one the user
 * opened ('opened'), or none after the user closed one ('closed').
 */
export type StepFocus = { kind: 'next' } | { kind: 'opened'; step: SetupStep } | { kind: 'closed' };

export function expandedStep(
  focus: StepFocus,
  steps: readonly { step: SetupStep; done: boolean }[],
): SetupStep | null {
  if (focus.kind === 'closed') return null;
  const match =
    focus.kind === 'next' ? steps.find((s) => !s.done) : steps.find((s) => s.step === focus.step);
  return match?.step ?? null;
}
