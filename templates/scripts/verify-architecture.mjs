import { readdir, readFile, lstat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Uses the adopting app's TypeScript, including its configured import aliases. */
export async function verifyArchitecture(root, ts) {
  root = resolve(root);
  const issues = [];
  const normalize = path => relative(root, path).split(sep).join('/');
  const sourceRoot = resolve(root, 'src');
  const paths = [];
  async function walk(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, item.name);
      if (item.isSymbolicLink()) { issues.push(`${normalize(path)}: source symlink requires explicit review`); continue; }
      if (item.isDirectory()) await walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(path) && !path.endsWith('.d.ts')) paths.push(path);
    }
  }
  await walk(sourceRoot);
  const configPath = ts.findConfigFile(root, ts.sys.fileExists);
  if (!configPath) throw new Error('tsconfig.json is required');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  // Empty fixtures are allowed; configuration errors are not.
  for (const error of parsed.errors.filter(error => error.code !== 18003)) issues.push(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const moduleRoot = resolve(root, 'src/modules');
  for (const entry of await readdir(moduleRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try { if (!(await lstat(resolve(moduleRoot, entry.name, 'index.ts'))).isFile()) throw new Error(); }
    catch { issues.push(`src/modules/${entry.name}/index.ts: missing public API`); }
  }
  const moduleOf = path => normalize(path).match(/^src\/modules\/([^/]+)\//)?.[1];
  for (const path of paths) {
    const name = normalize(path);
    const source = ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
    function report(node, message) { issues.push(`${name}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`); }
    function checkImport(node, specifier) {
      const target = ts.resolveModuleName(specifier, path, parsed.options, ts.sys).resolvedModule?.resolvedFileName;
      if (!target) {
        if (specifier.startsWith('.') || specifier.startsWith('@/')) report(node, `Unresolved local import: ${specifier}`);
        return;
      }
      const targetName = normalize(target);
      const targetModule = moduleOf(target);
      if (targetModule && moduleOf(path) !== targetModule && targetName !== `src/modules/${targetModule}/index.ts`) report(node, 'Cross-module imports must use the public index.ts');
      if (/^src\/(foundation|config)\//.test(name) && /^src\/(modules|services|state)\//.test(targetName)) report(node, 'Foundation/config cannot depend on application implementation');
    }
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) checkImport(node, node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) checkImport(node, arg.text);
        else report(node, 'Computed imports need an explicit static adapter boundary');
      }
      const processEnv = (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'process' && node.name.text === 'env')
        || (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'process' && ts.isStringLiteral(node.argumentExpression) && node.argumentExpression.text === 'env');
      if (processEnv && name !== 'src/config/env.ts') {
        const parent = node.parent;
        const compilerConstant = ts.isPropertyAccessExpression(parent) && parent.expression === node && parent.name.text === 'EXPO_SERVER';
        if (!compilerConstant) report(node, 'Environment access belongs in src/config/env.ts');
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    if (name.startsWith('src/app/') && !basename(path).startsWith('+')) {
      // Router HTML/API/middleware special files have different contracts; review separately.
      for (const statement of source.statements) {
        const reexport = ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier);
        const staticParams = ts.isFunctionDeclaration(statement) && statement.name?.text === 'generateStaticParams';
        const directive = ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
        const typeOnly = ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly;
        if (!(reexport || staticParams || directive || typeOnly)) report(statement, 'Route implementation belongs in a module; use re-exports');
      }
    }
  }
  return issues;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? '.');
  try {
    const ts = createRequire(resolve(root, 'package.json'))('typescript');
    const issues = await verifyArchitecture(root, ts);
    if (issues.length) throw new Error(issues.join('\n'));
    console.log('Architecture checks passed. Router special files and dynamic runtime behavior still need review.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
