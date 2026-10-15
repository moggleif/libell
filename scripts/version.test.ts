import { describe, expect, it } from 'vitest';
import { deployVersion, localVersion, prNumberFrom, releaseOf } from './version.ts';

describe('releaseOf (#611)', () => {
  it('reads a two-part VERSION as that minor’s .0 release', () => {
    expect(releaseOf('1.3')).toBe('1.3.0');
  });

  it('reads a three-part VERSION as that patch release', () => {
    expect(releaseOf('1.3.1')).toBe('1.3.1');
  });

  it('ignores surrounding whitespace and the trailing newline', () => {
    expect(releaseOf(' 1.3.1\n')).toBe('1.3.1');
  });
});

describe('deployVersion (ADR 0007, #611)', () => {
  it('makes the first deploy of a minor the X.Y.0 release', () => {
    expect(deployVersion('1.4', ['v1.3.0', 'v1.3.0-CR610'], '612')).toEqual({
      versionString: '1.4.0',
      tagName: 'v1.4.0',
      isRelease: true,
    });
  });

  it('makes a later merge on a two-part VERSION an X.Y.0 candidate', () => {
    expect(deployVersion('1.3', ['v1.3.0', 'v1.3.0-CR610'], '612')).toEqual({
      versionString: '1.3.0 – CR612',
      tagName: 'v1.3.0-CR612',
      isRelease: false,
    });
  });

  it('makes the first deploy of a patch version that patch release', () => {
    expect(deployVersion('1.3.1', ['v1.3.0', 'v1.3.0-CR610'], '612')).toEqual({
      versionString: '1.3.1',
      tagName: 'v1.3.1',
      isRelease: true,
    });
  });

  it('makes a later merge on a patch version a candidate built on it', () => {
    expect(deployVersion('1.3.1', ['v1.3.0', 'v1.3.1'], '613')).toEqual({
      versionString: '1.3.1 – CR613',
      tagName: 'v1.3.1-CR613',
      isRelease: false,
    });
  });

  it('treats a candidate tag of the version as already released', () => {
    expect(deployVersion('1.3.1', ['v1.3.1-CR613'], '614').isRelease).toBe(false);
  });

  it('is not fooled by a longer version sharing the prefix', () => {
    expect(deployVersion('1.3.1', ['v1.3.10', 'v1.3.10-CR700'], '701').isRelease).toBe(true);
  });
});

describe('prNumberFrom', () => {
  it('takes the PR number from a merge commit subject', () => {
    expect(prNumberFrom('Merge pull request #612 from moggleif/claude/x', '99')).toBe('612');
  });

  it('takes the first number from a squash subject', () => {
    expect(prNumberFrom('Release 1.3.1 (#611) (#612)', '99')).toBe('611');
  });

  it('falls back to the run number when the subject has none', () => {
    expect(prNumberFrom('Direct push to main', '99')).toBe('99');
  });
});

describe('localVersion (#611)', () => {
  it('keeps the X.Y.Z shape for a two-part VERSION', () => {
    expect(localVersion('1.3', '2026-10-15 14:30')).toBe('1.3.0 – local 2026-10-15 14:30');
  });

  it('does not add a fourth part to a patch VERSION', () => {
    expect(localVersion('1.3.1', '2026-10-15 14:30')).toBe('1.3.1 – local 2026-10-15 14:30');
  });
});
