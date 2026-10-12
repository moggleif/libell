/**
 * External-sensor storage moves from device-named keys to per-source ones
 * (ADR 0016). Each copy runs before anything reads either value,
 * exactly once (they carry their own markers), and never overwrites or
 * resurrects anything — see the functions for why the legacy keys are
 * copied rather than moved.
 */
import { migrateLegacyRememberedDeviceId } from '../data/sensorDeviceStore';
import { migrateMeasurementsSaved } from '../data/settingsStore';
import { migrateLegacyInstallCalibration } from '../data/calibrationStore';

export function runStartupMigrations(): void {
  migrateLegacyInstallCalibration();
  migrateMeasurementsSaved();
  migrateLegacyRememberedDeviceId();
}
