/**
 * The box's setup checklist: 1. direction, 2. zero on level ground (R34).
 * Direction comes first: it is learned from differences and works anywhere,
 * while the zero needs level ground, and the ramp guidance used to reach
 * level ground needs the direction. Every step can be opened at any time:
 * guidance, never a gate.
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
  /** Live position only; cheap enough every frame. */
  refreshPosition(): void;
}

type Refocus = (focus: StepFocus) => void;

type Step = ChecklistStep<SetupStep>;

interface StepPart {
  step: Step;
  /** Returns whether the step is done. */
  refresh(): boolean;
}

/**
 * The facing in which the box's own output needs no mapping. An assumption
 * for the Xparkle box until checked on hardware; the lift guide measures
 * instead, for anyone whose box disagrees.
 */
const AXIS_REFERENCE_FACING: Facing = 'front';

function linkButton(text: string): HTMLButtonElement {
  const button = createElement('button', 'link-button');
  button.type = 'button';
  button.textContent = text;
  return button;
}

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
    // Otherwise the reading is the phone's or stale.
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

/** `pickedLabel` is null while nothing is picked. */
type DirectionPicker = MountingPicker & { pickedLabel(): string | null };

/** The EasyLevel box: its manual's two placements. */
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

function createDirectionStep(
  options: SensorSourceOptions,
  shape: BoxShape,
  refocus: Refocus,
): StepPart | null {
  const usesEasyLevelMounting = options.sensor.capabilities.mounting;
  if (!usesEasyLevelMounting && !options.learnMounting) return null;
  const step = createChecklistStep<SetupStep>('direction', 1);
  // Stays open on the pick, so the choice is seen; closed by hand.
  const keepOpen = () => refocus({ kind: 'opened', step: 'direction' });
  const picker = usesEasyLevelMounting
    ? createEasyLevelPicker(options, keepOpen)
    : createFacingPicker(options, shape, keepOpen);
  const liftGuide = createLiftGuide(options, keepOpen);
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
  // Shown only while the last zero came back with a tilt warning: warn,
  // never block.
  const anyway = createElement('button', 'menu__action menu__action--secondary');
  anyway.type = 'button';
  anyway.textContent = t('calibration.vehicle.anyway');
  anyway.hidden = true;
  const links = createElement('div', 'box-step__links');
  const clear = linkButton(t('sensorSource.install.clear'));
  links.append(clear);
  step.body.append(hint, zeroButton, links, status, anyway);
  return { step, hint, zeroButton, status, anyway, links, clear };
}

/** Returns whether the box is zeroed. */
function drawZeroStep(
  options: SensorSourceOptions,
  parts: ReturnType<typeof createZeroStepParts>,
  message: ZeroMessage,
): boolean {
  const zeroed = options.getInstallCalibration() !== null;
  parts.step.title.textContent = zeroTitle(zeroed, options.getInstallCalibrationCapturedAt());
  setStepDone(parts.step, zeroed);
  parts.hint.hidden = zeroed;
  // A box that zeroes itself keeps that zero: no Libell zero to forget.
  parts.links.hidden = !zeroed || options.sensor.capabilities.zeroesItself;
  parts.zeroButton.textContent = t(zeroed ? 'box.step.zero.again' : 'sensorSource.install.now');
  parts.status.hidden = message.text === null;
  parts.status.textContent = message.text ?? '';
  parts.status.classList.toggle('menu__text--warning', message.warned);
  parts.anyway.hidden = !message.warned;
  parts.clear.disabled = !zeroed;
  return zeroed;
}

/** A box that zeroes itself answers asynchronously. */
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

/** Without the box nothing can be set, but steps still open to show what is
 * set. The data mark lets the next redraw undo exactly this greying. */
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
