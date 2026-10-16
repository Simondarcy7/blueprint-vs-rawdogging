import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Explicit-prop checks only. This cannot establish semantic or rendered accessibility. */
export async function verifyAccessibility(root, ts) {
  const issues = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = resolve(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Source symlinks require review');
      if (entry.isDirectory()) {
        await walk(file);
        continue;
      }
      if (!/\.tsx$/.test(file) || /\.(test|spec)\.tsx$/.test(file)) continue;
      const tree = ts.createSourceFile(
        file,
        await readFile(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const name = node.tagName.getText(tree);
          const props = new Map(
            node.attributes.properties
              .filter(ts.isJsxAttribute)
              .map((prop) => [prop.name.getText(tree), prop]),
          );
          const report = (message) =>
            issues.push(
              `${relative(root, file)}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1}: ${message}`,
            );
          if (name === 'Pressable' && !props.has('accessibilityRole'))
            report('Pressable needs an explicit role');
          if (name === 'TextInput' && !props.has('accessibilityLabel'))
            report('TextInput needs an explicit accessible name');
          if (name === 'Image') {
            const value = props.get('accessible')?.initializer;
            const decorative =
              value &&
              ts.isJsxExpression(value) &&
              value.expression?.kind === ts.SyntaxKind.FalseKeyword;
            if (!props.has('accessible')) report('Classify Image as decorative or accessible');
            if (!decorative && !props.has('accessibilityLabel'))
              report('Accessible Image needs a label');
          }
          if (props.get('allowFontScaling')?.initializer?.getText(tree) === '{false}')
            report('Disabling text scaling requires explicit review');
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
  }
  await walk(resolve(root, 'src'));
  return issues;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? '.');
  try {
    const ts = createRequire(resolve(root, 'package.json'))('typescript');
    const issues = await verifyAccessibility(root, ts);
    if (issues.length) throw new Error(issues.join('\n'));
    console.log(
      'Static accessibility checks passed; keyboard, screen-reader and visual checks remain required.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
