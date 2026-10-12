/**
 * The box's setup (#314, the #309 UX review): one checklist of two steps
 * instead of stacked sections of paragraphs and buttons —
 *   1. direction, by tapping a side of the vehicle (`mountingPicker.ts`),
 *      with the lift guide (#293) one quiet link away;
 *   2. zero on level ground (R34, #290).
 * Direction comes before the zero: it is learned from differences and works
 * anywhere, while the zero needs level ground — and the ramp guidance used
 * to reach level ground needs the direction first. Only the next undone
 * step is expanded, but every one can be opened and run at any time:
 * guidance, never a gate.
 *
 * Above it, the box's position as a live status line (#332), not a step:
 * nothing to tap. The device page puts it at the start of its live tilt
 * line; the first-run wizard shows it on its own.
 *
 * The install half of `sensorSourceSection.ts`.
 */
import {
  axisMappingForFacing,
  easyLevelMountingForPlacement,
  easyLevelPlacementOf,
  facingForAxisMapping,
  type Facing,
} from '../domain/mountingFacing';
import {
  directionTitle,
  expandedStep,
  positionMark,
  positionReport,
  zeroMessage,
  zeroTitle,
  type SetupStep,
  type StepFocus,
  type ZeroMessage,
} from './boxSetupState';
import { createChecklistStep, expandStep, setStepDone, type ChecklistStep } from './checklistStep';
import { createElement } from './dom';
import { t } from './i18n';
import { createLearnMountingSection } from './learnMountingSection';
import {
  createMountingPicker,
  createPlacementPicker,
  type BoxShape,
  type MountingPicker,
} from './mountingPicker';
import type { SensorSourceOptions } from './sensorSourceSection';

export interface BoxSetupChecklist {
  element: HTMLElement;
  positionElement: HTMLElement;
  refresh(): void;
  /** Re-reads the live position only; cheap enough every frame. */
  refreshPosition(): void;
}

/** Tells the checklist which step to expand next and redraws it. */
type Refocus = (focus: StepFocus) => void;

type Step = ChecklistStep<SetupStep>;

interface StepPart {
  step: Step;
  /** Redraws the step; returns whether it is done. */
  refresh(): boolean;
}

/**
 * The facing in which the box's own output needs no mapping. An assumption
 * for the Xparkle box until checked on hardware (#314); the lift guide
 * measures instead, for anyone whose box disagrees.
 */
const AXIS_REFERENCE_FACING: Facing = 'front';

function linkButton(text: string): HTMLButtonElement {
  const button = createElement('button', 'link-button');
  button.type = 'button';
  button.textContent = text;
  return button;
}

/** Whether this box is the source in use and in contact — what every setup
 * action needs (#343). */
function delivering(options: SensorSourceOptions): boolean {
  return (
    options.getSensorSource() === options.sensor.id && options.getSensorState() !== 'disconnected'
  );
}

function createPositionLine(
  options: SensorSourceOptions,
  shape: BoxShape,
): { element: HTMLElement; refresh(): void } {
  const element = createElement('span', 'box-position');
  const mark = createElement('span', 'box-position__mark');
  mark.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  element.append(mark, title);
  function refresh(): void {
    // Only this box's own reading says how it stands: while it is not the
    // source in use, or has lost contact, the reading is the phone's or
    // stale, so nothing is said (#343).
    element.hidden = !delivering(options);
    if (element.hidden) return;
    const report = positionReport(options.getCalibratedTilt?.() ?? null, shape);
    title.textContent = report.text;
    mark.textContent = positionMark(report.ok);
    element.classList.toggle('is-done', report.ok === true);
    element.classList.toggle('is-warning', report.ok === false);
  }
  return { element, refresh };
}

/** A direction picker, with what the closed step names as picked (null
 * while it still asks). */
type DirectionPicker = MountingPicker & { pickedLabel(): string | null };

/** The EasyLevel box: its manual's two placements (#359). */
function createEasyLevelPicker(
  options: SensorSourceOptions,
  onPicked: () => void,
): DirectionPicker {
  const getPlacement = () =>
    easyLevelPlacementOf({
      mounting: options.getMounting(),
      mountingPicked: options.isMountingPicked(),
    });
  const picker = createPlacementPicker({
    getVehicleType: () => options.getVehicleType?.() ?? 'motorhome',
    getPlacement,
    setPlacement: (placement) => {
      options.setMounting(easyLevelMountingForPlacement(placement));
      onPicked();
    },
  });
  const pickedLabel = () => {
    const placement = getPlacement();
    return placement ? t(`mounting.placement.${placement}`) : null;
  };
  return { ...picker, pickedLabel };
}

