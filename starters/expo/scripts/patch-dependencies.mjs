// Temporary SDK 57 compatibility patch. See docs/dependency-notes.md.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const manifest = require.resolve('query-string/package.json', {
  paths: [path.dirname(require.resolve('expo-router/package.json'))],
});
const pkg = JSON.parse(await readFile(manifest, 'utf8'));
if (pkg.version !== '7.1.3')
  throw new Error('Review/remove the query-string compatibility patch for this version.');
const file = path.join(path.dirname(manifest), 'index.js');
const original = "const decodeComponent = require('decode-uri-component');";
const patched = "const decodeComponent = require('decode-uri-component').default;";
const code = await readFile(file, 'utf8');
if (code.includes(patched)) console.log('URI decoder compatibility patch already applied.');
else if (code.split(original).length === 2) {
  await writeFile(file, code.replace(original, patched));
  console.log('Applied reviewed URI decoder ESM interop patch.');
} else throw new Error('Unexpected query-string source; refusing an unreviewed patch.');
