/**
 * The appearances one fit run walks, out of every appearance the app offers
 * (#494). CI runs one job per appearance so the sweeps run side by side;
 * locally, with nothing named, a run walks them all. A name that is not an
 * appearance is an error rather than an empty sweep, which would pass having
 * checked nothing.
 */
export function selectAppearances<T extends string>(
  offered: readonly T[],
  named: string | undefined,
): T[] {
  if (!named) return [...offered];
  const appearance = offered.find((candidate) => candidate === named);
  if (appearance === undefined) {
    throw new Error(`FIT_APPEARANCE="${named}" is not one of: ${offered.join(', ')}`);
  }
  return [appearance];
}
