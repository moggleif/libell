/** The level screen's elements, driven by the frame through `LevelFrameView`. */
import type { AdjustablePhase } from '../domain/adjustableGuide';
import { createAnnouncer } from '../ui/announcer';
import { createHitchOffer, type HitchOfferOptions } from '../ui/hitchOffer';
import { t } from '../ui/i18n';
import { createLevelOverlay } from '../ui/levelOverlay';
import { createSensorFallbackPrompt } from '../ui/sensorFallbackPrompt';
import { createTiltReadout } from '../ui/tiltReadout';
import type { EngineOutput, LevelEngine } from './levelEngine';
import type { LevelFrameView, PoseProblem } from './levelFrame';
import { button, createElement, paragraph } from '../ui/dom';

export interface LevelScreenViewDeps {
  createEngine(output: EngineOutput): LevelEngine;
  openActiveSensorPage(): void;
  /** The lost-box prompt's Reconnect and its way back to the phone. */
  retry(): Promise<void> | void;
  usePhoneSensor(): void;
  /** What celebrating does besides the overlay: vibrate, chime. */
  onCelebrate(): void;
  /** A caravan's "Save the hitch height first?" (#598); none when omitted. */
  hitchOffer?: HitchOfferOptions;
}

/** Replaces `root`'s content with a fresh level screen. */
export function mountLevelScreenView(root: HTMLElement, deps: LevelScreenViewDeps): LevelFrameView {
  root.replaceChildren();
  root.classList.add('app--level');
  const parts = createParts(deps);
  root.append(
    parts.levelOverlay.element,
    parts.adjustable.element,
    parts.engine.element,
    parts.status.element,
    ...(parts.hitchOffer ? [parts.hitchOffer.element] : []),
    parts.tilt.element,
    parts.waiting,
    parts.fallbackPrompt.element,
    parts.pose.element,
    parts.stale.element,
    parts.announcer.element,
    parts.alarm.element,
  );
  return viewOf(parts, deps);
}

type Parts = ReturnType<typeof createParts>;

function createParts(deps: LevelScreenViewDeps) {
  // What changes on screen without a tap is read out through these (#537).
  const announcer = createAnnouncer();
  const alarm = createAnnouncer(true);
  const status = createStatusLine(announcer.say);
  const tilt = createTiltReadout();
  const adjustable = createAdjustableLine(announcer.say);
  return {
    adjustable,
    announcer,
    alarm,
    status,
    tilt,
    waiting: statusHint(t('main.waiting')),
    fallbackPrompt: createSensorFallbackPrompt(deps.retry, deps.usePhoneSensor),
    levelOverlay: createLevelOverlay(),
    engine: deps.createEngine({
      showStatus(text, isLevel) {
        status.show(text);
        status.markLevel(isLevel);
      },
      showTilt: (reading) => tilt.update(reading),
      showAdjustable: adjustable.show,
    }),
    hitchOffer: deps.hitchOffer ? createHitchOffer(deps.hitchOffer) : null,
    pose: createPoseOverlay(deps.openActiveSensorPage, announcer.say),
    stale: createStaleOverlay(deps.openActiveSensorPage, alarm.say),
  };
}

function viewOf(parts: Parts, deps: LevelScreenViewDeps): LevelFrameView {
  const { status, waiting, fallbackPrompt, levelOverlay, engine, pose, stale, announcer } = parts;
  const { hitchOffer } = parts;
  return {
    pause() {
      pose.element.hidden = true;
      stale.element.hidden = true;
      fallbackPrompt.update(false, true);
      levelOverlay.hideNow();
    },
    showNoData(unavailable, canRetrySilently) {
      dim(parts, true);
      fallbackPrompt.update(unavailable, canRetrySilently);
      // The plain hint and the Retry prompt never show at once.
      waiting.hidden = unavailable;
      if (!unavailable) waiting.textContent = t('main.waiting');
    },
    showReading() {
      dim(parts, false);
      waiting.hidden = true;
      fallbackPrompt.update(false, true);
    },
    showStale: stale.show,
    hideStale: () => (stale.element.hidden = true),
    showPose: pose.show,
    hidePose: () => (pose.element.hidden = true),
    tick(gravity, nowMs, still) {
      hitchOffer?.refresh();
      return engine.tick(gravity, nowMs, still);
    },
    showMeasuring() {
      status.show(t('status.measuring'));
      status.markLevel(false);
    },
    celebrate() {
      deps.onCelebrate();
      levelOverlay.celebrate();
      announcer.say(t('main.level'));
    },
    hideCelebration: () => levelOverlay.hideNow(),
  };
}

