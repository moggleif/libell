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

  it('validates a stored language override', () => {
    expect(resolveLanguage('sv')).toBe('sv');
    expect(resolveLanguage('en')).toBe('en');
    // Corrupt values fall back to auto-detection (en in Node).
    expect(['sv', 'en']).toContain(resolveLanguage('de'));
    expect(['sv', 'en']).toContain(resolveLanguage(null));
  });
});
