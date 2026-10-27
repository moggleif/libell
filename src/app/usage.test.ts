/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COUNTER_ORIGIN } from '../domain/usage';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { SITE_ORIGIN } from '../domain/site';
import {
  countAppStart,
  countFeature,
  countSensor,
  createUsageCounter,
  browserUsageDeps,
  refusesTracking,
  startUsageCounting,
  type UsageDeps,
} from './usage';

function fakeDeps(allowed = true) {
  const sent: string[] = [];
  const deps: UsageDeps & { on: boolean } = {
    on: allowed,
    allowed: () => deps.on,
    send: (url) => void sent.push(new URL(url).searchParams.get('p') ?? ''),
  };
  return { deps, sent };
}

afterEach(() => startUsageCounting({ allowed: () => false, send: () => {} }));

describe('createUsageCounter (#674)', () => {
  it('sends each path at most once per app start', () => {
    const { deps, sent } = fakeDeps();
    const count = createUsageCounter(deps);
    count('feature/target');
    count('feature/target');
    expect(sent).toEqual(['feature/target']);
  });

  it('sends nothing while counting is not allowed, and never retries', () => {
    const { deps, sent } = fakeDeps(false);
    const count = createUsageCounter(deps);
    count('open');
    deps.on = true;
    count('feature/sound');
    expect(sent).toEqual(['feature/sound']);
  });

  it('never lets a failing send reach the app', () => {
    const count = createUsageCounter({
      allowed: () => true,
      send: () => {
        throw new Error('offline');
      },
    });
    expect(() => count('open')).not.toThrow();
  });
});

describe('refusesTracking', () => {
  it('treats Global Privacy Control and Do Not Track as off', () => {
    expect(refusesTracking({ globalPrivacyControl: true })).toBe(true);
    expect(refusesTracking({ doNotTrack: '1' })).toBe(true);
    expect(refusesTracking({ doNotTrack: '0' })).toBe(false);
    expect(refusesTracking({})).toBe(false);
  });
});

describe('the app-wide counter', () => {
  it('counts the start: open, version, language, sensor and the guidance in use', () => {
    const { deps, sent } = fakeDeps();
    startUsageCounting(deps);
    countAppStart({
      version: '1.5.0',
      language: 'sv',
      settings: {
        ...DEFAULT_SETTINGS,
        sensorSource: 'xparkle',
        soundGuidance: true,
        soundSpeech: true,
      },
    });
    expect(sent).toEqual([
      'open',
      'version/1.5.0',
      'language/sv',
      'sensor/xparkle-rvs01',
      'feature/sound-guidance',
      'feature/speech',
    ]);
  });

  it('leaves out guidance that is off, and the default chime', () => {
    const { deps, sent } = fakeDeps();
    startUsageCounting(deps);
    countAppStart({
      version: null,
      language: 'en',
      settings: {
        ...DEFAULT_SETTINGS,
        soundOnLevel: true,
        soundGuidance: false,
        soundSpeech: false,
      },
    });
    expect(sent).not.toContain('feature/sound-guidance');
    expect(sent).not.toContain('feature/speech');
  });

  it('counts features and a sensor picked later', () => {
    const { deps, sent } = fakeDeps();
    startUsageCounting(deps);
    countFeature('zero-vehicle');
    countSensor('easylevel');
    expect(sent).toEqual(['feature/zero-vehicle', 'sensor/easylevel']);
  });

  it('sends nothing before it is started', () => {
    expect(() => countFeature('feedback')).not.toThrow();
  });
});

describe('the CSP (#674)', () => {
  it('adds only the counter’s origin to connect-src', () => {
    const config = readFileSync(join(import.meta.dirname, '../../vite.config.ts'), 'utf8');
    const connect = /connect-src ([^;]*);/.exec(config)?.[1];
    expect(connect).toBe(`'self' ${COUNTER_ORIGIN}`);
    expect(/script-src ([^;]*);/.exec(config)?.[1]).toBe(`'self'`);
  });

  // A meta CSP cannot carry it, and Chrome logs it as an error; the framing
  // guard covers clickjacking (ADR 0005, #730).
  it('leaves out frame-ancestors', () => {
    const config = readFileSync(join(import.meta.dirname, '../../vite.config.ts'), 'utf8');
    expect(config).not.toContain("frame-ancestors 'none'");
  });
});

interface BrowserState {
  origin: string;
  onLine: boolean;
  globalPrivacyControl?: boolean;
  doNotTrack?: string;
  counting: string | null;
}

const REAL_APP: BrowserState = { origin: SITE_ORIGIN, onLine: true, counting: 'on' };

function useBrowser(state: BrowserState): void {
  const { origin, counting, ...nav } = state;
  vi.stubGlobal('location', { origin });
  vi.stubGlobal('navigator', nav);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key === 'libell.counting' ? counting : null),
    setItem: () => {},
    removeItem: () => {},
  });
}

describe('browserUsageDeps (#713)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('allows counting in the real app on libell.app with counting on', () => {
    useBrowser(REAL_APP);
    expect(browserUsageDeps(false).allowed()).toBe(true);
  });

  it('never counts in ?demo', () => {
    useBrowser(REAL_APP);
    expect(browserUsageDeps(true).allowed()).toBe(false);
  });

  it.each([
    ['another origin', { origin: 'http://localhost:5173' }],
    ['offline', { onLine: false }],
    ['Global Privacy Control', { globalPrivacyControl: true }],
    ['Do Not Track', { doNotTrack: '1' }],
    ['a stored "off"', { counting: 'off' }],
    ['no stored choice', { counting: null }],
  ] as const)('never counts with %s', (_, change) => {
    useBrowser({ ...REAL_APP, ...change });
    expect(browserUsageDeps(false).allowed()).toBe(false);
  });

  it('asks again on every send, so switching off takes effect at once', () => {
    useBrowser(REAL_APP);
    const deps = browserUsageDeps(false);
    useBrowser({ ...REAL_APP, counting: 'off' });
    expect(deps.allowed()).toBe(false);
  });

  it('sends without cookies, cache or referrer, and outlives the page', () => {
    const fetch = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('fetch', fetch);
    browserUsageDeps(false).send('https://libell.goatcounter.com/count?p=open');
    expect(fetch).toHaveBeenCalledWith('https://libell.goatcounter.com/count?p=open', {
      mode: 'no-cors',
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
      referrerPolicy: 'no-referrer',
    });
  });

  // An unhandled rejection would fail the test run, so settling is the check.
  it('swallows a failed send', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    expect(() => browserUsageDeps(false).send('https://libell.goatcounter.com/')).not.toThrow();
    await new Promise((settle) => setTimeout(settle, 0));
  });
});
