/** Lengths as the user types and reads them: step-height lists and mm/cm text. */

export function normalizeHeights(values: number[]): number[] {
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

/** A length in mm, as a number in `unit` (ADR 0003: only display converts). */
export function mmToUnit(mm: number, unit: 'mm' | 'cm'): number {
  return unit === 'cm' ? mm / 10 : mm;
}

/** A number typed in `unit`, back to mm. */
export function unitToMm(value: number, unit: 'mm' | 'cm'): number {
  return unit === 'cm' ? value * 10 : value;
}

/** The number only, no unit suffix ("63" / "6.3"), for several lengths under
 * one shared unit label (R14). */
export function formatLengthValue(mm: number, unit: 'mm' | 'cm'): string {
  if (unit === 'cm') {
    const cm = mmToUnit(mm, 'cm');
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  }
  return String(Math.round(mm));
}

/** "63 mm" / "6.3 cm". */
export function formatLength(mm: number, unit: 'mm' | 'cm'): string {
  return `${formatLengthValue(mm, unit)} ${unit}`;
}
