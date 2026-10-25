/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { COUNTER_ORIGIN } from '../domain/usage';
import { DEFAULT_SETTINGS } from '../domain/settings';
import {
  countAppStart,
  countFeature,
  countSensor,
  createUsageCounter,
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
});
