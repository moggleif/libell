/** Lengths as the user types and reads them: step-height lists and mm/cm/in text. */

/** The units a length can be shown in (R14); storage and math stay mm (ADR 0003). */
export type LengthUnit = 'mm' | 'cm' | 'in';

export const LENGTH_UNITS: readonly LengthUnit[] = ['mm', 'cm', 'in'];

const MM_PER_INCH = 25.4;

/** The glyph for 0–7 eighths of an inch, reduced (2/8 → ¼). */
const EIGHTHS_GLYPH = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];

/** Regions that measure in inches (#627); every other region starts in mm. */
const INCH_REGIONS = new Set(['US', 'LR', 'MM']);

export function isLengthUnit(value: unknown): value is LengthUnit {
  return (LENGTH_UNITS as readonly unknown[]).includes(value);
}

function normalizeHeights(values: number[]): number[] {
  const cleaned = values.filter((v) => Number.isFinite(v) && v > 0);
  return [...new Set(cleaned)].sort((a, b) => a - b);
}

/**
 * Parse the settings-form text for available step heights: mm values
 * separated by semicolons, e.g. "20; 45; 60". A comma is a decimal comma
 * only between bare digits with no other comma ("4,5", "20,40"); otherwise
 * it separates steps ("20, 40", "20,40,60"). Invalid entries are dropped.
 */
export function parseStepHeightsList(text: string): number[] {
  const items = text.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed === '') return [];
    // Accept a decimal comma ("4,5") but also plain comma-separated lists.
    if (trimmed.includes(',') && !/^\d+,\d+$/.test(trimmed)) {
      return trimmed.split(',').map((p) => Number.parseFloat(p.trim().replace(',', '.')));
    }
    return [Number.parseFloat(trimmed.replace(',', '.'))];
  });
  return normalizeHeights(items);
}

/** Format the step heights back into the form's "20; 40; 60" notation. */
export function formatStepHeightsList(heights: number[]): string {
  return heights.join('; ');
}

/**
 * A length in mm, as a number in `unit` (ADR 0003: only display converts).
 * Inches keep two decimals: enough for `unitToMm` to give back the same
 * whole mm, so showing a stored value never moves it.
 */
export function mmToUnit(mm: number, unit: LengthUnit): number {
  if (unit === 'in') return Math.round((mm / MM_PER_INCH) * 100) / 100;
  return unit === 'cm' ? mm / 10 : mm;
}

/** A number typed in `unit`, back to mm; inches to the nearest whole mm. */
export function unitToMm(value: number, unit: LengthUnit): number {
  if (unit === 'in') return Math.round(value * MM_PER_INCH);
  return unit === 'cm' ? value * 10 : value;
}

/** A length rounded to the nearest ⅛″, as whole inches plus 0–7 eighths. */
export function inchEighths(mm: number): { whole: number; eighths: number } {
  const total = Math.round((Math.abs(mm) / MM_PER_INCH) * 8);
  return { whole: Math.floor(total / 8), eighths: total % 8 };
}

/** "1 ⅜", "1", "⅛", "0". */
function formatInches(mm: number): string {
  const { whole, eighths } = inchEighths(mm);
  if (eighths === 0) return String(whole);
  const glyph = EIGHTHS_GLYPH[eighths] ?? '';
  return whole === 0 ? glyph : `${whole} ${glyph}`;
}

/** The number only, no unit suffix ("63" / "6.3" / "2 ½"), for several
 * lengths under one shared unit label (R14). */
export function formatLengthValue(mm: number, unit: LengthUnit): string {
  if (unit === 'in') return formatInches(mm);
  if (unit === 'cm') {
    const cm = mmToUnit(mm, 'cm');
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  }
  return String(Math.round(mm));
}

/** "63 mm" / "6.3 cm" / "2 ½ in". */
export function formatLength(mm: number, unit: LengthUnit): string {
  return `${formatLengthValue(mm, unit)} ${unit}`;
}

/**
 * The unit a first run starts in, from the phone's locale ("en-US"): inches
 * in the regions that use them, mm everywhere else. The locale is passed
 * in, so this stays free of browser APIs (ADR 0002).
 */
export function defaultUnitForLocale(locale: string | undefined): LengthUnit {
  if (!locale) return 'mm';
  try {
    const region = new Intl.Locale(locale).region;
    return region !== undefined && INCH_REGIONS.has(region) ? 'in' : 'mm';
  } catch {
    return 'mm';
  }
}
