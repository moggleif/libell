// Contrast of the colour pairs the accessibility review measured (#536),
// computed from the custom properties in styles.css for each of the four
// palettes: text at least 4.5:1 (WCAG 1.4.3), borders and markers at least
// 3:1 (WCAG 1.4.11).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

/** The custom properties declared in the first rule whose selector line is
 * exactly `selector {` (at any indentation). */
function tokens(selector: string): Record<string, string> {
  const lines = css.split('\n');
  const start = lines.findIndex((line) => line.trim() === `${selector} {`);
  if (start < 0) throw new Error(`no rule ${selector}`);
  const found: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '}') break;
    const match = /^\s*(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/i.exec(line);
    if (match) found[match[1]!] = match[2]!;
  }
  return found;
}

const classicDark = { ...tokens(':root'), ...tokens(":root[data-theme='dark']") };
const classicLight = { ...tokens(':root'), ...tokens(":root[data-theme='light']") };
const PALETTES = {
  'classic dark': classicDark,
  'classic light': classicLight,
  'modern dark': {
    ...classicDark,
    ...tokens(":root[data-appearance='modern'][data-theme='dark']"),
  },
  'modern light': {
    ...classicLight,
    ...tokens(":root[data-appearance='modern'][data-theme='light']"),
  },
};

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

/** [what, foreground token, background token, minimum]. */
const PAIRS: Array<[string, string, string, number]> = [
  ['"No ramp" on a wheel card', '--lift-unserved', '--surface-raised', TEXT],
  ['the glyph on a "no ramp" marker', '--surface', '--lift-unserved', UI],
  ['a form field’s border on the field', '--field-border', '--surface', UI],
  ['a form field’s border on a page', '--field-border', '--surface-raised', UI],
  ['a pending calibration pill', '--warning', '--surface-raised', TEXT],
  ['a done calibration pill', '--level', '--surface-raised', TEXT],
  ['a plain calibration pill', '--on-surface-muted', '--surface-raised', TEXT],
  ['a primary button’s label (#730)', '--surface', '--level', TEXT],
];

describe('colour contrast in every palette (#536)', () => {
  for (const [palette, colours] of Object.entries(PALETTES)) {
    for (const [what, fg, bg, minimum] of PAIRS) {
      it(`${palette}: ${what} is at least ${minimum}:1`, () => {
        expect(colours[fg], `${fg} in ${palette}`).toBeDefined();
        expect(contrast(colours[fg]!, colours[bg]!)).toBeGreaterThanOrEqual(minimum);
      });
    }
  }
});

describe('the system-theme rules match the explicit ones', () => {
  it('declares the same light tokens when the phone picks light as when Settings does', () => {
    const lines = css.split('\n');
    const media = lines.findIndex((l) => l.startsWith('@media (prefers-color-scheme: light)'));
    const block: Record<string, string> = {};
    for (const line of lines.slice(media + 2)) {
      if (line.trim() === '}') break;
      const match = /^\s*(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/i.exec(line);
      if (match) block[match[1]!] = match[2]!;
    }
    expect(block).toEqual(tokens(":root[data-theme='light']"));
  });
});
