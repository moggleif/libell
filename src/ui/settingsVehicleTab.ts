/**
 * Settings › Vehicle: the vehicle type, its axle, the three
 * measurements the leveling math runs on, where to find them, and a link
 * to share them with another phone.
 */
import {
  LENGTH_RANGES_MM,
  type AxleConfig,
  type LevelSettings,
  type VehicleType,
} from '../domain/settings';
import {
  createLengthField,
  createSelectField,
  type NumberField,
  type RawSettings,
  type SelectField,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { t } from './i18n';
import { button, paragraph } from './dom';

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
  const { vehicleField, axleField } = createVehicleFields(initial, context);
  const [wheelbase, trackFront, trackRear] = createMeasurements(state);
  const measurements = [wheelbase, trackFront, trackRear];
  const measureHint = createMeasureHint();
  const shareButton = createShareButton(() => onShare(context.currentSettings()));
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
    relabel: () => relabel({ vehicleField, axleField, trackFront, measureHint }, state),
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

/** Where to find the numbers — the biggest data-entry hurdle for new
 * users is not typing, it's knowing. */
function createMeasureHint(): HTMLParagraphElement {
  return paragraph('settings__hint', t('settings.measureHint'));
}

function relabel(
  parts: ReturnType<typeof createVehicleFields> & {
    trackFront: NumberField;
    measureHint: HTMLParagraphElement;
  },
  state: SettingsFormState,
): void {
  const { vehicleField, axleField, trackFront, measureHint } = parts;
  const isCaravan = state.vehicle === 'caravan';
  vehicleField.caption.textContent = t('settings.vehicle');
  vehicleField.relabelOptions();
  axleField.caption.textContent = t(isCaravan ? 'settings.axle' : 'settings.rearAxle');
  axleField.relabelOptions();
  // A caravan has one axle — the front track width does not apply.
  trackFront.element.hidden = isCaravan;
  // A caravan's "wheelbase" is the axle-to-jockey distance, which the
  // registration document does not list.
  measureHint.textContent =
    t(isCaravan ? 'settings.measureHint.caravan' : 'settings.measureHint') +
    (state.axle === 'boggie' ? ` ${t('settings.measureHint.boggie')}` : '');
}

/**
 * The vehicle type and its axle. Either change updates the form state,
 * relabels the whole form and saves.
 */
function createVehicleFields(initial: LevelSettings, context: SettingsFormContext) {
  const { state } = context;
  // Motorhome (four wheels) or caravan (single axle + jockey wheel):
  // the caravan hides the front track width and relabels the wheelbase as
  // the axle-to-jockey distance.
  const vehicleField = createSelectField<VehicleType>(
    [
      { value: 'motorhome', label: 'vehicle.motorhome' },
      { value: 'caravan', label: 'vehicle.caravan' },
    ],
    initial.vehicleType,
  );
  // Single or boggie (tandem) pair: an independent dimension, not
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
  whenChanged(vehicleField, () => {
    state.vehicle = vehicleField.value() === 'caravan' ? 'caravan' : 'motorhome';
  });
  return { vehicleField, axleField };
}

/** Wheelbase, front and rear track width, captioned for the vehicle. */
function createMeasurements(state: SettingsFormState): [NumberField, NumberField, NumberField] {
  const isCaravan = (): boolean => state.vehicle === 'caravan';
  return [
    createLengthField(
      'wheelbaseMm',
      {
        label: () => (isCaravan() ? 'settings.axleToJockey' : 'settings.wheelbase'),
        stepMm: 10,
        range: LENGTH_RANGES_MM.wheelbase,
      },
      state,
    ),
    createLengthField(
      'trackWidthFrontMm',
      { label: () => 'settings.trackFront', stepMm: 10, range: LENGTH_RANGES_MM.trackWidth },
      state,
    ),
    // A caravan's single axle has no "rear".
    createLengthField(
      'trackWidthRearMm',
      {
        label: () => (isCaravan() ? 'settings.track' : 'settings.trackRear'),
        stepMm: 10,
        range: LENGTH_RANGES_MM.trackWidth,
      },
      state,
    ),
  ];
}

/**
 * Share vehicle setup: a link carrying only the vehicle-
 * geometry fields on this page — never calibration, never UI/behavior
 * preferences (`domain/vehicleShare.ts`) — for a family member using the
 * same vehicle.
 */
function createShareButton(onClick: () => void): HTMLButtonElement {
  // The trailing class is a stable hook for the fit test, which has to
  // reach the incoming-setup view the way a real user does — by producing
  // a real share link from this button (scripts/fit/views.mjs). Matching on
  // the label instead would mean duplicating the i18n table in the test.
  // A quiet link, not a button: sharing is a rare errand, not the page's
  // main action.
  return button('link-button settings__share-vehicle', t('settings.shareVehicle'), onClick);
}
