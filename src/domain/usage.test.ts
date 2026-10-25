import { describe, expect, it } from 'vitest';
import {
  COUNTER_ORIGIN,
  FEATURE_EVENTS,
  countUrl,
  featurePath,
  languagePath,
  OPEN_PATH,
  sensorPath,
  versionPath,
} from './usage';

describe('usage paths (#674): only names, never a value about the user', () => {
  it('names each sensor by its model only', () => {
    expect(sensorPath('phone')).toBe('sensor/phone');
    expect(sensorPath('xparkle')).toBe('sensor/xparkle-rvs01');
    expect(sensorPath('easylevel')).toBe('sensor/easylevel');
  });

  it('gives every feature its own fixed path', () => {
    const paths = FEATURE_EVENTS.map(featurePath);
    expect(new Set(paths).size).toBe(FEATURE_EVENTS.length);
    for (const path of paths) expect(path).toMatch(/^feature\/[a-z-]+$/);
  });

  it('keeps the app version to letters, digits and dots', () => {
    expect(versionPath('1.5.0')).toBe('version/1.5.0');
    expect(versionPath('1.5.0 – CR700')).toBe('version/1.5.0-CR700');
    expect(versionPath(null)).toBe('version/unknown');
  });

  it('passes a two-letter app language and nothing else', () => {
    expect(languagePath('sv')).toBe('language/sv');
    expect(languagePath('sv-SE; <script>')).toBe('language/other');
  });

  it('opens with a fixed path', () => {
    expect(OPEN_PATH).toBe('open');
  });
});

describe('countUrl', () => {
  it('is an event on the counter with the path and nothing else', () => {
    const url = new URL(countUrl('feature/zero-vehicle'));
    expect(url.origin).toBe(COUNTER_ORIGIN);
    expect(url.pathname).toBe('/count');
    expect([...url.searchParams.keys()].sort()).toEqual(['e', 'p']);
    expect(url.searchParams.get('p')).toBe('feature/zero-vehicle');
    expect(url.searchParams.get('e')).toBe('true');
  });
});
