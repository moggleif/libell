/**
 * What a box's card and setup checklist (`sensorSourceSection.ts`) show
 * for each state, as pure functions of the values they read — no DOM, so
 * every decision is tested on its own (#416).
 */
import type { CaptureResult } from '../domain/calibration';
import type { Calibration } from '../domain/settings';
import { isMountedRight } from '../domain/uprightMount';
import type { SensorState } from '../sensor/orientation';
import type { BoxConnection } from './boxConnection';
import { ageText } from './calibrationAge';
import { t } from './i18n';
import type { BoxShape } from './mountingPicker';

/** The card's mark (#324): + not in use, ✓ in use, ! lost or refused. */
export function cardMark(connection: BoxConnection): string {
  if (connection === 'notConnected') return '+';
  return connection === 'connected' ? '✓' : '!';
}

/** The line under the box's name: empty while not in use (Connect shows
 * instead), else Connected, No contact, or — never "Connected" while the
 * box says no to its password (#367) — Wrong password. */
export function cardStateText(connection: BoxConnection): string {
  return connection === 'notConnected' ? '' : t(`box.state.${connection}`);
}

/** Said under the name after a connect that did not succeed, or null. */
export function connectErrorText(state: SensorState, name: string): string | null {
  if (state === 'granted') return null;
  return state === 'unsupported'
    ? t('sensorSource.err.unsupported')
    : t('sensorSource.err.failed', { name });
}

/** How the box stands, from its own reading: `ok` is null while there is
 * no reading yet. */
export interface PositionReport {
  text: string;
  ok: boolean | null;
}

export function positionReport(tilt: Calibration | null, shape: BoxShape): PositionReport {
  if (!tilt) return { text: t('box.step.position.waiting'), ok: null };
  const ok = isMountedRight(tilt);
  // A flat box past a right angle has its lid down (#362). Libell does not
  // support that mounting; it says so, and how to fix it.
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

/** Says which way, so the closed step still shows what was picked. */
export function directionTitle(picked: string | null): string {
  return picked
    ? `${t('box.step.direction.done')}: ${picked.toLowerCase()}`
    : t('box.step.direction.todo');
}

export function zeroTitle(zeroed: boolean, capturedAt: number | null): string {
  return zeroed ? t('box.step.zero.done') + ageText(capturedAt) : t('box.step.zero.todo');
}

/** What the zero step says after a zero: nothing, an error, or a tilt
 * warning (#425), which alone offers "Zero anyway". */
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
 * Which checklist step is expanded: by default the first one not yet done
 * ('next'); the one the user opened ('opened'); or none, once the user
 * closed one ('closed'), until something else changes.
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
