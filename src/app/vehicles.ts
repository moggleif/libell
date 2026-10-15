/**
 * Several vehicles (#599, ADR 0017): add, rename, remove and switch. A
 * switch stores the active vehicle's values, puts the other's in their
 * place and reloads, so every part of the app, the box connection among
 * them, starts again from that vehicle exactly as it does on open (R33).
 */
import { DEFAULT_SETTINGS } from '../domain/settings';
import { vehicleFieldsOf, type Vehicle, type VehicleList } from '../domain/vehicles';
import type { VehicleGeometry } from '../domain/vehicleShare';
import type { KeyValueStorage } from '../data/keyValueStorage';
import {
  captureActiveVehicle,
  loadVehicleList,
  restoreVehicle,
  saveVehicleList,
} from '../data/vehicleStore';
import { hasStoredMeasurements, loadSettings, measuredVehicleFlags } from '../data/settingsStore';

export interface VehiclesDeps {
  /** Starts the app again on the vehicle just made active. */
  reload(): void;
  /** A rename, which reloads nothing: the main-screen badge redraws (#616). */
  onRenamed?(): void;
  storage?: KeyValueStorage | null;
  newId?: () => string;
}

export interface VehicleSummary {
  id: string;
  /** Empty for a first vehicle never renamed. */
  name: string;
}

export interface Vehicles {
  list(): VehicleSummary[];
  activeId(): string;
  switchTo(id: string): void;
  /** A new vehicle with a copy of the active one's measurements (or a
   * shared setup's) and no box, zero or targets, made active at once. */
  add(name: string, geometry?: VehicleGeometry): void;
  rename(id: string, name: string): void;
  /** False when it is the only vehicle: one is always needed. */
  remove(id: string): boolean;
}

function randomId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `vehicle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createVehicles(deps: VehiclesDeps): Vehicles {
  const { storage } = deps;
  const newId = deps.newId ?? randomId;
  const load = () => loadVehicleList(storage);
  const activate = (list: VehicleList, next: Vehicle, vehicles = list.vehicles) =>
    activateVehicle(deps, list, next, vehicles);
  return {
    list: () => load().vehicles.map(({ id, name }) => ({ id, name })),
    activeId: () => load().activeId,
    switchTo(id) {
      const list = load();
      const next = list.vehicles.find((vehicle) => vehicle.id === id);
      if (next && id !== list.activeId) activate(list, next);
    },
    add(name, geometry) {
      const list = load();
      const vehicle: Vehicle = { id: newId(), name, ...newVehicleValues(storage, geometry) };
      activate(list, vehicle, [...list.vehicles, vehicle]);
    },
    rename(id, name) {
      const list = load();
      const vehicles = list.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, name } : vehicle,
      );
      saveVehicleList({ ...list, vehicles }, storage);
      deps.onRenamed?.();
    },
    remove: (id) => removeVehicle(deps, load(), id),
  };
}

/** A shared setup's geometry, or else a copy of the active vehicle's
 * (#617); never its box, zero or targets, which belong to that vehicle. */
function newVehicleValues(
  storage: KeyValueStorage | null | undefined,
  geometry: VehicleGeometry | undefined,
): Pick<Vehicle, 'fields' | 'stored'> {
  if (geometry) {
    return {
      fields: { ...vehicleFieldsOf(DEFAULT_SETTINGS), ...geometry },
      stored: measuredVehicleFlags(),
    };
  }
  const { sensorSource, sensorDevices } = DEFAULT_SETTINGS;
  const fields = { ...vehicleFieldsOf(loadSettings(storage)), sensorSource, sensorDevices };
  return { fields, stored: hasStoredMeasurements(storage) ? measuredVehicleFlags() : {} };
}

/** Keeps the active vehicle's values, then brings `next` in and starts the
 * app again on it. */
function activateVehicle(
  deps: VehiclesDeps,
  list: VehicleList,
  next: Vehicle,
  vehicles: Vehicle[],
): void {
  const kept = captureActiveVehicle(deps.storage);
  const saved = vehicles.map((vehicle) =>
    vehicle.id === list.activeId ? { ...vehicle, ...kept } : vehicle,
  );
  restoreVehicle(next, deps.storage);
  saveVehicleList({ activeId: next.id, vehicles: saved }, deps.storage);
  deps.reload();
}

function removeVehicle(deps: VehiclesDeps, list: VehicleList, id: string): boolean {
  if (list.vehicles.length < 2) return false;
  const rest = list.vehicles.filter((vehicle) => vehicle.id !== id);
  if (id !== list.activeId) {
    saveVehicleList({ ...list, vehicles: rest }, deps.storage);
    return true;
  }
  // The removed vehicle's values are dropped, not kept: bring another in.
  restoreVehicle(rest[0]!, deps.storage);
  saveVehicleList({ activeId: rest[0]!.id, vehicles: rest }, deps.storage);
  deps.reload();
  return true;
}
