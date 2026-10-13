/**
 * The building blocks every Settings tab shares: a captioned field
 * row, select/number/checkbox fields, hints and section headings, and the
 * state and callbacks the tabs need from the form that owns them.
 *
 * Captions are not set when a field is built: every caption is (re)written
 * by the tab's `relabel`, which the form calls whenever the unit or the
 * vehicle changes — the same pass that keeps labels like "Wheelbase (cm)"
 * and the caravan's "Axle to jockey wheel" current.
 */
import { formatLengthValue, mmToUnit, unitToMm } from '../domain/lengths';
import type { AxleConfig, LevelSettings, VehicleType } from '../domain/settings';
import type { Range } from '../domain/untrustedValues';
import { t, type MessageKey } from './i18n';
import { createElement } from './dom';

export type DisplayUnit = LevelSettings['displayUnit'];

/** What the whole form edits at once, read by every tab while relabelling. */
export interface SettingsFormState {
  unit: DisplayUnit;
  vehicle: VehicleType;
  axle: AxleConfig;
}

/** What a tab may ask of the form it belongs to. */
export interface SettingsFormContext {
  readonly state: SettingsFormState;
  /** True in the wizard's reduced steps, which save on Next only. */
  readonly compact: boolean;
  /** Stores the form's values at once; a no-op in a wizard step. */
  changed(): void;
  /** Rewrites every caption, after the unit or the vehicle changed. */
  relabelAll(): void;
  /** The form's values as settings, the way they would be stored. */
  currentSettings(): LevelSettings;
}

/** Raw values a tab hands to `parseSettings`. */
export type RawSettings = Record<string, unknown>;

export interface Field<T extends HTMLElement> {
  element: HTMLLabelElement;
  caption: HTMLSpanElement;
  control: T;
}

function captioned<T extends HTMLElement>(control: T): Field<T> {
  const element = createElement('label', 'settings__field');
  const caption = document.createElement('span');
  element.append(caption, control);
  return { element, caption, control };
}

export interface SelectField<V extends string> extends Field<HTMLSelectElement> {
  /** Re-translates the options that carry a message key. */
  relabelOptions(): void;
  value(): V;
}

/**
 * A `<select>` row. Options with a `label` key are translated by
 * `relabelOptions`; options with `text` show that text as-is (numbers,
 * units, language names).
 */
export function createSelectField<V extends string>(
  options: readonly { value: V; label?: MessageKey; text?: string }[],
  selected: V,
): SelectField<V> {
  const select = createElement('select', 'settings__select');
  const translated: [HTMLOptionElement, MessageKey][] = [];
  for (const { value, label, text } of options) {
    const option = document.createElement('option');
    option.value = value;
    if (text !== undefined) option.textContent = text;
    select.append(option);
    if (label) translated.push([option, label]);
  }
  select.value = selected;
  return {
    ...captioned(select),
    relabelOptions: () => {
      for (const [option, label] of translated) option.textContent = t(label);
    },
    value: () => select.value as V,
  };
}

export function createCheckboxField(checked: boolean): Field<HTMLInputElement> {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'settings__checkbox';
  input.checked = checked;
  return captioned(input);
}

export type NumberKey =
  | 'wheelbaseMm'
  | 'trackWidthFrontMm'
  | 'trackWidthRearMm'
  | 'toleranceMm'
  | 'stabilityMm'
  | 'dwellRestMs'
  | 'dwellMotionMs';

/**
 * A number the user types. Lengths (`stepMm`) are shown and typed in the
 * chosen unit and stored in mm; anything else (the response delays, ms)
 * is shown as stored.
 */
export interface NumberField extends Field<HTMLInputElement> {
  key: NumberKey;
  /** True for lengths, which follow the display unit. */
  inUnit: boolean;
  /** Zero is a usable value (Stability); otherwise it must be positive. */
  allowZero: boolean;
  /** Shows a stored value. */
  show(stored: number): void;
  /** The typed value in storage units; NaN when empty. */
  read(): number;
  /** Whether the typed value can be stored. */
  isUsable(): boolean;
  /** Why the typed value cannot be stored, or null when it can. */
  problem(): string | null;
  relabel(): void;
}

interface LengthOptions {
  /** The caption, which may depend on the vehicle. */
  label: () => MessageKey;
  stepMm: number;
  /** Lowest value the spinner offers; one step when omitted. */
  min?: number;
  /** The plausible range in mm, the same one stored values are held to
   * (`LENGTH_RANGES_MM`, #541). */
  range?: Range;
}

interface PlainOptions {
  label: MessageKey;
  min: number;
  step: number;
}

export function createLengthField(
  key: NumberKey,
  options: LengthOptions,
  state: SettingsFormState,
): NumberField {
  const limits = { allowZero: options.min === 0, range: options.range };
  return createNumberField(key, true, limits, state, (field) => {
    field.caption.textContent = `${t(options.label())} (${state.unit})`;
    field.control.step = String(mmToUnit(options.stepMm, state.unit));
    field.control.min = String(options.min ?? mmToUnit(options.stepMm, state.unit));
  });
}

export function createPlainNumberField(
  key: NumberKey,
  options: PlainOptions,
  state: SettingsFormState,
): NumberField {
  const field = createNumberField(key, false, { allowZero: false }, state, (f) => {
    f.caption.textContent = t(options.label);
  });
  field.control.min = String(options.min);
  field.control.step = String(options.step);
  return field;
}

interface Limits {
  /** Zero is a usable value; otherwise it must be positive. */
  allowZero: boolean;
  /** The plausible range in mm, if the value has one. */
  range?: Range | undefined;
}

function createNumberField(
  key: NumberKey,
  inUnit: boolean,
  { allowZero, range }: Limits,
  state: SettingsFormState,
  relabel: (field: Field<HTMLInputElement>) => void,
): NumberField {
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'decimal';
  input.name = key;
  const field = captioned(input);
  const read = (): number =>
    inUnit ? unitToMm(input.valueAsNumber, state.unit) : input.valueAsNumber;
  const problem = (): string | null => {
    const value = read();
    if (!(Number.isFinite(value) && (allowZero ? value >= 0 : value > 0))) {
      return t(allowZero ? 'settings.err.notNegative' : 'settings.err.positive');
    }
    return range ? rangeProblem(value, range, state.unit) : null;
  };
  return {
    ...field,
    key,
    inUnit,
    allowZero,
    show: (stored) => {
      input.value = String(inUnit ? mmToUnit(stored, state.unit) : stored);
    },
    read,
    isUsable: () => problem() === null,
    problem,
    relabel: () => relabel(field),
  };
}

/** The "from … to …" text for a length outside `range`, or null inside
 * it; the step-height Add row shares it. */
export function rangeProblem(mm: number, range: Range, unit: DisplayUnit): string | null {
  if (mm >= range.min && mm <= range.max) return null;
  const min = formatLengthValue(range.min, unit);
  return t('settings.err.range', { min, max: formatLengthValue(range.max, unit) });
}

export function createHint(): HTMLParagraphElement {
  const hint = createElement('p', 'settings__hint');
  return hint;
}

export function createSectionHeading(): HTMLParagraphElement {
  const heading = createElement('p', 'settings__section');
  return heading;
}
