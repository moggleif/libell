/**
 * Every visual preset, in the order Settings offers them. The one list:
 * the settings parser and the fit check (`scripts/fit/config.mjs`, #403)
 * both read it, so a new preset cannot be added without being checked.
 *
 * Kept free of imports so that script can load it straight from Node.
 */
export const APPEARANCES = ['classic', 'modern', 'glossy'] as const;

export type AppearanceSetting = (typeof APPEARANCES)[number];

export function isAppearance(value: unknown): value is AppearanceSetting {
  return (APPEARANCES as readonly unknown[]).includes(value);
}
