/**
 * Storing every Settings change as it is made, with a "Saved · Undo"
 * toast, and reporting a number that cannot be used. The wizard's compact
 * steps save on Next instead.
 */
import {
  measurementsDiffer,
  soundPrefsOf,
  type LevelSettings,
  type SoundPrefs,
} from '../domain/settings';
import { markMeasurementsSaved, saveSettings } from '../data/settingsStore';
import { createElement } from './dom';
import { t } from './i18n';
import type { CompactStep } from './settingsLayout';
import type { DisplayUnit, NumberField } from './settingsFields';
import { showActionToast } from './toast';

/** Reading the tabs' fields as settings, and showing settings in them. */
export interface FormValues {
  numberFields: NumberField[];
  /** Rewrites every caption, after the unit or the vehicle changed. */
  relabelAll(): void;
  /** Relabels, then shows each number field's value, skipping undefined. */
  showNumbers(valueOf: (field: NumberField) => number | undefined): void;
  /** Re-renders every length in the unit just chosen, so nothing is lost. */
  showInNewUnit(previous: DisplayUnit): void;
  current(): LevelSettings;
  /** Fill every field from the given settings, with live theme preview. */
  populate(settings: LevelSettings): void;
  showRampSteps(stepsMm: number[], stepless: boolean): void;
}

/**
 * A number the user typed that cannot be used: empty, zero, negative or
 * outside its plausible range. Never refused silently and never replaced by a factory
 * default: the field goes back to the value in effect, and one line
 * under it says what was wrong, until the next change.
 */
function createInvalidNumberReport(numberFields: NumberField[]): {
  restore(inEffect: LevelSettings): void;
} {
  const errors = new Map<HTMLElement, HTMLParagraphElement>();
  function showError(field: HTMLElement, message: string | null): void {
    let error = errors.get(field);
    if (!message) {
      if (error) error.hidden = true;
      return;
    }
    if (!error) {
      error = createElement('p', 'settings__hint settings__error');
      error.setAttribute('role', 'alert');
      errors.set(field, error);
    }
    error.textContent = message;
    error.hidden = false;
    field.after(error);
  }
  return {
    /** Puts the value in effect back into every unusable number field. */
    restore(inEffect) {
      for (const field of numberFields) {
        const problem = field.problem();
        showError(field.element, problem);
        if (problem !== null) field.show(inEffect[field.key]);
      }
    },
  };
}

export interface AutoSave {
  saved(): LevelSettings;
  /** Stores the form's values at once; a no-op in a wizard step. */
  changed(): void;
  /** The wizard step's Next, or Enter in a number field on the full page. */
  submit(): void;
  /** A sound preference already stored elsewhere — not a change of its own. */
  acceptSound(sound: SoundPrefs): void;
}

/**
 * Every change is stored at once: there is no Save button and no
 * "unsaved" state to lose by closing the page. A toast offers to undo
 * it. The wizard's compact steps are the exception — they are saved by
 * their own Next, which submits this form.
 */
export function createAutoSave(
  values: FormValues,
  initial: LevelSettings,
  compact: CompactStep | undefined,
  onSave: (settings: LevelSettings) => void,
): AutoSave {
  const invalidNumbers = createInvalidNumberReport(values.numberFields);
  const store = createSettingsStore(initial, compact, onSave);
  const saved = store.saved;
  const persist = store.persist;
  let undoToast: HTMLElement | null = null;

  function offerUndo(previous: LevelSettings): void {
    undoToast?.remove();
    undoToast = showActionToast(t('settings.saved'), t('settings.undo'), () => {
      values.populate(previous);
      invalidNumbers.restore(saved());
      persist(values.current());
    });
  }
  // What parseSettings settled on (e.g. a motion delay clamped to the rest
  // delay) is what the fields show, then it is stored.
  function showAndPersist(settings: LevelSettings): void {
    for (const field of values.numberFields) field.show(settings[field.key]);
    persist(settings);
  }
  function changed(): void {
    if (compact) return;
    invalidNumbers.restore(saved());
    const next = values.current();
    if (sameFormValues(next, saved())) return;
    const previous = saved();
    showAndPersist(next);
    offerUndo(previous);
  }
  return {
    saved,
    changed,
    submit() {
      if (!compact) {
        changed();
        return;
      }
      const settings = values.current();
      values.showRampSteps(settings.rampStepHeightsMm, settings.rampStepless);
      showAndPersist(settings);
    },
    acceptSound: store.acceptSound,
  };
}

/** What was last stored, and storing the next settings. */
function createSettingsStore(
  initial: LevelSettings,
  compact: CompactStep | undefined,
  onSave: (settings: LevelSettings) => void,
): Pick<AutoSave, 'saved' | 'acceptSound'> & { persist(settings: LevelSettings): void } {
  let saved = initial;
  return {
    saved: () => saved,
    persist(settings) {
      // The ⚠ Setup lamp goes out with the measurements, not with any save:
      // a changed measurement, or the wizard's measurements step
      // confirmed with Next even if the values shown were kept.
      if (compact === 'measurements' || measurementsDiffer(saved, settings)) {
        markMeasurementsSaved();
      }
      saveSettings(settings);
      saved = settings;
      onSave(settings);
    },
    acceptSound(sound) {
      saved = { ...saved, ...soundPrefsOf(sound) };
    },
  };
}

/** Only what this form edits: the sensor source and its devices are not
 * (see `readSettings` in `settingsPanel.ts`). */
function sameFormValues(a: LevelSettings, b: LevelSettings): boolean {
  const formValues = ({ sensorSource, sensorDevices, ...rest }: LevelSettings): string => {
    void sensorSource;
    void sensorDevices;
    return JSON.stringify(rest);
  };
  return formValues(a) === formValues(b);
}
