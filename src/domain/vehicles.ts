/**
 * Several vehicles (#599): which settings and stored values belong to one
 * vehicle, and the stored list of vehicles. Everything else, the phone's
 * own calibration among it, describes the phone or the app and is shared.
 *
 * Only the active vehicle lives in the app's ordinary keys, so the rest of
 * the app never knows there is more than one. The others wait in this list
 * as snapshots until one becomes active (ADR 0017).
 */
import type { LevelSettings } from './settings';

/** The settings that follow a vehicle: what R41 shares, plus its box. */
const VEHICLE_FIELDS = [
  'vehicleType',
  'rearAxle',
  'wheelbaseMm',
  'trackWidthFrontMm',
  'trackWidthRearMm',
  'rampStepHeightsMm',
  'rampStepless',
  'rampCount',
  'drainPosition',
  'sensorSource',
  'sensorDevices',
] as const satisfies readonly (keyof LevelSettings)[];

export type VehicleFields = Pick<LevelSettings, (typeof VEHICLE_FIELDS)[number]>;

export interface Vehicle {
  id: string;
  /** Empty for the first vehicle until it is renamed: shown as "My vehicle". */
  name: string;
  /** Its settings while it is not active; read back through the settings
   * parser, so a corrupt value falls back to a default. */
  fields: Partial<Record<keyof VehicleFields, unknown>>;
  /** Its stored values (zeros, targets, remembered boxes) while it is not
   * active, by storage key. */
  stored: Record<string, string>;
}

export interface VehicleList {
  activeId: string;
  vehicles: Vehicle[];
}

const FIRST_VEHICLE_ID = 'vehicle-1';

/** An install from before #599: its one vehicle is what is stored now. */
export function defaultVehicleList(): VehicleList {
  return {
    activeId: FIRST_VEHICLE_ID,
    vehicles: [{ id: FIRST_VEHICLE_ID, name: '', fields: {}, stored: {} }],
  };
}

export function vehicleFieldsOf(settings: LevelSettings): VehicleFields {
  return Object.fromEntries(
    VEHICLE_FIELDS.map((field) => [field, settings[field]]),
  ) as unknown as VehicleFields;
}

/** Only the vehicle fields are taken from `fields`; anything else is left. */
export function withVehicleFields(
  settings: LevelSettings,
  fields: Vehicle['fields'],
): Record<string, unknown> {
  const picked = VEHICLE_FIELDS.filter((field) => field in fields).map((field) => [
    field,
    fields[field],
  ]);
  return { ...settings, ...Object.fromEntries(picked) };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseStored(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  return entries.every(([, item]) => typeof item === 'string')
    ? (Object.fromEntries(entries) as Record<string, string>)
    : null;
}

function parseVehicle(value: unknown): Vehicle | null {
  if (!isRecord(value)) return null;
  const { id, name, fields, stored } = value;
  const parsedStored = parseStored(stored);
  if (typeof id !== 'string' || id === '' || typeof name !== 'string') return null;
  if (!isRecord(fields) || parsedStored === null) return null;
  return { id, name, fields, stored: parsedStored };
}

/** Null when the value is not a usable list: none, or not one vehicle the
 * active id names. */
export function parseVehicleList(value: unknown): VehicleList | null {
  if (!isRecord(value) || !Array.isArray(value.vehicles)) return null;
  const vehicles = value.vehicles.map(parseVehicle);
  if (vehicles.length === 0 || vehicles.some((vehicle) => vehicle === null)) return null;
  const ids = new Set(vehicles.map((vehicle) => vehicle!.id));
  if (ids.size !== vehicles.length || !ids.has(value.activeId as string)) return null;
  return { activeId: value.activeId as string, vehicles: vehicles as Vehicle[] };
}
