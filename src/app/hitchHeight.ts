/**
 * A caravan's hitch height (#598): saved while it still sits on the tow
 * ball, then the jockey wheel is guided back to it before hitching up.
 * Going back is a mode: while it is on, the level screen measures against
 * the saved pitch instead of level or a target.
 */
import type { Calibration } from '../domain/calibration';
import { hitchCalibration, hitchPitchFromReading } from '../domain/hitchHeight';
import { loadHitchPitch, saveHitchPitch } from '../data/settingsStore';
import type { KeyValueStorage } from '../data/keyValueStorage';

export interface HitchHeightDeps {
  /** The active sensor's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** What "level" means now, which the hitch height is measured from. */
  zeroCalibration(): Calibration | null;
  /** Only a caravan has a jockey wheel to crank. */
  isCaravan(): boolean;
  /** The saved height or the mode changed. */
  onChanged(): void;
  storage?: KeyValueStorage | null;
}

export interface HitchHeight {
  /** The saved pitch from the zero, or null when none is saved. */
  savedPitch(): number | null;
  /** Save the current pitch, replacing any earlier one: null when saved,
   * or the message to show instead. */
  save(): string | null;
  /** Going back to the saved height right now. */
  isActive(): boolean;
  /** Start going back; does nothing without a saved height. */
  start(): void;
  stop(): void;
  /** What "done" means while going back; null while not going back. */
  activeCalibration(): Calibration | null;
  /** The main screen offers "Save the hitch height first?": a caravan
   * with none saved, until it is saved or dismissed. */
  isOfferDue(): boolean;
  dismissOffer(): void;
}

export function createHitchHeight(deps: HitchHeightDeps): HitchHeight {
  let saved = loadHitchPitch(deps.storage);
  // Neither is stored: after a reload the app levels as usual again, and
  // the next trip offers to save once more.
  let going = false;
  let offerDismissed = false;
  const isActive = () => going && saved !== null && deps.isCaravan();
  return {
    savedPitch: () => saved,
    save() {
      const reading = deps.readTilt();
      if (typeof reading === 'string') return reading;
      saved = hitchPitchFromReading(reading, deps.zeroCalibration());
      saveHitchPitch(saved, deps.storage);
      deps.onChanged();
      return null;
    },
    isActive,
    start() {
      going = saved !== null;
      deps.onChanged();
    },
    stop() {
      going = false;
      deps.onChanged();
    },
    activeCalibration: () =>
      isActive() ? hitchCalibration(deps.zeroCalibration(), saved ?? 0) : null,
    isOfferDue: () => deps.isCaravan() && saved === null && !offerDismissed,
    dismissOffer() {
      offerDismissed = true;
    },
  };
}
