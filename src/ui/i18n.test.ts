import { describe, expect, it } from 'vitest';
import { LANGUAGE_NAMES, LANGUAGES, MESSAGES, isLanguage, resolveLanguage } from './i18n';

/** Every shipped dictionary, so adding a language (#178) automatically
 * brings it under all the checks below instead of needing a new case. */
const ALL = LANGUAGES;

describe('i18n dictionaries', () => {
  it('ships exactly the languages LANGUAGES lists', () => {
    expect([...LANGUAGES].sort()).toEqual(Object.keys(MESSAGES).sort());
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LANGUAGES].sort());
  });

  it('every language covers exactly the same keys', () => {
    const reference = Object.keys(MESSAGES.en).sort();
    for (const lang of ALL) {
      expect(Object.keys(MESSAGES[lang]).sort(), lang).toEqual(reference);
    }
  });

  it('no message is empty', () => {
    for (const lang of ALL) {
      for (const [key, text] of Object.entries(MESSAGES[lang])) {
        expect(text.length, `${lang}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  // A dropped or mistyped `{name}` silently renders the placeholder to the
  // user (or loses the value entirely) — the one translation slip `t()`
  // cannot shrug off, so it is checked rather than trusted.
  it('every translation keeps the same {placeholders} as English', () => {
    const placeholders = (text: string) => (text.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
    for (const [key, english] of Object.entries(MESSAGES.en)) {
      const expected = placeholders(english);
      for (const lang of ALL) {
        expect(
          placeholders(MESSAGES[lang][key as keyof typeof MESSAGES.en]),
          `${lang}:${key}`,
        ).toEqual(expected);
      }
    }
  });

  it('lists each screen indicator on its own line (#95)', () => {
    // The four wheel states of R5; the gray glyph is an en dash, distinct
    // from the em dash used inside the sentences.
    const glyphs = ['✓', '↑', '✕', '–'];
    for (const lang of ALL) {
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
    for (const lang of ALL) {
      expect(resolveLanguage(lang)).toBe(lang);
      expect(isLanguage(lang)).toBe(true);
    }
    // Corrupt values fall back to auto-detection (en in Node).
    expect(isLanguage('xx')).toBe(false);
    expect([...ALL]).toContain(resolveLanguage('xx'));
    expect([...ALL]).toContain(resolveLanguage(null));
  });
});
