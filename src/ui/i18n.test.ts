import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  LANGUAGE_NAMES,
  LANGUAGES,
  MESSAGES,
  getLanguage,
  isLanguage,
  resolveLanguage,
  setLanguage,
  t,
  type Language,
  type MessageKey,
} from './i18n';
import { EXTERNAL_SENSORS } from '../sensor/boxes';

/** Every shipped dictionary, so adding a language (#178) automatically
 * brings it under all the checks below instead of needing a new case. */
const ALL = LANGUAGES;

describe('i18n dictionaries', () => {
  it('ships exactly the languages LANGUAGES lists', () => {
    expect([...LANGUAGES].sort()).toEqual(Object.keys(MESSAGES).sort());
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LANGUAGES].sort());
  });

  // The picker shows this order verbatim, so it is asserted here rather
  // than left to whatever order the dictionaries happen to be declared in.
  it('lists the languages alphabetically by the name each is shown under', () => {
    const names = LANGUAGES.map((lang) => LANGUAGE_NAMES[lang]);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    expect(names).toEqual([
      'Dansk',
      'Deutsch',
      'English',
      'Español',
      'Français',
      'Italiano',
      'Nederlands',
      'Polski',
      'Português',
      'Svenska',
    ]);
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

  it('names the calibrate and zero buttons as they read on screen (#578)', () => {
    for (const lang of ALL) {
      const text = MESSAGES[lang]['help.calibration.t'];
      expect(text, `${lang}: calibrate button`).toContain(MESSAGES[lang]['calibration.now']);
      expect(text, `${lang}: zero button`).toContain(MESSAGES[lang]['calibration.vehicle.now']);
    }
  });

  it('quotes the waiting and access-denied messages in the trouble help (#580)', () => {
    for (const lang of ALL) {
      const text = MESSAGES[lang]['help.trouble.t'];
      expect(text, `${lang}: waiting`).toContain(MESSAGES[lang]['main.waiting']);
      const denied = MESSAGES[lang]['main.denied'].split(',')[0]!;
      expect(text, `${lang}: denied`).toContain(denied);
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

describe('product names never live in a catalogue (#267)', () => {
  it('ships no external sensor’s brand inside a translated string', () => {
    // A brand is identical in every language, so translating it is a bug —
    // and duplicating a whole string set per device is how five-language
    // edits multiply. The name is substituted from the registry
    // descriptor instead.
    for (const sensor of EXTERNAL_SENSORS) {
      for (const lang of ALL) {
        for (const [key, value] of Object.entries(MESSAGES[lang])) {
          expect(value, `${lang}:${key} must not name ${sensor.displayName}`).not.toContain(
            sensor.displayName,
          );
        }
      }
    }
  });

  it('leaves no {name} placeholder unfilled in the strings that carry one', () => {
    // A placeholder that reaches the screen looks like a bug to the user,
    // so every string that has one must be called with it.
    const withPlaceholder = Object.entries(MESSAGES.en)
      .filter(([, value]) => value.includes('{name}'))
      .map(([key]) => key);
    expect(withPlaceholder.length).toBeGreaterThan(0);
    for (const key of withPlaceholder) {
      for (const lang of ALL) {
        expect(MESSAGES[lang][key as keyof (typeof MESSAGES)[typeof lang]]).toContain('{name}');
      }
    }
  });
});

// Terminology, round two (#366): one word per thing, in every language.
describe('i18n terminology (#366)', () => {
  it('Swedish says kloss, never ramp, in every user-facing string', () => {
    for (const [key, text] of Object.entries(MESSAGES.sv)) {
      expect(text, `sv:${key}`).not.toMatch(/ramp/i);
    }
  });

  it('every zero action has one heading per language, phone and box alike', () => {
    for (const lang of ALL) {
      const heading = MESSAGES[lang]['calibration.vehicle.h'];
      expect(MESSAGES[lang]['calibration.external.h'], lang).toBe(heading);
      expect(MESSAGES[lang]['box.step.zero.todo'], lang).toBe(heading);
    }
  });

  it('names the box and its lost contact the same way everywhere', () => {
    for (const lang of ALL) {
      const box = MESSAGES[lang]['help.sensor.h'];
      expect(MESSAGES[lang]['menu.sensorSource'], lang).toBe(box);
      expect(MESSAGES[lang]['sensorList.title'], lang).toBe(box);
      for (const key of [
        'sensorStatus.connected',
        'sensorStatus.disconnected',
        'sensorStatus.idle',
        'sensorStatus.idle.guide',
      ] as const) {
        expect(MESSAGES[lang][key], `${lang}:${key}`).toContain(box);
      }
      expect(MESSAGES[lang]['sensorStatus.disconnected'].toLowerCase(), lang).toContain(
        MESSAGES[lang]['box.state.lost'].toLowerCase(),
      );
    }
  });

  it('names the tab that holds calibration and zero as Help names the topic (#516)', () => {
    for (const lang of ALL) {
      const tab = MESSAGES[lang]['menu.calibration'];
      expect(tab, lang).toBe(MESSAGES[lang]['help.calibration.h']);
      expect(MESSAGES[lang]['lamp.calibrate.title'], lang).toContain(tab);
      expect(MESSAGES[lang]['lamp.zero.title'], lang).toContain(tab);
    }
  });

  it('the setup lamp names the measurements, as the help heading does', () => {
    const word: Record<string, string> = {
      en: 'Measurements',
      sv: 'Mått',
      fr: 'Mesures',
      es: 'Medidas',
      de: 'Maße',
      nl: 'Maten',
      it: 'Misure',
      pl: 'Wymiary',
      pt: 'Medidas',
      da: 'Dimensioner',
    };
    for (const lang of ALL) {
      expect(MESSAGES[lang]['lamp.setup'], lang).toBe(`⚠ ${word[lang]}`);
    }
  });

  it('the box-path wizard points at the zero lamp by its name, not its colour', () => {
    for (const lang of ALL) {
      expect(MESSAGES[lang]['onboard.boxPosition.later'], lang).toContain(
        MESSAGES[lang]['lamp.zero'],
      );
    }
  });

  it('About and the welcome step no longer say "no spirit level"', () => {
    const spiritLevel = /vattenpass|spirit level|bubble|niveau à bulle|burbuja|Libelle,/i;
    for (const lang of ALL) {
      expect(MESSAGES[lang]['about.text'], lang).not.toMatch(spiritLevel);
    }
  });

  it('the level overlay and the start hint do not call a caravan a motorhome', () => {
    for (const lang of ALL) {
      for (const key of ['main.level', 'main.hint'] as const) {
        expect(MESSAGES[lang][key], `${lang}:${key}`).not.toContain(
          MESSAGES[lang]['vehicle.motorhome'].toLowerCase(),
        );
        expect(MESSAGES[lang][key], `${lang}:${key}`).not.toContain(
          MESSAGES[lang]['vehicle.motorhome'],
        );
      }
    }
  });
});

// The public interface every component relies on (#377), pinned so the
// dictionaries can move into one module per language without it changing.
describe('i18n public interface (#377)', () => {
  afterEach(() => {
    setLanguage('en');
    vi.unstubAllGlobals();
  });

  it('types Language as the shipped languages', () => {
    expectTypeOf<Language>().toEqualTypeOf<
      'sv' | 'en' | 'fr' | 'es' | 'de' | 'nl' | 'it' | 'pl' | 'pt' | 'da'
    >();
  });

  it('types MessageKey as exactly the English keys', () => {
    expectTypeOf<MessageKey>().toEqualTypeOf<keyof (typeof MESSAGES)['en']>();
    expectTypeOf<'menu.title'>().toMatchTypeOf<MessageKey>();
    expectTypeOf<'no.such.key'>().not.toMatchTypeOf<MessageKey>();
  });

  it('looks a key up in the current language', () => {
    setLanguage('en');
    expect(t('menu.title')).toBe('Menu');
    for (const lang of ALL) {
      setLanguage(lang);
      expect(getLanguage()).toBe(lang);
      expect(t('menu.title'), lang).toBe(MESSAGES[lang]['menu.title']);
    }
  });

  it('substitutes every {placeholder} from vars, numbers included', () => {
    setLanguage('en');
    const key = 'onboard.boxPosition.notConnected';
    expect(MESSAGES.en[key]).toContain('{next}');
    const text = t(key, { next: 'Next' });
    expect(text).not.toContain('{next}');
    expect(text).toBe(MESSAGES.en[key].replaceAll('{next}', 'Next'));
    expect(t(key, { next: 7 })).toBe(MESSAGES.en[key].replaceAll('{next}', '7'));
  });

  it('leaves the text untouched without vars, and ignores vars it has no slot for', () => {
    setLanguage('en');
    const key = 'onboard.boxPosition.notConnected';
    expect(t(key)).toBe(MESSAGES.en[key]);
    expect(t('menu.title', { unused: 'x' })).toBe('Menu');
  });

  it('detects the language from the locale subtag, falling back to English', () => {
    const detect = (language: string | undefined) => {
      vi.stubGlobal('navigator', { language });
      return resolveLanguage(null);
    };
    expect(detect('de-AT')).toBe('de');
    expect(detect('DE')).toBe('de');
    expect(detect('sv-SE')).toBe('sv');
    expect(detect('fr')).toBe('fr');
    expect(detect('es-MX')).toBe('es');
    expect(detect('en-GB')).toBe('en');
    expect(detect('nb-NO')).toBe('en');
    expect(detect(undefined)).toBe('en');
  });

  it('prefers a valid stored language over the detected one', () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(resolveLanguage('sv')).toBe('sv');
    expect(resolveLanguage('xx')).toBe('de');
    expect(resolveLanguage(42)).toBe('de');
  });
});
