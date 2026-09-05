import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const brand = JSON.parse(await readFile('brand.json', 'utf8'));
const result = spawnSync(
  'maestro',
  ['test', '-e', `APP_ID=${brand.bundleIdentifier}`, 'e2e/native/smoke.yaml'],
  { stdio: 'inherit' },
);
if (result.error || result.status !== 0)
  throw new Error(
    'Native smoke did not pass. Install Maestro and launch an identified simulator/device build first.',
  );
