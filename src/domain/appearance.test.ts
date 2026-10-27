import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPEARANCES, isAppearance } from './appearance';
import { parseSettings } from './settingsParsing';

describe('APPEARANCES', () => {
  it('lists every appearance the settings accept, Glossy included', () => {
    expect(APPEARANCES).toEqual(['classic', 'modern', 'glossy']);
    for (const appearance of APPEARANCES) {
      expect(parseSettings({ appearance }).appearance).toBe(appearance);
    }
  });

  it('recognises only the listed appearances', () => {
    for (const appearance of APPEARANCES) expect(isAppearance(appearance)).toBe(true);
    expect(isAppearance('neon')).toBe(false);
    expect(isAppearance(undefined)).toBe(false);
  });

  // #403: the fit check hardcoded ['classic', 'modern'], so Glossy's own
  // gradients, bevels and shadows were never checked for overflow. It has
  // to walk this list, not a copy of it.
  it('is the list the fit check walks', () => {
    const script = readFileSync(resolve(__dirname, '../../scripts/fit/config.mjs'), 'utf8');
    expect(script).toMatch(
      /import \{ APPEARANCES \} from '\.\.\/\.\.\/src\/domain\/appearance\.ts';/,
    );
    expect(script).not.toMatch(/const APPEARANCES\s*=/);
  });
});
