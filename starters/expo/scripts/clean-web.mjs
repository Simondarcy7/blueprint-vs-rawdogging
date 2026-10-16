import { rm } from 'node:fs/promises';
// dist is owned build output. Remove stale hashed assets and previously exported routes.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
