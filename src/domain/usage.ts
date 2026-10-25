/**
 * What Libell's anonymous counting may send (#674, ADR 0021): a fixed set of
 * names, one GoatCounter event each. Nothing here can carry a value about the
 * user or the phone: no country, screen, device, OS, firmware or identifier.
 */
import type { SensorSource } from './settings';

/** The counter's own origin, the one `connect-src` allows (vite.config.ts). */
export const COUNTER_ORIGIN = 'https://libell.goatcounter.com';

export const OPEN_PATH = 'open';

export const FEATURE_EVENTS = [
  'zero-vehicle',
  'calibrate-phone',
  'target',
  'hitch-height',
  'switch-vehicle',
  'share-created',
  'share-received',
  'sound-guidance',
  'speech',
  'guide-done',
  'feedback',
] as const;

export type FeatureEvent = (typeof FEATURE_EVENTS)[number];

// The model, never a firmware version or a device id.
const SENSOR_MODELS: Record<SensorSource, string> = {
  phone: 'phone',
  xparkle: 'xparkle-rvs01',
  easylevel: 'easylevel',
};

export function featurePath(name: FeatureEvent): string {
  return `feature/${name}`;
}

export function sensorPath(source: SensorSource): string {
  return `sensor/${SENSOR_MODELS[source]}`;
}

/** "1.5.0 – CR700" becomes "1.5.0-CR700"; anything but letters, digits and
 * dots is dropped. */
export function versionPath(version: string | null): string {
  const kept = (version ?? '').replace(/[^0-9A-Za-z.]+/g, '-').replace(/^-|-$/g, '');
  return `version/${kept || 'unknown'}`;
}

/** The language chosen in Libell, never the phone's. */
export function languagePath(language: string): string {
  return `language/${/^[a-z]{2}$/.test(language) ? language : 'other'}`;
}

/** GoatCounter's count endpoint, as an event, with the path and nothing else. */
export function countUrl(path: string): string {
  return `${COUNTER_ORIGIN}/count?p=${encodeURIComponent(path)}&e=true`;
}
