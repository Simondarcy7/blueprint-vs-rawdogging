import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function preflight({ brand, projectId, owner, profile, environment }) {
  const errors = [];
  if (!['preview', 'production'].includes(profile)) errors.push('Choose preview or production.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId ?? ''))
    errors.push('Set EAS_PROJECT_ID to the destination project UUID.');
  if (!owner) errors.push('Set EXPO_OWNER to the destination Expo account.');
  if (!brand.bundleIdentifier || brand.bundleIdentifier.startsWith('com.example.'))
    errors.push('Replace the example bundleIdentifier in brand.json.');
  if (environment !== profile) errors.push('EXPO_PUBLIC_APP_ENV must match the target profile.');
  return errors;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.loadEnvFile('.env');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const [action = 'check', profile = 'preview', platform, ...rest] = process.argv.slice(2);
  if (
    !['check', 'update', 'build'].includes(action) ||
    rest.length ||
    (action === 'build' ? !['ios', 'android'].includes(platform) : !!platform)
  )
    throw new Error(
      'Usage: release.mjs check|update preview|production, or build preview|production ios|android',
    );
  if (process.env.EXPO_PUBLIC_SHOW_GALLERY === 'true')
    throw new Error('Disable the development gallery before release.');
  const brand = JSON.parse(await readFile('brand.json', 'utf8'));
  const errors = preflight({
    brand,
    projectId: process.env.EAS_PROJECT_ID,
    owner: process.env.EXPO_OWNER,
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    profile,
  });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    `Target: ${process.env.EXPO_OWNER}/${brand.slug}; project ${process.env.EAS_PROJECT_ID}; channel/environment ${profile}; runtime fingerprint.`,
  );
  if (action === 'update' || action === 'build') {
    const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
    if (status.status !== 0 || status.stdout.trim())
      throw new Error(
        'Publish from a clean, committed checkout so the update has source provenance.',
      );
    const result = spawnSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      action === 'update'
        ? ['--yes', 'eas-cli@23.2.0', 'update', '--channel', profile, '--environment', profile]
        : ['--yes', 'eas-cli@23.2.0', 'build', '--profile', profile, '--platform', platform],
      { stdio: 'inherit', shell: false },
    );
    if (result.error || result.status !== 0)
      throw new Error(
        'Delivery command did not complete successfully. Inspect EAS before retrying.',
      );
    console.log(
      'Delivery command finished. Installed-build validation and recovery evidence are still required; upload is not rollout verification.',
    );
  }
}
