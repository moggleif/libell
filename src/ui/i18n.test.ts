import { describe, expect, it } from 'vitest';
import { MESSAGES, resolveLanguage } from './i18n';

describe('i18n dictionaries', () => {
  it('sv and en cover exactly the same keys', () => {
    expect(Object.keys(MESSAGES.sv).sort()).toEqual(Object.keys(MESSAGES.en).sort());
  });

  it('no message is empty', () => {
    for (const lang of ['en', 'sv'] as const) {
      for (const [key, text] of Object.entries(MESSAGES[lang])) {
        expect(text.length, `${lang}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('lists each screen indicator on its own line (#95)', () => {
    // The four wheel states of R5; the gray glyph is an en dash, distinct
    // from the em dash used inside the sentences.
    const glyphs = ['✓', '↑', '✕', '–'];
    for (const lang of ['en', 'sv'] as const) {
      const lines = MESSAGES[lang]['help.screen.t'].split('\n');
      const glyphLines = lines.filter((line) => glyphs.some((g) => line.includes(g)));
      // One line each — never a running paragraph.
      expect(glyphLines.length, `${lang}: one line per indicator`).toBe(glyphs.length);
      for (const glyph of glyphs) {
        expect(
          lines.filter((line) => line.includes(glyph)).length,
          `${lang}: exactly one line for ${glyph}`,
        ).toBe(1);
      }
    }
  });

  it('validates a stored language override', () => {
    expect(resolveLanguage('sv')).toBe('sv');
    expect(resolveLanguage('en')).toBe('en');
    // Corrupt values fall back to auto-detection (en in Node).
    expect(['sv', 'en']).toContain(resolveLanguage('de'));
    expect(['sv', 'en']).toContain(resolveLanguage(null));
  });
});
