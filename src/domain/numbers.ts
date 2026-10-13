/** Small numeric helpers every layer may use (domain is pure). */

/** `value` held within [min, max]; NaN stays NaN. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
