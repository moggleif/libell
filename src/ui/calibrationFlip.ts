/**
 * Flip calibration: two captures with a 180° turn in between, so no
 * known-level surface is needed. Captures that disagree are never refused:
 * the step warns and offers "Calibrate anyway".
 */
import type { Calibration } from '../domain/settings';
import { flipCalibration, type FlipResult } from '../domain/calibration';
import type { CalibrationOptions } from './calibrationSection';
import { createElement } from './dom';
import { t } from './i18n';

export interface CalibrationFlip {
  intro: HTMLElement;
  button: HTMLButtonElement;
  status: HTMLElement;
  anyway: HTMLButtonElement;
  reset(): void;
}

export interface FlipHooks {
  /** Any tap on the flip: the phone step stays open. */
  onUsed(): void;
  onApplied(): void;
}

function createParts(modern: boolean) {
  const intro = createElement('p', modern ? 'calibration-card__body' : 'menu__text');
  intro.textContent = t('calibration.flip.intro');
  const status = createElement('p', 'menu__text menu__text--status');
  // Primary like the other calibrate actions: a user only ever does one.
  const button = createElement('button', 'menu__action');
  button.type = 'button';
  const anyway = createElement('button', 'menu__action menu__action--secondary');
  anyway.type = 'button';
  anyway.textContent = t('calibration.anyway');
  anyway.hidden = true;
  return { intro, button, status, anyway };
}

interface FlipState {
  parts: ReturnType<typeof createParts>;
  options: CalibrationOptions;
  hooks: FlipHooks;
  first: Calibration | null;
  /** Kept while the warning offers "Calibrate anyway". */
  pending: FlipResult | null;
}

function reset(state: FlipState): void {
  const { button, status, anyway } = state.parts;
  state.first = null;
  state.pending = null;
  anyway.hidden = true;
  status.classList.remove('menu__text--warning');
  button.textContent = t('calibration.flip.start');
  status.textContent = '';
}

function apply(state: FlipState, { bias, surface }: FlipResult): void {
  state.options.applyCalibration(bias);
  reset(state);
  const surfaceMax = Math.max(Math.abs(surface.rollDeg), Math.abs(surface.pitchDeg));
  state.parts.status.textContent = t('calibration.flip.done', { surface: surfaceMax.toFixed(1) });
  state.hooks.onApplied();
}

function warn(state: FlipState, result: FlipResult): void {
  reset(state);
  state.pending = result;
  state.parts.status.textContent = t('calibration.flip.warn.moved');
  state.parts.status.classList.add('menu__text--warning');
  state.parts.anyway.hidden = false;
}

function capture(state: FlipState, reading: Calibration): void {
  if (!state.first) {
    reset(state);
    state.first = reading;
    state.parts.button.textContent = t('calibration.flip.capture');
    state.parts.status.textContent = t('calibration.flip.rotate');
    return;
  }
  const result = flipCalibration(state.first, reading);
  if (result.consistent) apply(state, result);
  else warn(state, result);
}

export function createCalibrationFlip(
  options: CalibrationOptions,
  modern: boolean,
  hooks: FlipHooks,
): CalibrationFlip {
  const parts = createParts(modern);
  const state: FlipState = { parts, options, hooks, first: null, pending: null };
  parts.button.addEventListener('click', () => {
    hooks.onUsed();
    const reading = options.readTilt();
    if (typeof reading === 'string') parts.status.textContent = reading;
    else capture(state, reading);
  });
  parts.anyway.addEventListener('click', () => {
    hooks.onUsed();
    if (state.pending) apply(state, state.pending);
  });
  reset(state);
  return { ...parts, reset: () => reset(state) };
}
