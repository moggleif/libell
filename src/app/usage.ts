/**
 * Anonymous counting (#674, ADR 0021): one GoatCounter event per name and
 * app start, sent best-effort and forgotten. Held in memory only; the one
 * stored thing is the user's off switch (`countingStore.ts`).
 *
 * App-wide like `t()`: `main.ts` starts it, and a feature only says
 * `countFeature('…')`.
 */
import type { LevelSettings, SensorSource } from '../domain/settings';
import {
  countUrl,
  featurePath,
  languagePath,
  OPEN_PATH,
  sensorPath,
  versionPath,
  type FeatureEvent,
} from '../domain/usage';
import { isCountingOn } from '../data/countingStore';

export interface UsageDeps {
  /** Asked on every send, so switching off takes effect at once. */
  allowed(): boolean;
  send(url: string): void;
}

/** Only the real app counts: not dev, not a preview, not `?demo`. */
const COUNTED_HOST = 'libell.app';

let count: (path: string) => void = () => {};

export function createUsageCounter(deps: UsageDeps): (path: string) => void {
  const sent = new Set<string>();
  return (path) => {
    if (sent.has(path) || !deps.allowed()) return;
    sent.add(path);
    try {
      deps.send(countUrl(path));
    } catch {
      // Counting never breaks the app, and nothing is retried.
    }
  };
}

export function refusesTracking(nav: {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

export function browserUsageDeps(demo: boolean): UsageDeps {
  return {
    allowed: () =>
      !demo &&
      location.hostname === COUNTED_HOST &&
      navigator.onLine &&
      !refusesTracking(navigator as Navigator & { globalPrivacyControl?: boolean }) &&
      isCountingOn(),
    send: (url) =>
      void fetch(url, {
        mode: 'no-cors',
        credentials: 'omit',
        cache: 'no-store',
        keepalive: true,
        referrerPolicy: 'no-referrer',
      }).catch(() => {}),
  };
}

export function startUsageCounting(deps: UsageDeps): void {
  count = createUsageCounter(deps);
}

export function countFeature(name: FeatureEvent): void {
  count(featurePath(name));
}

export function countSensor(source: SensorSource): void {
  count(sensorPath(source));
}

export interface AppStart {
  version: string | null;
  language: string;
  settings: LevelSettings;
}

/** The app opened: its version and language, the chosen sensor, and the
 * opt-in guidance switched on. The level chime is on by default, so it
 * would tell nothing. */
export function countAppStart(start: AppStart): void {
  count(OPEN_PATH);
  count(versionPath(start.version));
  count(languagePath(start.language));
  countSensor(start.settings.sensorSource);
  if (start.settings.soundGuidance) countFeature('sound-guidance');
  if (start.settings.soundSpeech) countFeature('speech');
}
