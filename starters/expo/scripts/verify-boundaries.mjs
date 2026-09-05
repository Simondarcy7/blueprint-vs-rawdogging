import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
export function auditSources(files) {
  const errors = [];
  const graph = new Map();
  for (const [name, code] of Object.entries(files)) {
    const source = ts.createSourceFile(
      name,
      code,
      ts.ScriptTarget.Latest,
      true,
      name.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const imports = [];
    graph.set(name, imports);
    function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const target = node.moduleSpecifier.text;
        const resolved = target.startsWith('@/')
          ? `src/${target.slice(2)}`
          : target.startsWith('.')
            ? path.posix.normalize(path.posix.join(path.posix.dirname(name), target))
            : undefined;
        if (resolved) {
          const actual = [
            resolved,
            `${resolved}.ts`,
            `${resolved}.tsx`,
            `${resolved}/index.ts`,
            `${resolved}/index.tsx`,
          ].find((key) => files[key] !== undefined);
          if (actual) imports.push(actual);
          const own = name.match(/^src\/modules\/([^/]+)\//)?.[1];
          const other = resolved.match(/^src\/modules\/([^/]+)(.*)$/);
          if (other && own !== other[1] && other[2] && other[2] !== '/index')
            errors.push(`${name}: import the public module API: ${target}`);
          if (
            /^src\/(components|theme|services|config)\//.test(name) &&
            resolved.startsWith('src/modules/')
          )
            errors.push(`${name}: foundation depends on a product module`);
          if (
            name.startsWith('src/app/') &&
            resolved.startsWith('src/services/') &&
            !name.endsWith('_layout.tsx')
          )
            errors.push(`${name}: route calls services directly`);
        }
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        node.getText(source) === 'process.env' &&
        !name.startsWith('src/config/')
      )
        errors.push(`${name}: environment reads belong in src/config`);
      ts.forEachChild(node, visit);
    }
    visit(source);
    if (
      name.startsWith('src/app/') &&
      !name.endsWith('_layout.tsx') &&
      !name.endsWith('+html.tsx') &&
      code.split('\n').length > 40
    )
      errors.push(`${name}: route exceeds the thin-route budget`);
  }
  const visiting = new Set();
  const visited = new Set();
  function walk(name) {
    if (visiting.has(name)) {
      errors.push(`Import cycle at ${name}`);
      return;
    }
    if (visited.has(name)) return;
    visiting.add(name);
    for (const next of graph.get(name) ?? []) walk(next);
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of graph.keys()) walk(name);
  if (
    !Object.keys(files).some((name) => name.startsWith('src/app/')) ||
    !Object.keys(files).some((name) => name.startsWith('src/modules/'))
  )
    errors.push('No routes or modules scanned.');
  return errors;
}
export async function collect(directory = 'src') {
  const files = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(files, await collect(name));
    else if (/\.[jt]sx?$/.test(name) && !name.includes('.test.'))
      files[name] = await readFile(name, 'utf8');
  }
  return files;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await collect();
  const errors = auditSources(files);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log(`Boundaries checked across ${Object.keys(files).length} source files.`);
}
