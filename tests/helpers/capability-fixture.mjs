import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const assets = fileURLToPath(new URL('../../codex/skills/mature-app-starter/assets/', import.meta.url));
export async function capabilityFixture(packs) {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-capability-'));
  try {
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await mkdir(join(root, 'src'), { recursive: true });
    await cp(join(assets, 'app-baseline/src/lib'), join(root, 'src/lib'), { recursive: true });
    for (const pack of packs) await cp(join(assets, 'app-capabilities', pack, 'src'), join(root, 'src'), { recursive: true });
    return {
      root,
      load: path => import(pathToFileURL(join(root, 'src', path)).href),
      cleanup: () => rm(root, { recursive: true, force: true }),
    };
  } catch (error) { await rm(root, { recursive: true, force: true }); throw error; }
}
