/**
 * Settings › Vehicle (#329): the vehicle type, its axle, the three
 * measurements the leveling math runs on, where to find them, and a link
 * to share them with another phone.
 */
import type { AxleConfig, LevelSettings, VehicleType } from '../domain/settings';
import {
  createLengthField,
  createSelectField,
  type NumberField,
  type RawSettings,
  type SelectField,
  type SettingsFormContext,
} from './settingsFields';
import { t } from './i18n';

export interface VehicleTab {
  /** The three measurements, in the order they are shown. */
  measurements: NumberField[];
  measureHint: HTMLParagraphElement;
  /** Every element of the tab, in order. */
  elements(): HTMLElement[];
  relabel(): void;
  read(raw: RawSettings): void;
  populate(settings: LevelSettings): void;
}

export function createVehicleTab(
  initial: LevelSettings,
  context: SettingsFormContext,
  onShare: (settings: LevelSettings) => void,
): VehicleTab {
  const { state } = context;
  const isCaravan = (): boolean => state.vehicle === 'caravan';

  // Motorhome (four wheels) or caravan (single axle + jockey wheel, #72):
  // the caravan hides the front track width and relabels the wheelbase as
  // the axle-to-jockey distance.
  const vehicleField = createSelectField<VehicleType>(
    [
      { value: 'motorhome', label: 'vehicle.motorhome' },
      { value: 'caravan', label: 'vehicle.caravan' },
    ],
    initial.vehicleType,
  );
  // Single or boggie (tandem) pair (#81): an independent dimension, not
  // more vehicle types — the boggie is one leveling axle at its midpoint
  // (ADR 0009).
  const axleField = createSelectField<AxleConfig>(
    [
      { value: 'single', label: 'axle.single' },
      { value: 'boggie', label: 'axle.boggie' },
    ],
    initial.rearAxle,
  );
  const whenChanged = (field: SelectField<string>, update: () => void): void => {
    field.control.addEventListener('change', () => {
      update();
      context.relabelAll();
      context.changed();
    });
  };
  whenChanged(axleField, () => {
    state.axle = axleField.value() === 'boggie' ? 'boggie' : 'single';
  });

  const wheelbase = createLengthField(
    'wheelbaseMm',
    { label: () => (isCaravan() ? 'settings.axleToJockey' : 'settings.wheelbase'), stepMm: 10 },
    state,
  );
  const trackFront = createLengthField(
    'trackWidthFrontMm',
    { label: () => 'settings.trackFront', stepMm: 10 },
    state,
  );
  // A caravan's single axle has no "rear".
  const trackRear = createLengthField(
    'trackWidthRearMm',
    { label: () => (isCaravan() ? 'settings.track' : 'settings.trackRear'), stepMm: 10 },
    state,
  );
  const measurements = [wheelbase, trackFront, trackRear];

  whenChanged(vehicleField, () => {
    state.vehicle = vehicleField.value() === 'caravan' ? 'caravan' : 'motorhome';
  });

  // Where to find the numbers — the biggest data-entry hurdle for new
  // users is not typing, it's knowing (#69).
  const measureHint = document.createElement('p');
  measureHint.className = 'settings__hint';
  measureHint.textContent = t('settings.measureHint');

  // Share vehicle setup (R41, #207): a link carrying only the vehicle-
  // geometry fields on this page — never calibration, never UI/behavior
  // preferences (`domain/vehicleShare.ts`) — for a family member using the
  // same vehicle.
  const shareButton = document.createElement('button');
  shareButton.type = 'button';
  // The trailing class is a stable hook for the fit test, which has to
  // reach the incoming-setup view the way a real user does — by producing
  // a real share link from this button (scripts/fit-test.mjs). Matching on
  // the label instead would mean duplicating the i18n table in the test.
  // A quiet link, not a button (#329): sharing is a rare errand, and a
  // full-width button made it look like the page's main action.
  shareButton.className = 'link-button settings__share-vehicle';
  shareButton.textContent = t('settings.shareVehicle');
  shareButton.addEventListener('click', () => onShare(context.currentSettings()));

  return {
    measurements,
    measureHint,
    elements: () => [
      vehicleField.element,
      axleField.element,
      ...measurements.map((m) => m.element),
      measureHint,
      shareButton,
    ],
    relabel: () => {
      vehicleField.caption.textContent = t('settings.vehicle');
      vehicleField.relabelOptions();
      axleField.caption.textContent = t(isCaravan() ? 'settings.axle' : 'settings.rearAxle');
      axleField.relabelOptions();
      // A caravan has one axle — the front track width does not apply.
      trackFront.element.hidden = isCaravan();
      // A caravan's "wheelbase" is the axle-to-jockey distance, which the
      // registration document does not list (#327).
      measureHint.textContent =
        t(isCaravan() ? 'settings.measureHint.caravan' : 'settings.measureHint') +
        (state.axle === 'boggie' ? ` ${t('settings.measureHint.boggie')}` : '');
    },
    read: (raw) => {
      raw.vehicleType = state.vehicle;
      raw.rearAxle = state.axle;
    },
    populate: (settings) => {
      vehicleField.control.value = settings.vehicleType;
      axleField.control.value = settings.rearAxle;
    },
  };
}
