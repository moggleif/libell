/**
 * Several vehicles (#599, ADR 0017): the list under `libell.vehicles`, and
 * moving one vehicle's values in and out of the app's ordinary keys.
 */
import { parseSettings } from '../domain/settingsParsing';
import {
  defaultVehicleList,
  parseVehicleList,
  vehicleFieldsOf,
  withVehicleFields,
  type Vehicle,
  type VehicleList,
} from '../domain/vehicles';
import { vehicleCalibrationKeys } from './calibrationStore';
import {
  defaultStorage,
  guarded,
  readJson,
  removeItem,
  writeItem,
  writeJson,
  type MaybeStorage,
} from './keyValueStorage';
import { rememberedDeviceKeys } from './sensorDeviceStore';
import type { StoredKey } from './storedKeys';
import { loadSettings, saveSettings, vehicleFlagKeys } from './settingsStore';

const VEHICLES_KEY = 'libell.vehicles';

/** Every key that belongs to the active vehicle rather than the phone. */
function vehicleKeys(): string[] {
  return [...vehicleCalibrationKeys(), ...vehicleFlagKeys(), ...rememberedDeviceKeys()];
}

/** An install from before #599, or a corrupt list, has one vehicle: the
 * one stored now, so nothing is lost. */
export function loadVehicleList(storage: MaybeStorage = defaultStorage()): VehicleList {
  return readJson(storage, VEHICLES_KEY, parseVehicleList, null) ?? defaultVehicleList();
}

export function saveVehicleList(list: VehicleList, storage: MaybeStorage = defaultStorage()): void {
  writeJson(storage, VEHICLES_KEY, list);
}

/** The active vehicle's values as they stand, to keep while it waits. */
export function captureActiveVehicle(
  storage: MaybeStorage = defaultStorage(),
): Pick<Vehicle, 'fields' | 'stored'> {
  const stored: Record<string, string> = {};
  for (const key of vehicleKeys()) {
    const value = guarded(() => storage?.getItem(key), null);
    if (typeof value === 'string') stored[key] = value;
  }
  return { fields: vehicleFieldsOf(loadSettings(storage)), stored };
}

/** Makes `vehicle` the one in the ordinary keys; the app-wide settings and
 * the phone's own calibration stay as they are. */
export function restoreVehicle(
  vehicle: Pick<Vehicle, 'fields' | 'stored'>,
  storage: MaybeStorage = defaultStorage(),
): void {
  const keys = vehicleKeys();
  for (const key of keys) removeItem(storage, key);
  // Only a vehicle's own keys: a stored snapshot can never write anything else.
  for (const key of keys) {
    const value = vehicle.stored[key];
    if (value !== undefined) writeItem(storage, key, value);
  }
  saveSettings(parseSettings(withVehicleFields(loadSettings(storage), vehicle.fields)), storage);
}

/** Every key this store writes (#678). */
export function vehicleStoredKeys(): StoredKey[] {
  return [{ key: VEHICLES_KEY, kind: 'vehicles' }];
}
