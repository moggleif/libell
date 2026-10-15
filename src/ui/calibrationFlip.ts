/**
 * Flip calibration: two captures with a 180° turn in between, so no
 * known-level surface is needed. Captures that disagree are never refused:
 * the result is stored, and the step warns with an Undo (#624).
 */
import { type Calibration, flipCalibration, type FlipResult } from '../domain/calibration';
import type { CalibrationOptions } from './calibrationSection';
import { createElement } from './dom';
import { t } from './i18n';

export interface CalibrationFlip {
  intro: HTMLElement;
  button: HTMLButtonElement;
  status: HTMLElement;
  undo: HTMLButtonElement;
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
  const undo = createElement('button', 'menu__action menu__action--secondary');
  undo.type = 'button';
  undo.textContent = t('calibration.undo');
  undo.hidden = true;
  return { intro, button, status, undo };
}

interface FlipState {
  parts: ReturnType<typeof createParts>;
  options: CalibrationOptions;
  hooks: FlipHooks;
  first: Calibration | null;
  /** Kept while the warning offers Undo. */
  restore: (() => void) | null;
}

function reset(state: FlipState): void {
  const { button, status, undo } = state.parts;
  state.first = null;
  state.restore = null;
  undo.hidden = true;
  status.classList.remove('menu__text--warning');
  button.textContent = t('calibration.flip.start');
  status.textContent = '';
}

/** Stored either way (#624); captures that disagree warn, with an Undo. */
function apply(state: FlipState, { bias, surface, consistent }: FlipResult): void {
  const restore = state.options.applyCalibration(bias);
  reset(state);
  state.hooks.onApplied();
  if (!consistent) return warn(state, restore);
  const surfaceMax = Math.max(Math.abs(surface.rollDeg), Math.abs(surface.pitchDeg));
  state.parts.status.textContent = t('calibration.flip.done', { surface: surfaceMax.toFixed(1) });
}

function warn(state: FlipState, restore: () => void): void {
  state.restore = restore;
  state.parts.status.textContent = t('calibration.flip.warn.moved');
  state.parts.status.classList.add('menu__text--warning');
  state.parts.undo.hidden = false;
}

function capture(state: FlipState, reading: Calibration): void {
  if (!state.first) {
    reset(state);
    state.first = reading;
    state.parts.button.textContent = t('calibration.flip.capture');
    state.parts.status.textContent = t('calibration.flip.rotate');
    return;
  }
  apply(state, flipCalibration(state.first, reading));
}

export function createCalibrationFlip(
  options: CalibrationOptions,
  modern: boolean,
  hooks: FlipHooks,
): CalibrationFlip {
  const parts = createParts(modern);
  const state: FlipState = { parts, options, hooks, first: null, restore: null };
  parts.button.addEventListener('click', () => {
    hooks.onUsed();
    const reading = options.readTilt();
    if (typeof reading === 'string') parts.status.textContent = reading;
    else capture(state, reading);
  });
  parts.undo.addEventListener('click', () => {
    hooks.onUsed();
    state.restore?.();
    reset(state);
    hooks.onApplied();
  });
  reset(state);
  return { ...parts, reset: () => reset(state) };
}
