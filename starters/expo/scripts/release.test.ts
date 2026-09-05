import { expect, it } from 'vitest';
// @ts-expect-error Exercise the command's preflight without contacting EAS.
import { preflight } from './release.mjs';
const valid = {
  brand: { bundleIdentifier: 'com.acme.product' },
  projectId: '11111111-1111-1111-1111-111111111111',
  owner: 'example-owner',
  profile: 'preview',
  environment: 'preview',
};
it('rejects placeholder identity and mismatched update environment', () => {
  expect(preflight(valid)).toEqual([]);
  expect(preflight({ ...valid, environment: 'production' }).join()).toContain('match');
  expect(preflight({ ...valid, brand: { bundleIdentifier: 'com.example.app' } }).join()).toContain(
    'Replace',
  );
  expect(preflight({ ...valid, projectId: undefined }).join()).toContain('UUID');
});
