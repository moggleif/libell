/**
 * What Libell has stored, in plain words (#678): one row per thing the user
 * would recognise, never a raw key. The box password is never in a row.
 */
import { MASK, type StoredEntry } from '../data/storedData';
import { formatLength } from '../domain/lengths';
import type { SensorSource } from '../domain/settings';
import { parseSettings } from '../domain/settingsParsing';
import { parseTargetPresets } from '../domain/targetPresets';
import { parseVehicleList } from '../domain/vehicles';
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { getLanguage, isLanguage, LANGUAGE_NAMES, t, type MessageKey } from './i18n';
import { vehicleName } from './vehiclePicker';

export interface StoredRow {
  label: string;
  detail: string;
}

function parseValue(entry: StoredEntry | undefined): unknown {
  if (!entry) return undefined;
  try {
    return JSON.parse(entry.value);
  } catch {
    return undefined;
  }
}

function sourceName(source: SensorSource | undefined): string {
  return EXTERNAL_SENSORS.find((box) => box.id === source)?.displayName ?? t('stored.phone');
}

/** "saved 12 Oct 2026", or plain "saved" for a value from before
 * timestamps. */
function savedText(entry: StoredEntry): string {
  const at = (parseValue(entry) as { capturedAt?: unknown } | undefined)?.capturedAt;
  if (typeof at !== 'number' || !Number.isFinite(at) || at <= 0) return t('stored.saved');
  const date = new Date(at).toLocaleDateString(getLanguage(), { dateStyle: 'medium' });
  return t('stored.savedOn', { date });
}

/** One row per vehicle, the active one with today's measurements. A phone
 * that never added a second vehicle has only the settings to show. */
function vehicleRows(entries: StoredEntry[]): StoredRow[] {
  const settingsEntry = entries.find((entry) => entry.kind === 'settings');
  const settings = parseSettings(parseValue(settingsEntry));
  const length = (mm: unknown) =>
    typeof mm === 'number' ? formatLength(mm, settings.displayUnit) : '';
  const detail = (name: string, mm: unknown) =>
    length(mm) ? t('stored.vehicle.detail', { name, wheelbase: length(mm) }) : name;

  const list = parseVehicleList(parseValue(entries.find((entry) => entry.kind === 'vehicles')));
  if (!list) {
    if (!settingsEntry) return [];
    return [{ label: t('stored.vehicle'), detail: detail(vehicleName(''), settings.wheelbaseMm) }];
  }
  return list.vehicles.map((vehicle) => ({
    label: t('stored.vehicle'),
    detail: detail(
      vehicleName(vehicle.name),
      vehicle.id === list.activeId ? settings.wheelbaseMm : vehicle.fields.wheelbaseMm,
    ),
  }));
}

/** The settings, and the box password they hold, shown only as dots. */
function settingsRows(entry: StoredEntry): StoredRow[] {
  const rows = [{ label: t('stored.settings'), detail: t('stored.settings.detail') }];
  const devices = (parseValue(entry) as { sensorDevices?: Record<string, unknown> } | undefined)
    ?.sensorDevices;
  for (const box of EXTERNAL_SENSORS) {
    const stored = devices?.[box.id] as { password?: unknown } | undefined;
    if (typeof stored?.password === 'string') {
      rows.push({ label: t('stored.password'), detail: `${box.displayName}: ${MASK}` });
    }
  }
  return rows;
}

function targetsDetail(entries: StoredEntry[], entry: StoredEntry): string {
  const presets = parseTargetPresets(parseValue(entry));
  const active = parseValue(entries.find((item) => item.kind === 'activeTarget'));
  return presets
    .map(({ id, name }) => (id === active ? t('stored.targets.active', { name }) : name))
    .join(', ');
}

function languageDetail(value: string): string {
  return isLanguage(value) ? LANGUAGE_NAMES[value] : value;
}

/** A box's or the phone's calibration layer: whose it is, and when. */
function layerRow(label: MessageKey, entry: StoredEntry, owner: string): StoredRow {
  return { label: t(label), detail: `${owner}, ${savedText(entry)}` };
}

/** The order rows read in: what the user set up first, the app's own marks
 * last. */
const KIND_ORDER: StoredEntry['kind'][] = [
  'language',
  'phoneCalibration',
  'vehicleZero',
  'boxZero',
  'zeroTrim',
  'targets',
  'hitch',
  'rememberedBox',
];

function byKind(a: StoredEntry, b: StoredEntry): number {
  return KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
}

/** Rows for the kinds that each stand on their own. */
function entryRow(entry: StoredEntry, entries: StoredEntry[]): StoredRow | null {
  switch (entry.kind) {
    case 'language':
      return { label: t('stored.language'), detail: languageDetail(entry.value) };
    case 'phoneCalibration':
      return { label: t('stored.phoneCalibration'), detail: savedText(entry) };
    case 'vehicleZero':
      return layerRow('stored.zero', entry, t('stored.phone'));
    case 'boxZero':
      return layerRow('stored.zero', entry, sourceName(entry.source));
    case 'zeroTrim':
      return { label: t('stored.zeroTrim'), detail: sourceName(entry.source) };
    case 'targets':
      return { label: t('stored.targets'), detail: targetsDetail(entries, entry) };
    case 'hitch':
      return { label: t('stored.hitch'), detail: t('stored.saved') };
    case 'rememberedBox':
      return { label: t('stored.rememberedBox'), detail: sourceName(entry.source) };
    default:
      return null;
  }
}

/** Marks, migration flags, rollback copies and unknown keys: one row with
 * a count, since none of them means anything on its own. */
function notesRow(entries: StoredEntry[]): StoredRow[] {
  const notes = entries.filter((entry) => ['note', 'legacy', 'other'].includes(entry.kind));
  if (notes.length === 0) return [];
  return [{ label: t('stored.notes'), detail: t('stored.notes.detail', { n: notes.length }) }];
}

export function storedRows(entries: StoredEntry[]): StoredRow[] {
  const settings = entries.find((entry) => entry.kind === 'settings');
  return [
    ...vehicleRows(entries),
    ...(settings ? settingsRows(settings) : []),
    ...[...entries].sort(byKind).flatMap((entry) => entryRow(entry, entries) ?? []),
    ...notesRow(entries),
  ];
}