/** Any other box: a tap on the side its reference side points to. */
function createFacingPicker(
  options: SensorSourceOptions,
  shape: BoxShape,
  onPicked: () => void,
): DirectionPicker {
  const getFacing = () =>
    facingForAxisMapping(
      options.learnMounting?.getLearnedMounting() ?? null,
      AXIS_REFERENCE_FACING,
    );
  const picker = createMountingPicker({
    shape,
    getVehicleType: () => options.getVehicleType?.() ?? 'motorhome',
    getFacing,
    setFacing: (facing) => {
      options.learnMounting?.setLearnedMounting(
        axisMappingForFacing(facing, AXIS_REFERENCE_FACING),
      );
      onPicked();
    },
  });
  const pickedLabel = () => {
    const facing = getFacing();
    return facing ? t(`mounting.facing.${facing}`) : null;
  };
  return { ...picker, pickedLabel };
}

/** The lift guide (#293) behind a quiet link, for a box that declares it. */
function createLiftGuide(
  options: SensorSourceOptions,
  onLearned: () => void,
): { elements: HTMLElement[]; refresh(): void } | null {
  if (!options.sensor.capabilities.learnMounting || !options.learnMounting) return null;
  const learnMounting = options.learnMounting;
  const guide = createLearnMountingSection({
    name: options.sensor.displayName,
    ...learnMounting,
    setLearnedMounting: (mapping) => {
      learnMounting.setLearnedMounting(mapping);
      onLearned();
    },
  });
  const link = linkButton(t('box.step.direction.learn'));
  guide.element.hidden = true;
  link.addEventListener('click', () => {
    guide.element.hidden = !guide.element.hidden;
    guide.refresh();
  });
  return { elements: [link, guide.element], refresh: guide.refresh };
}

/** Step 1, for a box with a mounting to pick or a direction to learn. */
function createDirectionStep(
  options: SensorSourceOptions,
  shape: BoxShape,
  refocus: Refocus,
): StepPart | null {
  const usesEasyLevelMounting = options.sensor.capabilities.mounting;
  if (!usesEasyLevelMounting && !options.learnMounting) return null;
  const step = createChecklistStep<SetupStep>('direction', 1);
  // Stays open on the pick, so the choice is seen; closed by hand (#347).
  const keepOpen = () => refocus({ kind: 'opened', step: 'direction' });
  const picker = usesEasyLevelMounting
    ? createEasyLevelPicker(options, keepOpen)
    : createFacingPicker(options, shape, keepOpen);
  const liftGuide = createLiftGuide(options, keepOpen);
  // Undoing a picked or learned direction (#332, #359).
  const forget = linkButton(t('box.forgetDirection'));
  forget.addEventListener('click', () => {
    if (usesEasyLevelMounting) options.setMounting(null);
    else options.learnMounting?.setLearnedMounting(null);
    refocus({ kind: 'next' });
  });
  step.body.append(picker.element, ...(liftGuide?.elements ?? []), forget);

  function refresh(): boolean {
    const picked = picker.pickedLabel();
    step.title.textContent = directionTitle(picked);
    setStepDone(step, picked !== null);
    picker.refresh();
    liftGuide?.refresh();
    forget.hidden = usesEasyLevelMounting
      ? !options.isMountingPicked()
      : options.learnMounting?.getLearnedMounting() == null;
    return picked !== null;
  }
  return { step, refresh };
}

function createZeroStepParts() {
  const step = createChecklistStep<SetupStep>('zero', 2);
  const hint = createElement('p', 'menu__text');
  hint.textContent = t('box.step.zero.hint');
  const zeroButton = createElement('button', 'menu__action');
  zeroButton.type = 'button';
  const status = createElement('p', 'menu__text menu__text--status');
  status.hidden = true;
  // "Zero anyway" (#425, "Varning är rätt. Aldrig stopp."): shown only
  // while the last zero came back with a tilt warning.
  const anyway = createElement('button', 'menu__action menu__action--secondary');
  anyway.type = 'button';
  anyway.textContent = t('calibration.vehicle.anyway');
  anyway.hidden = true;
  // Once zeroed (#332): clear it right here — a quiet link, not the
  // first-time instruction again.
  const links = createElement('div', 'box-step__links');
  const clear = linkButton(t('sensorSource.install.clear'));
  links.append(clear);
  step.body.append(hint, zeroButton, links, status, anyway);
  return { step, hint, zeroButton, status, anyway, links, clear };
}

