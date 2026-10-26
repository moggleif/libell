import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../i18n';
import { MESSAGES } from '../translations';
import { CONTEXT } from './context';
import { GLOSSARY } from './glossary';

// #628: what a translator needs besides the English words.
describe('translation context', () => {
  it('describes every message, and only messages that exist', () => {
    expect(Object.keys(CONTEXT).sort()).toEqual(Object.keys(MESSAGES.en).sort());
  });

  it('says where each message appears and what it does', () => {
    for (const [key, entry] of Object.entries(CONTEXT)) {
      expect(entry.where.length, key).toBeGreaterThan(10);
      expect(entry.does.length, key).toBeGreaterThan(10);
    }
  });
});

describe('locked glossary', () => {
  it('has a lower-case word for every term in every language', () => {
    for (const term of GLOSSARY) {
      for (const lang of LANGUAGES) {
        const word = term.words[lang];
        expect(word, `${term.term}/${lang}`).toBe(word.toLowerCase());
        expect(word.length, `${term.term}/${lang}`).toBeGreaterThan(1);
      }
    }
  });

  it("uses each language's locked word in the strings the term anchors", () => {
    for (const term of GLOSSARY) {
      for (const key of term.anchors) {
        for (const lang of LANGUAGES) {
          const text = MESSAGES[lang][key].toLowerCase();
          expect(text, `${term.term} in ${lang}:${key}`).toContain(term.words[lang]);
        }
      }
    }
  });

  it('never uses a word a language has ruled out for a term', () => {
    for (const term of GLOSSARY) {
      for (const [lang, banned] of Object.entries(term.never ?? {})) {
        const dictionary = MESSAGES[lang as keyof typeof MESSAGES];
        for (const [key, text] of Object.entries(dictionary)) {
          for (const word of banned) {
            expect(text.toLowerCase(), `${term.term}: ${lang}:${key}`).not.toContain(word);
          }
        }
      }
    }
  });
});
