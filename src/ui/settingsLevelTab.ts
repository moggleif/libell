/**
 * Settings › Level (#329): what counts as level (Tolerance), which side
 * drains, and the saved targets (#122, ADR 0013), which the host supplies
 * as an embedded section.
 */
import { DRAIN_POSITIONS, type DrainPosition, type LevelSettings } from '../domain/settings';
import {
  createHint,
  createLengthField,
  createSectionHeading,
  createSelectField,
  type NumberField,
  type RawSettings,
  type SettingsFormContext,
} from './settingsFields';
import { t, type MessageKey } from './i18n';

export interface LevelTab {
  tolerance: NumberField;
  /** Tolerance and Drain side with their hints, without the targets. */
  fieldElements(): HTMLElement[];
  /** The whole tab: the fields, then the saved targets under a heading. */
  elements(targets: HTMLElement): HTMLElement[];
  relabel(): void;
  read(raw: RawSettings): void;
  populate(settings: LevelSettings): void;
}

export function createLevelTab(initial: LevelSettings, context: SettingsFormContext): LevelTab {
  const { state } = context;
  const tolerance = createLengthField(
    'toleranceMm',
    { label: () => 'settings.tolerance', stepMm: 1 },
    state,
  );
  const toleranceHint = createHint();

  // Where the waste-water outlet sits (#93). Within the tolerance the plan
  // leaves this side lowest so the drains keep working. It decides which
  // way the vehicle may lean within the tolerance, so it is about level,
  // not about the ramps (#329).
  const drain = createSelectField<DrainPosition>(
    DRAIN_POSITIONS.map((value) => ({ value, label: `drain.${value}` as MessageKey })),
    initial.drainPosition,
  );
  drain.control.addEventListener('change', () => context.changed());
  const drainHint = createHint();

  const targetsHeading = createSectionHeading();

  const fieldElements = (): HTMLElement[] => [
    tolerance.element,
    toleranceHint,
    drain.element,
    drainHint,
  ];

  return {
    tolerance,
    fieldElements,
    elements: (targets) => [...fieldElements(), targetsHeading, targets],
    relabel: () => {
      // Which side drains is a motorhome choice, like the ramp count.
      drain.element.hidden = state.vehicle === 'caravan';
      drainHint.hidden = state.vehicle === 'caravan';
      drain.caption.textContent = t('settings.drain');
      drain.relabelOptions();
      drainHint.textContent = t('settings.drainHint');
      toleranceHint.textContent = t('settings.tolerance.hint');
      targetsHeading.textContent = t('menu.targets');
    },
    read: (raw) => {
      raw.drainPosition = drain.control.value;
    },
    populate: (settings) => {
      drain.control.value = settings.drainPosition;
    },
  };
}
