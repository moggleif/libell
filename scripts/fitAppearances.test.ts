import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APPEARANCES } from '../src/domain/appearance.ts';
import { selectAppearances } from './fitAppearances.ts';

describe('selectAppearances (#494)', () => {
  it('walks every appearance when none is named', () => {
    expect(selectAppearances(APPEARANCES, undefined)).toEqual([...APPEARANCES]);
    expect(selectAppearances(APPEARANCES, '')).toEqual([...APPEARANCES]);
  });

  it('walks only the appearance named', () => {
    for (const appearance of APPEARANCES) {
      expect(selectAppearances(APPEARANCES, appearance)).toEqual([appearance]);
    }
  });

  it('refuses a name that is not an appearance, rather than checking nothing', () => {
    expect(() => selectAppearances(APPEARANCES, 'glosy')).toThrow(/glosy/);
  });
});

describe('the CI fit job (#494)', () => {
  it('is a matrix over exactly the appearances the app offers', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    const matrix = /^\s+appearance: \[([^\]]*)\]/m.exec(workflow);
    expect(matrix, 'no `appearance: [...]` matrix in ci.yml').not.toBeNull();
    const inCi = matrix![1].split(',').map((name) => name.trim());
    expect(inCi.sort()).toEqual([...APPEARANCES].sort());
  });
});
