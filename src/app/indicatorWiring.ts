/**
 * The main screen's indicators: each mounts into its slot and redraws on
 * `refresh()`.
 */
import type { Calibration, SensorSource } from '../domain/settings';
import type { OrientationSensor } from '../sensor/orientation';
import { createIndicators } from '../ui/indicators';
import type { MenuSection } from '../ui/menu';
import { createSensorStatusIndicator } from '../ui/sensorStatusIndicator';
import { createTargetBadge } from '../ui/targetBadge';
import { indicatorState } from './indicatorState';

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
 * while Normal is active; a tap opens the targets.
 */
export function mountTargetBadge(
  slot: Element | null,
  deps: { activeName: () => string | null; open: () => void },
): Refreshable {
  const badge = createTargetBadge(deps.open);
  const refresh = () => badge.update(deps.activeName());
  slot?.append(badge.element);
  refresh();
  return { refresh };
}

/**
 * The top bar's sensor icon: visible whenever Web Bluetooth
 * exists, or iOS's guide applies (R39); a tap opens the sensor.
 */
export function mountSensorStatus(
  slot: Element | null,
  deps: {
    supported: boolean;
    showIosGuide: boolean;
    sensor: () => OrientationSensor;
    open: () => void;
  },
): Refreshable {
  const status = createSensorStatusIndicator(deps.supported, deps.showIosGuide, deps.open);
  const refresh = () => status.update(deps.sensor().getSource(), deps.sensor().getState());
  slot?.append(status.element);
  refresh();
  return { refresh };
}