/** While there is no reading at all (first load, or a lost box), the
 * diagram and readout are dimmed and say nothing: the last frame's steps
 * must never stay on screen looking live. */
function dim({ engine, tilt, status, adjustable }: Parts, noData: boolean): void {
  engine.element.classList.toggle('is-no-data', noData);
  tilt.element.classList.toggle('is-no-data', noData);
  if (noData) {
    status.show('');
    adjustable.show('hidden');
  }
}

const ADJUSTABLE_TEXT = { before: 'adjustable.before', after: 'adjustable.after' } as const;

/** The adjustable kloss's line above the vehicle (#687): there until the
 * vehicle is level, read out when its sentence changes. */
function createAdjustableLine(say: (text: string) => void) {
  const element = createElement('p', 'adjustable-line');
  element.hidden = true;
  return {
    element,
    show(phase: AdjustablePhase) {
      const text = phase === 'hidden' ? '' : t(ADJUSTABLE_TEXT[phase]);
      if (text !== '' && text !== element.textContent) say(text);
      element.textContent = text;
      element.hidden = text === '';
    },
  };
}

/**
 * The status row speaks only when it has something the diagram cannot
 * show, and hides itself otherwise rather than hold a blank line. A new
 * sentence is read out through `say`: a live region that was hidden a
 * moment ago is often not read.
 */
function createStatusLine(say: (text: string) => void) {
  const element = createElement('p', 'status-line');
  const show = (text: string): void => {
    if (text !== '' && text !== element.textContent) say(text);
    element.textContent = text;
    element.hidden = text === '';
  };
  show('');
  return {
    element,
    show,
    markLevel: (isLevel: boolean) => element.classList.toggle('status-line--level', isLevel),
  };
}

/** Read out when it changes, as a status line. */
function statusHint(text: string): HTMLParagraphElement {
  const element = paragraph('app__hint', text);
  element.setAttribute('role', 'status');
  return element;
}

function sensorPageButton(onClick: () => void): HTMLButtonElement {
  return button('menu__action', t('pose.openSensorPage'), onClick);
}

/** Wrong-pose overlay instead of wrong guidance; for a box, what to do
 * about it and a link to its page. */
function createPoseOverlay(openSensorPage: () => void, say: (text: string) => void) {
  const element = createElement('div', 'pose-overlay');
  element.hidden = true;
  const text = createElement('p', 'pose-overlay__text');
  const hintText = paragraph('pose-overlay__hint', t('pose.sensorHint'));
  const toSensorPage = sensorPageButton(openSensorPage);
  element.append(text, hintText, toSensorPage);
  return {
    element,
    show(problem: PoseProblem) {
      const message = t(problem.message);
      // Every frame re-shows it; read it only when it appears or changes.
      if (element.hidden || text.textContent !== message) say(message);
      text.textContent = message;
      hintText.textContent = t(problem.hint);
      hintText.hidden = toSensorPage.hidden = !problem.offerSensorPage;
      element.hidden = false;
    },
  };
}

/** No trustworthy data at all: the guidance is hidden rather than left
 * frozen; for a box, a link to its page. */
function createStaleOverlay(openSensorPage: () => void, say: (text: string) => void) {
  const element = createElement('div', 'stale-overlay');
  element.hidden = true;
  const text = paragraph('stale-overlay__text', t('stale.dataUnavailable'));
  const toSensorPage = sensorPageButton(openSensorPage);
  element.append(text, toSensorPage);
  return {
    element,
    show(offerSensorPage: boolean) {
      if (element.hidden) say(t('stale.dataUnavailable'));
      toSensorPage.hidden = !offerSensorPage;
      element.hidden = false;
    },
  };
}
