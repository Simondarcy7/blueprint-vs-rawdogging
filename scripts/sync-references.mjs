import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
if (args.length !== 1 || !['--check', '--write'].includes(args[0]))
  throw new Error('Usage: node scripts/sync-references.mjs --check|--write');
const write = args[0] === '--write';
const references = 'codex/skills/mature-app-starter/references/';
const mirrors = new Map([
  ['BLUEPRINT.md', [`${references}required-blueprint.md`, 'starters/expo/BLUEPRINT.md']],
  ['docs/kickoff-checklist.md', [`${references}kickoff-checklist.md`, 'codex/skills/kickoff-runner/references/kickoff-checklist.md']],
  ['docs/app-startup-blueprint.md', ['codex/skills/kickoff-runner/references/app-startup-blueprint.md']],
  ['docs/adr-templates.md', [`${references}adr-templates.md`, 'codex/skills/adr-writer/references/adr-templates.md']],
  ['docs/continuous-learning-loop.md', [`${references}continuous-learning-loop.md`, 'codex/skills/learning-loop-capture/references/continuous-learning-loop.md']],
  ['docs/agents-md-layers.md', ['codex/skills/agents-md-layerer/references/agents-md-layers.md']],
  ['docs/token-utilization.md', ['codex/skills/token-utilization-auditor/references/token-utilization.md']],
]);
const referenceNames = new Set(await readdir(new URL(references, root)));
for (const name of await readdir(new URL('docs/', root))) {
  if (referenceNames.has(name) || ['start-here.md', 'feature-recipes.md', 'content-trust.md', 'reliability-recipes.md'].includes(name)) {
    const source = `docs/${name}`;
    const destinations = mirrors.get(source) ?? [];
    const destination = `${references}${name}`;
    if (!destinations.includes(destination)) destinations.push(destination);
    mirrors.set(source, destinations);
  }
}
const sourceRoot = 'codex/skills/mature-app-starter/assets/';
for (const name of ['verify-architecture', 'verify-accessibility', 'verify-performance', 'release-tools']) {
  mirrors.set(`templates/scripts/${name}.mjs`, [`starters/expo/scripts/${name}.mjs`]);
}
mirrors.set(`${sourceRoot}app-baseline/src/components/ui/Presence.tsx`, ['starters/expo/src/components/ui/Presence.tsx']);
mirrors.set(`${sourceRoot}app-baseline/src/hooks/useReducedMotion.ts`, ['starters/expo/src/hooks/useReducedMotion.ts']);
mirrors.set(`${sourceRoot}app-baseline/src/lib/asyncWork.ts`, ['starters/expo/src/lib/asyncWork.ts']);
mirrors.set(`${sourceRoot}app-baseline/src/modules/settings/preferences.ts`, ['starters/expo/src/theme/preferences.ts']);
mirrors.set(`${sourceRoot}app-capabilities/storage/src/services/storage/adapterContract.ts`, ['starters/expo/src/services/storage/adapterContract.ts']);
let stale = 0;
for (const [source, destinations] of mirrors) {
  const content = await readFile(new URL(source, root), 'utf8');
  for (const destination of destinations) {
    let current;
    try { current = await readFile(new URL(destination, root), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current === content) continue;
    if (write) {
      const target = new URL(destination, root);
      await mkdir(new URL('.', target), { recursive: true });
      await writeFile(target, content);
    } else {
      console.error(`Stale mirror: ${destination} (source: ${source})`);
      stale++;
    }
  }
}
if (stale) process.exitCode = 1;
else console.log(`Reference/source mirrors ${write ? 'synchronized' : 'verified'}.`);
