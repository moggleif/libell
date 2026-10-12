import { posix } from 'node:path';
import { parseAst } from 'rolldown/parseAst';
import type { SourceFile } from './sourceFiles.ts';

/** What one file exports, and which names it takes from other files. */
interface ModuleInfo {
  path: string;
  exports: { name: string; line: number }[];
  /** Resolved path of each imported file → the names taken, or '*' for all of them. */
  imports: { from: string; names: string[] | '*' }[];
}

type Node = { type: string; start: number; [key: string]: unknown };

/**
 * Every export in `checked` that no file in `files` imports, as messages
 * naming the file, line and export. An import from a test file counts as a
 * use: code only tests reach stays with its tests (#376).
 */
export function findUnusedExports(
  files: SourceFile[],
  checked: (path: string) => boolean,
): string[] {
  const known = new Set(files.map((file) => file.path));
  const modules = files.map((file) => readModule(file, known));
  const used = usedNames(modules);
  const problems: string[] = [];
  for (const module of modules.filter((m) => checked(m.path))) {
    const names = used.get(module.path);
    if (names === '*') continue;
    for (const { name, line } of module.exports) {
      if (!names?.has(name)) {
        problems.push(
          `Unused export: ${module.path}:${line} ${name} is imported nowhere. Remove it or drop "export".`,
        );
      }
    }
  }
  return problems;
}

function usedNames(modules: ModuleInfo[]): Map<string, Set<string> | '*'> {
  const used = new Map<string, Set<string> | '*'>();
  for (const { imports } of modules) {
    for (const { from, names } of imports) {
      const sofar = used.get(from);
      if (sofar === '*') continue;
      if (names === '*') used.set(from, '*');
      else used.set(from, new Set([...(sofar ?? []), ...names]));
    }
  }
  return used;
}

function readModule({ path, source }: SourceFile, known: Set<string>): ModuleInfo {
  const lineAt = (offset: number) => source.slice(0, offset).split('\n').length;
  const lang = path.endsWith('.ts') ? 'ts' : 'js';
  const info: ModuleInfo = { path, exports: [], imports: [] };
  const importFrom = (node: Node, names: string[] | '*') => {
    const from = resolveImport(path, (node['source'] as { value: string }).value, known);
    if (from) info.imports.push({ from, names });
  };
  for (const node of parseAst(source, { lang }).body as unknown as Node[]) {
    if (node.type === 'ImportDeclaration') importFrom(node, importedNames(node));
    if (node.type === 'ExportAllDeclaration') importFrom(node, '*');
    if (node.type === 'ExportNamedDeclaration') {
      if (node['source']) importFrom(node, specifierNames(node, 'local'));
      const names = node['declaration']
        ? declaredNames(node['declaration'] as Node)
        : valueSpecifiers(node).map((specifier) => nameOf(specifier['exported']));
      for (const name of names) info.exports.push({ name, line: lineAt(node.start) });
    }
  }
  return info;
}

function importedNames(node: Node): string[] | '*' {
  const names: string[] = [];
  for (const specifier of node['specifiers'] as Node[]) {
    if (specifier.type === 'ImportNamespaceSpecifier') return '*';
    if (specifier.type === 'ImportDefaultSpecifier') names.push('default');
    else names.push(nameOf(specifier['imported']));
  }
  return names;
}

function specifierNames(node: Node, side: 'local' | 'exported'): string[] {
  return (node['specifiers'] as Node[]).map((specifier) => nameOf(specifier[side]));
}

/**
 * Types are left out: a module's exported types describe its interface (the
 * shape of what its functions take and return) even when no file names them.
 */
const TYPE_DECLARATIONS = new Set(['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']);

function valueSpecifiers(node: Node): Node[] {
  if (node['exportKind'] === 'type') return [];
  return (node['specifiers'] as Node[]).filter((specifier) => specifier['exportKind'] !== 'type');
}

function declaredNames(declaration: Node): string[] {
  if (TYPE_DECLARATIONS.has(declaration.type) || declaration['declare']) return [];
  if (declaration.type === 'VariableDeclaration') {
    return (declaration['declarations'] as Node[]).flatMap((d) => bindingNames(d['id'] as Node));
  }
  return [nameOf(declaration['id'])];
}

function bindingNames(pattern: Node): string[] {
  if (pattern.type === 'Identifier') return [nameOf(pattern)];
  if (pattern.type === 'ObjectPattern') {
    return (pattern['properties'] as Node[]).flatMap((p) =>
      bindingNames((p['value'] ?? p['argument']) as Node),
    );
  }
  if (pattern.type === 'ArrayPattern') {
    return (pattern['elements'] as (Node | null)[]).flatMap((e) => (e ? bindingNames(e) : []));
  }
  return [];
}

function nameOf(node: unknown): string {
  const named = node as { name?: string; value?: string };
  return named.name ?? String(named.value);
}

/** The known file a relative import points at; packages resolve to nothing. */
function resolveImport(from: string, specifier: string, known: Set<string>): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = posix.join(posix.dirname(from), specifier);
  return [base, `${base}.ts`, `${base}/index.ts`].find((candidate) => known.has(candidate));
}
