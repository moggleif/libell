/**
 * The main screen's indicators: each mounts into its slot and redraws on
 * `refresh()`.
 */
import type { SensorSource } from '../domain/settings';
import type { Calibration } from '../domain/calibration';
import type { OrientationSensor } from '../sensor/orientation';
import { createIndicators } from '../ui/indicators';
import type { MenuSection } from '../ui/menu';
import { createSensorStatusIndicator } from '../ui/sensorStatusIndicator';
import { createHitchBadge } from '../ui/hitchBadge';
import { createTargetBadge } from '../ui/targetBadge';
import { indicatorState } from './indicatorState';
import { isActiveSensorStale } from './sensorStaleness';

export interface Refreshable {
  refresh(): void;
}

export interface BoxPending {
  isPending(): boolean;
  /** Stores a change; a repeat of the current value writes nothing. */
  settle(pending: boolean): void;
}

/**
 * The wizard's box path finished with no box connected: until a
 * box connects, or the phone is calibrated after all, the lamp asks for
 * the box rather than for a phone the user chose not to use.
 */
export function createBoxPending(store: {
  load: () => boolean;
  save: (pending: boolean) => void;
}): BoxPending {
  let pending = store.load();
  return {
    isPending: () => pending,
    settle(next) {
      if (pending === next) return;
      pending = next;
      store.save(next);
    },
  };
}

export interface LampDeps {
  demo: boolean;
  activeSource: () => SensorSource;
  boxPending: BoxPending;
  phoneCalibration: { bias(): Calibration | null; vehicleZero(): Calibration | null };
  activeInstallOffset: () => Calibration | null;
  measurementsSaved: () => boolean;
  open: (section: MenuSection) => void;
}

export function mountLamps(slot: Element | null, deps: LampDeps): Refreshable {
  const indicators = createIndicators(deps.open);
  function refresh(): void {
    const phoneActive = deps.activeSource() === 'phone';
    // A connected box is the box the wizard was waiting for.
    if (!phoneActive) deps.boxPending.settle(false);
    indicators.update(
      indicatorState({
        demo: deps.demo,
        measurementsSaved: deps.measurementsSaved(),
        phoneActive,
        boxPending: deps.boxPending.isPending(),
        phoneCalibrated: deps.phoneCalibration.bias() !== null,
        phoneZeroed: deps.phoneCalibration.vehicleZero() !== null,
        boxZeroed: deps.activeInstallOffset() !== null,
      }),
    );
  }
  slot?.append(indicators.element);
  refresh();
  return { refresh };
}

/**
 * The only main-screen trace of a target preset (ADR 0013): hidden
 * while Normal is active; a tap opens the targets. Going back to a
 * caravan's hitch height (#598) shows its own badge instead, since the
 * target does not apply then; a tap on that one ends the mode.
 */
export function mountTargetBadge(
  slot: Element | null,
  deps: {
    activeName: () => string | null;
    open: () => void;
    hitchActive?: () => boolean;
    stopHitch?: () => void;
  },
): Refreshable {
  const badge = createTargetBadge(deps.open);
  const hitch = createHitchBadge(() => deps.stopHitch?.());
  const refresh = () => {
    const hitching = deps.hitchActive?.() ?? false;
    badge.update(hitching ? null : deps.activeName());
    hitch.update(hitching);
  };
  slot?.append(badge.element, hitch.element);
  refresh();
  return { refresh };
}

/**
 * The top bar's sensor icon: visible whenever Web Bluetooth
 * exists, or iOS's guide applies (R39); a tap opens the sensor. Stale
 * data gets the warning look too (R32), checked on every refresh.
 */
export function mountSensorStatus(
  slot: Element | null,
  deps: {
    supported: boolean;
    showIosGuide: boolean;
    sensor: () => OrientationSensor;
    open: () => void;
    now?: () => number;
  },
): Refreshable {
  const status = createSensorStatusIndicator(deps.supported, deps.showIosGuide, deps.open);
  const now = deps.now ?? (() => performance.now());
  const refresh = () => {
    const sensor = deps.sensor();
    status.update(sensor.getSource(), sensor.getState(), isActiveSensorStale(sensor, now()));
  };
  slot?.append(status.element);
  refresh();
  return { refresh };
}
