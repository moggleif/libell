/**
 * The external-sensor wiring: how each box's adapter is built from the
 * settings, and how its own extras — health, the learn guide, the
 * password — are mapped into the shapes the UI renders, so no UI module
 * ever imports a protocol or narrows on a box.
 *
 * The lifecycle itself (connect, reconnect, fallback) is
 * `sensor/externalSensorController.ts`; this module only supplies what it
 * and the pages ask for, one branch per source.
 */
import { tiltFromGravity } from '../domain/leveling';
import {
  axisMappingForEasyLevelMounting,
  EASYLEVEL_PLACEMENTS,
  easyLevelMountingForAxisMapping,
  easyLevelMountingForPlacement,
  easyLevelPlacementOf,
} from '../domain/mountingFacing';
import type { LevelSettings, SensorSource } from '../domain/settings';
import {
  easyLevelSettings,
  MAX_EASYLEVEL_CONNECT_DELAY_MS,
  withEasyLevelSettings,
  withXparkleSettings,
  xparkleSettings,
  type EasyLevelMounting,
} from '../domain/sensorDeviceSettings';
import {
  createEasyLevelSensor,
  createWebBluetoothTransport,
  type EasyLevelSensor,
} from '../sensor/easyLevelSensor';
import {
  createSimulatedEasyLevelTransport,
  easyLevelSimulationMode,
  isRememberedEasyLevelDeviceUsable,
} from '../sensor/easyLevelSimulator';
import { externalSensorById, type ExternalSensorHealth } from '../sensor/externalSensors';
import {
  createXparkleSensor,
  createXparkleTransport,
  type XparkleSensor,
} from '../sensor/xparkleSensor';
import { isRememberedXparkleDeviceUsable, xparkleSimulationMode } from '../sensor/xparkleSimulator';
import type { BoxPasswordOptions } from '../ui/boxPasswordBlock';
import type { ExternalSensorCalibrationState } from '../ui/calibrationSection';
import type { LearnMountingOptions } from '../ui/learnMountingSection';
import type { InstallOffsets } from './installOffsets';

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Every adapter this build can construct. A union rather than the bare
 * `ExternalSensor` so the mappers below can reach each one's own extras
 * after narrowing on the source asked for — the casts are safe because
 * `createExternalSensor` is the only thing that builds these, one branch
 * per source.
 */
export type LibellExternalSensor = EasyLevelSensor | XparkleSensor;

/** The live settings, read and replaced (and persisted) by the owner. */
export interface SettingsAccess {
  get(): LevelSettings;
  set(next: LevelSettings): void;
}

export interface BoxWiring {
  settings: SettingsAccess;
  /** The box's adapter if one was ever built, connected or not. */
  getSensor(source: SensorSource): LibellExternalSensor | null;
  /** A stored mounting changes what "level" reads as: refresh the lamps. */
  onMountingChanged(): void;
}

/**
 * The one place a source id becomes a live adapter. `settings` is read
 * live on every connect, so the debug connect delay, the mounting, the
 * learned mapping and a typed password all take effect on the very next
 * attempt or reading without recreating anything.
 */
export function createExternalSensor(
  source: SensorSource,
  settings: () => LevelSettings,
): LibellExternalSensor | null {
  if (source === 'xparkle') {
    return createXparkleSensor(createXparkleTransport(), {
      getAxisMapping: () => xparkleSettings(settings()).axisMapping,
      getPassword: () => xparkleSettings(settings()).password,
    });
  }
  if (source === 'easylevel') {
    return createEasyLevelSensor(
      createEasyLevelTransport(settings),
      () => easyLevelSettings(settings()).mounting,
    );
  }
  return null;
}

/**
 * The simulated box whenever `?easylevel-sim` is on — swapped at
 * this one seam, so everything above it is the code a real box runs
 * through — else the real Web Bluetooth transport.
 */
function createEasyLevelTransport(settings: () => LevelSettings) {
  const simulation = easyLevelSimulationMode();
  if (simulation !== 'off') return createSimulatedEasyLevelTransport(simulation);
  return createWebBluetoothTransport(() => {
    const device = easyLevelSettings(settings());
    return device.connectDelayEnabled ? device.connectDelayMs : 0;
  });
}

export function isRememberedDeviceUsable(source: SensorSource, deviceId: string): boolean {
  return source === 'xparkle'
    ? isRememberedXparkleDeviceUsable(deviceId)
    : isRememberedEasyLevelDeviceUsable(deviceId);
}

/** A simulated box is always reachable; a real one after a restart only
 * where the browser exposes getDevices(). */
export function hasPersistentDeviceAccess(): boolean {
  return (
    easyLevelSimulationMode() !== 'off' ||
    xparkleSimulationMode() !== 'off' ||
    typeof navigator.bluetooth?.getDevices === 'function'
  );
}

/**
 * A box's health in the shape the UI renders. A field left null
 * reads as "nothing has arrived yet"; a field the box does not have at all
 * is excluded by its descriptor's capabilities instead, so no row is drawn.
 */
export function healthOf(
  source: SensorSource,
  sensor: LibellExternalSensor | null,
): ExternalSensorHealth | null {
  if (!sensor) return null;
  if (source === 'easylevel') return easyLevelHealth(sensor as EasyLevelSensor);
  if (source === 'xparkle') return xparkleHealth(sensor as XparkleSensor);
  return null;
}

function easyLevelHealth(box: EasyLevelSensor): ExternalSensorHealth | null {
  const status = box.getStatus();
  if (!status) return null;
  return {
    batteryPercent: status.batteryPercent,
    temperatureCelsius: status.temperatureCelsius,
    firmwareLabel: String(status.firmwareTier),
  };
}

