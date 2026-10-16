import { expect, it } from 'vitest';
// @ts-expect-error Test the executable JavaScript guard directly.
import { auditSources } from './verify-boundaries.mjs';
const valid = {
  'src/app/index.tsx': "export { Screen as default } from '@/modules/example';",
  'src/modules/example/index.ts': "export { Screen } from './Screen';",
  'src/modules/example/Screen.tsx': 'export const Screen = () => null;',
};
it('accepts public APIs and rejects missing scan coverage', () => {
  expect(auditSources(valid)).toEqual([]);
  expect(auditSources({})).not.toEqual([]);
});
it('catches private imports using aliases and relative paths', () => {
  expect(
    auditSources({
      ...valid,
      'src/app/index.tsx': "export { Screen as default } from '../modules/example/Screen';",
    }).join(),
  ).toContain('public module API');
});
it('catches cycles and inverted ownership', () => {
  expect(
    auditSources({
      ...valid,
      'src/services/bad.ts': "import '@/modules/example'; import './other';",
      'src/services/other.ts': "import './bad';",
    }).join(),
  ).toMatch(/foundation depends/);
  expect(
    auditSources({
      ...valid,
      'src/services/bad.ts': "import './other';",
      'src/services/other.ts': "import './bad';",
    }).join(),
  ).toContain('cycle');
});
