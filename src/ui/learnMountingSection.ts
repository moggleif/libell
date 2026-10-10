/**
 * "Learn the mounting" guide (#293, R49): for a box that reports finished
 * angles and can sit in the vehicle any way round. Instead of asking the
 * user how the box is mounted, or sending them to the vendor's app, Libell
 * watches the box while the user lifts the vehicle's front and then its
 * right side, and learns which way is which (`domain/axisMapping.ts`).
 *
 * Three steps, one button each, so the user only ever has one thing to do:
 *   idle  → "Learn the mounting" takes the starting reading
 *   front → "The front is raised" takes the second
 *   right → "The right side is raised" takes the third, then learns
 * Any failure returns to idle with the reason, and stores nothing.
 */
import { learnAxisMapping, type AxisMapping } from '../domain/axisMapping';
import type { Calibration } from '../domain/settings';
import { t, type MessageKey } from './i18n';

export interface LearnMountingOptions {
  /** The device's display name, for the not-connected message. */
  name: string;
  /** The box's reading as it reports it, before any learned mapping; null
   * when there is no live reading. */
  getRawReading(): Calibration | null;
  getLearnedMounting(): AxisMapping | null;
  /** Store (or with null, forget) the mapping; takes effect on the next reading. */
  setLearnedMounting(mapping: AxisMapping | null): void;
}

export interface LearnMountingSection {
  element: HTMLElement;
  refresh(): void;
}

type Step = 'idle' | 'front' | 'right';

export function createLearnMountingSection(options: LearnMountingOptions): LearnMountingSection {
  const element = document.createElement('div');
  element.className = 'learn-mounting';

  const heading = document.createElement('h3');
  heading.className = 'menu__heading';
  heading.textContent = t('sensorSource.learn.h');
  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('sensorSource.learn.intro');
  const instruction = document.createElement('p');
  instruction.className = 'menu__text';
  const status = document.createElement('p');
  status.className = 'menu__text menu__text--status';

  function makeButton(key: MessageKey, secondary = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary ? 'menu__action menu__action--secondary' : 'menu__action';
    button.textContent = t(key);
    return button;
  }
  const startButton = makeButton('sensorSource.learn.start');
  const frontButton = makeButton('sensorSource.learn.capture.front');
  const rightButton = makeButton('sensorSource.learn.capture.right');
  const cancelButton = makeButton('sensorSource.learn.cancel', true);
  const clearButton = makeButton('sensorSource.learn.clear', true);

  element.append(
    heading,
    intro,
    instruction,
    startButton,
    frontButton,
    rightButton,
    cancelButton,
    status,
    clearButton,
  );

  let step: Step = 'idle';
  let baseline: Calibration | null = null;
  let frontRaised: Calibration | null = null;

  function show(next: Step, message?: string): void {
    step = next;
    instruction.hidden = step === 'idle';
    if (step === 'front') instruction.textContent = t('sensorSource.learn.step.front');
    if (step === 'right') instruction.textContent = t('sensorSource.learn.step.right');
    startButton.hidden = step !== 'idle';
    frontButton.hidden = step !== 'front';
    rightButton.hidden = step !== 'right';
    cancelButton.hidden = step === 'idle';
    const learned = options.getLearnedMounting() !== null;
    clearButton.hidden = step !== 'idle' || !learned;
    status.hidden = step !== 'idle';
    status.textContent =
      message ??
      (learned ? t('sensorSource.learn.status.learned') : t('sensorSource.learn.status.none'));
  }

  /** The live reading, or null after saying why there is none. */
  function capture(): Calibration | null {
    const reading = options.getRawReading();
    if (!reading) {
      show('idle', t('calibration.external.err.notConnected', { name: options.name }));
    }
    return reading;
  }

  startButton.addEventListener('click', () => {
    baseline = capture();
    if (baseline) show('front');
  });
  frontButton.addEventListener('click', () => {
    frontRaised = capture();
    if (frontRaised) show('right');
  });
  rightButton.addEventListener('click', () => {
    const rightRaised = capture();
    if (!rightRaised || !baseline || !frontRaised) return;
    const result = learnAxisMapping(baseline, frontRaised, rightRaised);
    if (!result.ok) {
      show('idle', t(`sensorSource.learn.err.${result.error}`));
      return;
    }
    options.setLearnedMounting(result.mapping);
    show('idle', t('sensorSource.learn.done'));
  });
  cancelButton.addEventListener('click', () => show('idle'));
  clearButton.addEventListener('click', () => {
    options.setLearnedMounting(null);
    show('idle');
  });

  show('idle');
  return {
    element,
    // Re-reads the stored state, but never interrupts a guide in progress.
    refresh: () => {
      if (step === 'idle') show('idle');
    },
  };
}