/** This box reports battery and nothing else; its descriptor says so, so
 * no temperature or firmware row is drawn to be left empty. */
function xparkleHealth(box: XparkleSensor): ExternalSensorHealth | null {
  const reading = box.getReading();
  if (!reading) return null;
  return {
    batteryPercent: reading.batteryPercent,
    temperatureCelsius: null,
    firmwareLabel: null,
    reportedOrientation: box.getOrientation(),
  };
}

/** Null forgets the mounting: back to the standard placement, and the
 * box's page asks again. */
export function pickEasyLevelMounting(mounting: EasyLevelMounting | null, wiring: BoxWiring): void {
  wiring.settings.set(
    withEasyLevelSettings(wiring.settings.get(), {
      mounting: mounting ?? 'standard',
      mountingPicked: mounting !== null,
    }),
  );
  wiring.onMountingChanged();
}

/**
 * The debug connect delay, clamped here rather than trusted from
 * the page's own input bounds: a value written straight into the settings
 * bypasses `parseSettings`'s clamp until the next reload.
 */
export function withEasyLevelConnectDelay(
  settings: LevelSettings,
  enabled: boolean,
  ms: number,
): LevelSettings {
  const clampedMs = Math.min(MAX_EASYLEVEL_CONNECT_DELAY_MS, Math.max(0, Math.round(ms) || 0));
  return withEasyLevelSettings(settings, {
    connectDelayEnabled: enabled,
    connectDelayMs: clampedMs,
  });
}

type LearnMountingWiring = Omit<LearnMountingOptions, 'name'>;

/** The "learn the mounting" guide for the boxes that offer it; undefined
 * for every other source, so no guide is drawn. */
export function learnMountingFor(
  source: SensorSource,
  wiring: BoxWiring,
): LearnMountingWiring | undefined {
  if (source === 'easylevel') return learnEasyLevelPlacement(wiring);
  if (source === 'xparkle') return learnXparkleMapping(wiring);
  return undefined;
}

/** The Xparkle box learns any axis mapping, read from its own angles. */
function learnXparkleMapping(wiring: BoxWiring): LearnMountingWiring {
  return {
    getRawReading: () => {
      const box = wiring.getSensor('xparkle') as XparkleSensor | null;
      const reading = box?.getState() === 'granted' ? box.getReading() : null;
      return reading ? { pitchDeg: reading.pitchDeg, rollDeg: reading.rollDeg } : null;
    },
    getLearnedMounting: () => xparkleSettings(wiring.settings.get()).axisMapping,
    setLearnedMounting: (axisMapping) => {
      wiring.settings.set(withXparkleSettings(wiring.settings.get(), { axisMapping }));
      wiring.onMountingChanged();
    },
  };
}

/**
 * The EasyLevel lift guide: it learns from the box's reading before any
 * rotation, and stores the result as one of the manual's two
 * placements. A lift showing the arrow backward or sideways, or a
 * mirrored one, is explained instead of stored.
 */
function learnEasyLevelPlacement(wiring: BoxWiring): LearnMountingWiring {
  return {
    getRawReading: () => {
      const box = wiring.getSensor('easylevel') as EasyLevelSensor | null;
      const raw = box?.getState() === 'granted' ? box.getRawGravity() : null;
      if (!raw) return null;
      const tilt = tiltFromGravity(raw, null);
      return { pitchDeg: tilt.pitch * RAD_TO_DEG, rollDeg: tilt.roll * RAD_TO_DEG };
    },
    getLearnedMounting: () => {
      const device = easyLevelSettings(wiring.settings.get());
      return easyLevelPlacementOf(device) ? axisMappingForEasyLevelMounting(device.mounting) : null;
    },
    check: (mapping) => {
      const mounting = easyLevelMountingForAxisMapping(mapping);
      if (!mounting) return 'sensorSource.learn.err.mirrored';
      const allowed = EASYLEVEL_PLACEMENTS.some(
        (placement) => easyLevelMountingForPlacement(placement) === mounting,
      );
      return allowed ? null : 'sensorSource.learn.err.arrow';
    },
    setLearnedMounting: (mapping) =>
      pickEasyLevelMounting(mapping ? easyLevelMountingForAxisMapping(mapping) : null, wiring),
  };
}

/**
 * The box's password, for a source that has one: while the
 * box rejects the code it was offered, the user types the right one in
 * Libell and it is tried at once on the live link, then kept for every
 * later connect. Never routed through the vendor app.
 */
export function passwordFor(
  source: SensorSource,
  wiring: BoxWiring,
): BoxPasswordOptions | undefined {
  if (source !== 'xparkle') return undefined;
  const box = () => wiring.getSensor('xparkle') as XparkleSensor | null;
  return {
    isRejected: () => box()?.isPasswordRejected() ?? false,
    tryPassword(code) {
      wiring.settings.set(withXparkleSettings(wiring.settings.get(), { password: code }));
      return box()?.verifyPassword() ?? Promise.resolve(null);
    },
  };
}

/** A box's calibration state for the Calibration tab; null for the phone
 * and for any source without an installation offset. */
export function externalCalibrationStateFor(
  source: SensorSource,
  offsets: InstallOffsets,
): ExternalSensorCalibrationState | null {
  const descriptor = externalSensorById(source);
  if (!descriptor?.capabilities.installCalibration) return null;
  return {
    name: descriptor.displayName,
    offset: offsets.valueOf(descriptor.id),
    capturedAt: offsets.capturedAtOf(descriptor.id),
  };
}
