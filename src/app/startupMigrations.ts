/**
 * External-sensor storage moved from device-named keys to per-source ones
 * (#263, ADR 0016). Each copy runs before anything reads either value,
 * exactly once (they carry their own markers), and never overwrites or
 * resurrects anything — see the functions for why the legacy keys are
 * copied rather than moved.
 */
import { migrateLegacyRememberedDeviceId } from '../data/sensorDeviceStore';
import { migrateLegacyInstallCalibration, migrateMeasurementsSaved } from '../data/settingsStore';

export function runStartupMigrations(): void {
  migrateLegacyInstallCalibration();
  migrateMeasurementsSaved();
  migrateLegacyRememberedDeviceId();
}
