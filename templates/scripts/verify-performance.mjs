import { lstat, readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

/** Measures every emitted JS file conservatively; this is not a browser startup timing claim. */
export async function verifyPerformance(exportRoot, limits) {
  exportRoot = resolve(exportRoot);
  for (const key of ['totalJavaScriptGzipBytes', 'totalFontBytes', 'maxImageBytes']) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] <= 0)
      throw new Error(`Set a positive measured budget: ${key}`);
  }
  const totals = { totalJavaScriptGzipBytes: 0, totalFontBytes: 0, maxImageBytes: 0 };
  let scripts = 0;
  let html = 0;
  const issues = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = resolve(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Export symlinks are not supported');
      if (entry.isDirectory()) {
        await walk(file);
        continue;
      }
      const name = relative(exportRoot, file).split(sep).join('/');
      if (/\.html$/i.test(name)) html++;
      if (/\.[cm]?js$/i.test(name)) {
        scripts++;
        totals.totalJavaScriptGzipBytes += gzipSync(await readFile(file)).byteLength;
      }
      if (/\.(woff2?|ttf|otf)$/i.test(name)) totals.totalFontBytes += (await lstat(file)).size;
      if (/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(name)) {
        const bytes = (await lstat(file)).size;
        totals.maxImageBytes = Math.max(totals.maxImageBytes, bytes);
        if (bytes > limits.maxImageBytes)
          issues.push(`${name}: image exceeds budget (${bytes} bytes)`);
      }
    }
  }
  await walk(exportRoot);
  if (!html || !scripts)
    issues.push('Expected a web export with HTML and JavaScript; missing output is not a pass');
  for (const key of ['totalJavaScriptGzipBytes', 'totalFontBytes'])
    if (totals[key] > limits[key]) issues.push(`${key}: ${totals[key]} exceeds ${limits[key]}`);
  return { totals, issues };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (!process.argv[2] || !process.argv[3])
      throw new Error('Usage: verify-performance.mjs EXPORT_DIR BUDGETS_JSON');
    const result = await verifyPerformance(
      process.argv[2],
      JSON.parse(await readFile(process.argv[3], 'utf8')),
    );
    console.log(JSON.stringify(result.totals));
    if (result.issues.length) throw new Error(result.issues.join('\n'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
