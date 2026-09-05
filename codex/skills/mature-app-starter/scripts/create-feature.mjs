import { lstat, mkdir, realpath, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main(args) {
  const options = { layout: 'modules' };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!['--root', '--name', '--layout'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Usage: create-feature.mjs --root EXISTING_PROJECT --name kebab-case [--layout features|modules]');
    }
    if (Object.hasOwn(options, key.slice(2)) && key !== '--layout') throw new Error(`Duplicate option: ${key}`);
    options[key.slice(2)] = args[i + 1];
  }
  if (!options.root || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(options.name ?? '')) {
    throw new Error('An existing --root and a lowercase kebab-case --name are required.');
  }
  if (options.name.length > 64) throw new Error('Feature names must be 64 characters or fewer.');
  if (!['features', 'modules'].includes(options.layout)) throw new Error('Layout must be features or modules.');
  const root = await realpath(options.root);
  if (!(await lstat(root)).isDirectory()) throw new Error('Project root must be a directory.');
  let parent = root;
  for (const part of ['src', options.layout]) {
    parent = join(parent, part);
    try {
      await mkdir(parent);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const info = await lstat(parent);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Expected a real directory: ${parent}`);
  }
  const destination = join(parent, options.name);
  // Exclusive directory creation protects existing features, including symlinks.
  await mkdir(destination);
  const typeName = options.name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('') + 'State';
  const files = {
    'types.ts': `/** Add only the states this workflow actually needs. */\nexport type ${typeName} = { status: 'idle' };\n`,
    'index.ts': `export type { ${typeName} } from './types';\n`,
    'README.md': `# ${options.name}\n\nOwn this workflow here. Keep routes thin and expose supported entrypoints through index.ts.\n\nBefore implementation, describe purpose, primary action, applicable states, recovery, navigation and accessibility in a screen-behavior record.\n\nAdd screens, components, hooks or services only when needed. Keep external integrations behind typed boundaries. Test real validation and state transitions; do not add a test that merely asserts this scaffold's initial value.\n`,
  };
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(destination, name), content, { flag: 'wx' });
  }
  console.log(`Created ${destination}`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(`Feature scaffold failed: ${error.message}`);
  process.exitCode = 1;
});
