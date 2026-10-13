/** Guards for values read from untrusted input (storage, a shared link). */

export function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Inclusive bounds for a number read from untrusted input. */
export interface Range {
  min: number;
  max: number;
}

/** A finite number within `range` (ends included), else `fallback` (#541). */
export function numberWithin(value: unknown, range: Range, fallback: number): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= range.min &&
    value <= range.max
    ? value
    : fallback;
}

/** The numbers in `list` within `range`, sorted with duplicates dropped. */
export function heightsWithin(list: unknown, range: Range): number[] {
  if (!Array.isArray(list)) return [];
  const kept = list.filter((v): v is number => numberWithin(v, range, NaN) === v);
  return [...new Set(kept)].sort((a, b) => a - b);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
