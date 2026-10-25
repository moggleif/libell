import { describe, expect, it } from 'vitest';
import { toBasePath } from './basePath.ts';

describe('toBasePath (#672)', () => {
  it('serves from the root when nothing is set', () => {
    expect(toBasePath(undefined)).toBe('/');
  });

  it('serves from the root for the empty base path of a custom domain', () => {
    expect(toBasePath('')).toBe('/');
  });

  it('adds the trailing slash to a project-site base path', () => {
    expect(toBasePath('/libell')).toBe('/libell/');
  });

  it('keeps a base path that already ends in a slash', () => {
    expect(toBasePath('/libell/')).toBe('/libell/');
  });

  it('adds the leading slash', () => {
    expect(toBasePath('libell')).toBe('/libell/');
  });

  it('ignores surrounding whitespace', () => {
    expect(toBasePath(' /libell \n')).toBe('/libell/');
  });
});
