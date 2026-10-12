import { countLines, measureFunctions } from './functionSizes.ts';

/** The size limits, and the existing exceptions that may shrink but never grow. */
export interface SizeRules {
  maxFunctionLines: number;
  maxFileLines: number;
  /** `path > function name` → the most lines that function may have today. */
  functionBaseline: Record<string, number>;
  /** File path → the most lines that file may have today. */
  fileBaseline: Record<string, number>;
}

export interface SourceFile {
  path: string;
  source: string;
}

/**
 * Every way the files break the size rules, as messages naming the file, the
 * function and what to do. Baseline entries must match today's size exactly,
 * so the baseline only ever tightens.
 */
export function checkSizes(files: SourceFile[], rules: SizeRules): string[] {
  return [
    ...checkAgainst(fileSizes(files), rules.maxFileLines, rules.fileBaseline, 'File'),
    ...checkAgainst(
      functionSizes(files),
      rules.maxFunctionLines,
      rules.functionBaseline,
      'Function',
    ),
  ];
}

interface Measured {
  key: string;
  where: string;
  lines: number;
}

function fileSizes(files: SourceFile[]): Measured[] {
  return files.map(({ path, source }) => ({ key: path, where: path, lines: countLines(source) }));
}

/** The longest function per name, since a file can repeat a name. */
function functionSizes(files: SourceFile[]): Measured[] {
  const longest = new Map<string, Measured>();
  for (const { path, source } of files) {
    for (const fn of measureFunctions(source)) {
      const key = `${path} > ${fn.name}`;
      const known = longest.get(key);
      if (!known || fn.lines > known.lines) {
        longest.set(key, { key, where: `${path}:${fn.line} ${fn.name}`, lines: fn.lines });
      }
    }
  }
  return [...longest.values()];
}

function checkAgainst(
  measured: Measured[],
  limit: number,
  baseline: Record<string, number>,
  kind: string,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const { key, where, lines } of measured) {
    seen.add(key);
    const allowed = baseline[key];
    if (allowed === undefined) {
      if (lines > limit) {
        problems.push(
          `${kind} too long: ${where} is ${lines} lines, the limit is ${limit}. Split it up.`,
        );
      }
    } else if (lines > allowed) {
      problems.push(
        `${kind} grew: ${where} is ${lines} lines, its baseline is ${allowed}. Shrink it instead.`,
      );
    } else if (lines <= limit) {
      problems.push(`${kind} now within the limit: remove "${key}" from the size baseline.`);
    } else if (lines < allowed) {
      problems.push(
        `${kind} shrank: lower the size baseline for "${key}" from ${allowed} to ${lines}.`,
      );
    }
  }
  for (const key of Object.keys(baseline)) {
    if (!seen.has(key)) problems.push(`${kind} is gone: remove "${key}" from the size baseline.`);
  }
  return problems;
}
