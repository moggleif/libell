import { parseAst } from 'rolldown/parseAst';

/** One function in a source file and how many lines it spans. */
export interface FunctionSize {
  /** Enclosing function names joined by ` > `, e.g. `createMenu > refresh`. */
  name: string;
  /** 1-based line the function starts on. */
  line: number;
  /** Lines from the first to the last line of the function, inner functions included. */
  lines: number;
}

type Node = { type?: string; start?: number; end?: number; [key: string]: unknown };

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** Every function with a body in a TypeScript source, measured in lines. */
export function measureFunctions(source: string): FunctionSize[] {
  const lineAt = lineLookup(source);
  const sizes: FunctionSize[] = [];

  const visit = (node: unknown, parent: Node | undefined, path: string[]): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child, parent, path);
      return;
    }
    if (!isNode(node)) return;
    let childPath = path;
    if (FUNCTION_TYPES.has(node.type ?? '') && node.body) {
      childPath = [...path, functionName(node, parent)];
      const line = lineAt(node.start ?? 0);
      sizes.push({ name: childPath.join(' > '), line, lines: lineAt(node.end ?? 0) - line + 1 });
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== 'type') visit(child, node, childPath);
    }
  };

  visit(parseAst(source, { lang: 'ts' }), undefined, []);
  return sizes;
}

/** Number of lines in a source file, a trailing newline not counted as a line. */
export function countLines(source: string): number {
  return source.replace(/\n$/, '').split('\n').length;
}

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null;
}

/** The name a reader would use for a function: its own, or what it is assigned to. */
function functionName(fn: Node, parent: Node | undefined): string {
  const own = identifierName(fn['id']);
  if (own) return own;
  if (parent) {
    for (const key of ['id', 'key', 'left']) {
      const name = identifierName(parent[key]);
      if (name && parent[key] !== fn) return name;
    }
  }
  return '(anonymous)';
}

function identifierName(node: unknown): string | undefined {
  if (!isNode(node)) return undefined;
  if (node.type === 'Identifier' || node.type === 'PrivateIdentifier')
    return node['name'] as string;
  if (node.type === 'MemberExpression') return identifierName(node['property']);
  if (node.type === 'Literal') return String(node['value']);
  return undefined;
}

/** Maps a character offset to its 1-based line number. */
function lineLookup(source: string): (offset: number) => number {
  const starts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((starts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  };
}
