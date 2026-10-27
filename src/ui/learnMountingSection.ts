/**
 * "Learn the mounting" guide (R49), for a box that stands upright facing any
 * of four ways: Libell watches the box while the user lifts the vehicle's
 * front and then its right side, and learns which way is which.
 * Any failure returns to idle with the reason, and stores nothing.
 * Forgetting lives in the hosting direction step, not here.
 */
import { learnAxisMapping, type AxisMapping } from '../domain/axisMapping';
import type { Calibration } from '../domain/calibration';
import { t, type MessageKey } from './i18n';
import { button, createElement, paragraph, textElement } from './dom';

export interface LearnMountingOptions {
  name: string;
  /** Before any learned mapping; null when there is no live reading. */
  getRawReading(): Calibration | null;
  getLearnedMounting(): AxisMapping | null;
  /** Takes effect on the next reading. */
  setLearnedMounting(mapping: AxisMapping | null): void;
  /**
   * Why a learned mapping cannot be used for this box, or null. The
   * EasyLevel allows only its manual's two placements, so a backward arrow
   * is explained rather than stored.
   */
  check?(mapping: AxisMapping): MessageKey | null;
}

export interface LearnMountingSection {
  element: HTMLElement;
  refresh(): void;
}

type Step = 'idle' | 'front' | 'right';

/** The guide's elements and progress; the functions below work on one. */
interface Guide {
  readonly options: LearnMountingOptions;
  readonly view: ReturnType<typeof createView>;
  step: Step;
  baseline: Calibration | null;
  frontRaised: Calibration | null;
}

export function createLearnMountingSection(options: LearnMountingOptions): LearnMountingSection {
  const guide: Guide = {
    options,
    view: createView(),
    step: 'idle',
    baseline: null,
    frontRaised: null,
  };
  const { startButton, frontButton, rightButton, cancelButton } = guide.view;
  startButton.addEventListener('click', () => {
    guide.baseline = capture(guide);
    if (guide.baseline) show(guide, 'front');
  });
  frontButton.addEventListener('click', () => {
    guide.frontRaised = capture(guide);
    if (guide.frontRaised) show(guide, 'right');
  });
  rightButton.addEventListener('click', () => finish(guide));
  cancelButton.addEventListener('click', () => show(guide, 'idle'));

  show(guide, 'idle');
  return {
    element: guide.view.element,
    // Never interrupts a guide in progress.
    refresh: () => {
      if (guide.step === 'idle') show(guide, 'idle');
    },
  };
}

function createView() {
  const element = createElement('div', 'learn-mounting');
  const heading = textElement('h3', 'menu__heading', t('sensorSource.learn.h'));
  const intro = paragraph('menu__text', t('sensorSource.learn.intro'));
  const instruction = createElement('p', 'menu__text');
  const status = createElement('p', 'menu__text menu__text--status');
  const startButton = makeButton('sensorSource.learn.start');
  const frontButton = makeButton('sensorSource.learn.capture.front');
  const rightButton = makeButton('sensorSource.learn.capture.right');
  const cancelButton = makeButton('sensorSource.learn.cancel', true);
  element.append(
    heading,
    intro,
    instruction,
    startButton,
    frontButton,
    rightButton,
    cancelButton,
    status,
  );
  return { element, instruction, status, startButton, frontButton, rightButton, cancelButton };
}

function makeButton(key: MessageKey, secondary = false): HTMLButtonElement {
  return button(secondary ? 'menu__action menu__action--secondary' : 'menu__action', t(key));
}

function show(guide: Guide, next: Step, message?: string): void {
  const { instruction, status, startButton, frontButton, rightButton, cancelButton } = guide.view;
  guide.step = next;
  const step = next;
  instruction.hidden = step === 'idle';
  if (step === 'front') instruction.textContent = t('sensorSource.learn.step.front');
  if (step === 'right') instruction.textContent = t('sensorSource.learn.step.right');
  startButton.hidden = step !== 'idle';
  frontButton.hidden = step !== 'front';
  rightButton.hidden = step !== 'right';
  cancelButton.hidden = step === 'idle';
  const learned = guide.options.getLearnedMounting() !== null;
  status.hidden = step !== 'idle';
  status.textContent =
    message ??
    (learned ? t('sensorSource.learn.status.learned') : t('sensorSource.learn.status.none'));
}

function capture(guide: Guide): Calibration | null {
  const reading = guide.options.getRawReading();
  if (!reading) {
    show(guide, 'idle', t('calibration.external.err.notConnected', { name: guide.options.name }));
  }
  return reading;
}

/** The right side raised: learn the mapping, or say why not. */
function finish(guide: Guide): void {
  const rightRaised = capture(guide);
  const { baseline, frontRaised, options } = guide;
  if (!rightRaised || !baseline || !frontRaised) return;
  const result = learnAxisMapping(baseline, frontRaised, rightRaised);
  if (!result.ok) {
    show(guide, 'idle', t(`sensorSource.learn.err.${result.error}`));
    return;
  }
  const problem = options.check?.(result.mapping) ?? null;
  if (problem) {
    show(guide, 'idle', t(problem));
    return;
  }
  options.setLearnedMounting(result.mapping);
  show(guide, 'idle', t('sensorSource.learn.done'));
}