/** Redraws the zero step; returns whether the box is zeroed. */
function drawZeroStep(
  options: SensorSourceOptions,
  parts: ReturnType<typeof createZeroStepParts>,
  message: ZeroMessage,
): boolean {
  const zeroed = options.getInstallCalibration() !== null;
  parts.step.title.textContent = zeroTitle(zeroed, options.getInstallCalibrationCapturedAt());
  setStepDone(parts.step, zeroed);
  parts.hint.hidden = zeroed;
  // A box that zeroes itself keeps that zero, so there is no Libell zero to
  // forget (#343).
  parts.links.hidden = !zeroed || options.sensor.capabilities.zeroesItself;
  parts.zeroButton.textContent = t(zeroed ? 'box.step.zero.again' : 'sensorSource.install.now');
  parts.status.hidden = message.text === null;
  parts.status.textContent = message.text ?? '';
  parts.status.classList.toggle('menu__text--warning', message.warned);
  parts.anyway.hidden = !message.warned;
  parts.clear.disabled = !zeroed;
  return zeroed;
}

/** Step 2: zero on level ground (R34), for a box with an installation
 * offset. A box that zeroes itself (#290) answers later. */
function createZeroStep(
  options: SensorSourceOptions,
  refocus: Refocus,
  redraw: () => void,
): StepPart | null {
  if (!options.sensor.capabilities.installCalibration) return null;
  const parts = createZeroStepParts();
  const { step, zeroButton, anyway, clear } = parts;
  let message: ZeroMessage = { text: null, warned: false };
  function zero(goAhead: boolean): void {
    const result = options.calibrateInstall(goAhead);
    const answered = !(result instanceof Promise);
    message = answered ? zeroMessage(result) : zeroMessage(t('calibration.external.working'));
    // No second tap while the first is still on its way.
    zeroButton.disabled = !answered;
    refocus({ kind: 'opened', step: 'zero' });
    if (answered) return;
    void result.then((answer) => {
      zeroButton.disabled = false;
      message = zeroMessage(answer);
      redraw();
    });
  }
  zeroButton.addEventListener('click', () => zero(false));
  anyway.addEventListener('click', () => zero(true));
  clear.addEventListener('click', () => {
    options.clearInstallCalibration();
    message = { text: null, warned: false };
    refocus({ kind: 'next' });
  });

  return { step, refresh: () => drawZeroStep(options, parts, message) };
}

/** Without the box nothing can be set: every action greyed out until it is
 * back, while the steps still open to show what is set (#343). The mark
 * lets the next redraw undo exactly this greying and nothing else. */
function greyOutActions(root: HTMLElement, offline: boolean): void {
  if (!offline) return;
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    'button:not(.box-step__header):not(:disabled)',
  )) {
    button.disabled = true;
    button.dataset.offline = '';
  }
}

function undoGreyOut(root: HTMLElement): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-offline]')) {
    button.disabled = false;
    delete button.dataset.offline;
  }
}

/** A tap on a closed step opens it; a tap on an open one closes it and
 * keeps it closed until something changes. */
function wireStepHeader(step: Step, refocus: Refocus, close: () => void): void {
  step.header.addEventListener('click', () => {
    if (step.body.hidden) refocus({ kind: 'opened', step: step.id });
    else close();
  });
}

export function createBoxSetupChecklist(options: SensorSourceOptions): BoxSetupChecklist {
  const shape: BoxShape = options.sensor.capabilities.upright ? 'upright' : 'flat';
  const element = createElement('div', 'box-setup');
  element.hidden = true;
  const position = createPositionLine(options, shape);
  let focus: StepFocus = { kind: 'next' };
  const refocus: Refocus = (next) => {
    focus = next;
    refresh();
  };
  const parts = [
    createDirectionStep(options, shape, refocus),
    createZeroStep(options, refocus, () => refresh()),
  ].filter((part): part is StepPart => part !== null);
  for (const { step } of parts) {
    element.append(step.element);
    wireStepHeader(step, refocus, () => {
      step.body.hidden = true;
      focus = { kind: 'closed' };
    });
  }

  function refresh(): void {
    undoGreyOut(element);
    position.refresh();
    const states = parts.map((part) => ({ step: part.step.id, done: part.refresh() }));
    greyOutActions(element, !delivering(options));
    const expanded = expandedStep(focus, states);
    expandStep(
      parts.map((part) => part.step),
      expanded,
    );
  }
  return { element, positionElement: position.element, refresh, refreshPosition: position.refresh };
}
