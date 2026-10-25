/**
 * External-sensor storage moves from device-named keys to per-source ones
 * (ADR 0016). Each copy runs before anything reads either value,
 * exactly once (they carry their own markers), and never overwrites or
 * resurrects anything — see the functions for why the legacy keys are
 * copied rather than moved. #674's counting off switch becomes the choice
 * "don't count" (#699).
 */
import { migrateLegacyRememberedDeviceId } from '../data/sensorDeviceStore';
import { migrateMeasurementsSaved } from '../data/settingsStore';
import { migrateLegacyInstallCalibration } from '../data/calibrationStore';
import { migrateLegacyCountingOff } from '../data/countingStore';

export function runStartupMigrations(): void {
  migrateLegacyInstallCalibration();
  migrateMeasurementsSaved();
  migrateLegacyRememberedDeviceId();
  migrateLegacyCountingOff();
}
