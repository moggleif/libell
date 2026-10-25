/**
 * Anonymous counting is decided before anything else (#699): with no choice
 * stored, the choice screen comes first and the app waits behind it. A
 * browser that asks not to be tracked has already answered, and `?demo`
 * never counts, so neither is asked.
 */
import { countingChoice, setCountingOn, type CountingChoiceValue } from '../data/countingStore';
import { showCountingChoice, type CountingChoiceOptions } from '../ui/countingChoice';
import { refusesTracking } from './usage';

export interface CountingGateDeps {
  demo: boolean;
  refusesTracking(): boolean;
  choice(): CountingChoiceValue | null;
  setOn(on: boolean): void;
  show(options: CountingChoiceOptions): void;
}

/** Runs `then` once counting is decided: at once, or after the answer. */
export function decideCountingFirst(deps: CountingGateDeps, then: () => void): void {
  if (deps.demo || deps.refusesTracking() || deps.choice() !== null) {
    then();
    return;
  }
  deps.show({
    onChoose(on) {
      deps.setOn(on);
      then();
    },
  });
}

export function browserCountingGate(demo: boolean): CountingGateDeps {
  return {
    demo,
    refusesTracking: () =>
      refusesTracking(navigator as Navigator & { globalPrivacyControl?: boolean }),
    choice: () => countingChoice(),
    setOn: (on) => setCountingOn(on),
    show: showCountingChoice,
  };
}
