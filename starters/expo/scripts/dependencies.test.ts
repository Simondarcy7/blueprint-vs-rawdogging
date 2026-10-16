import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const query = require('query-string');
it('decodes deep-link values and bounded malformed input with the patched decoder', () => {
  expect(query.parse('title=hello%20world&id=abc&tag=a&tag=b')).toMatchObject({
    title: 'hello world',
    id: 'abc',
    tag: ['a', 'b'],
  });
  const start = performance.now();
  query.parse('bad=' + '%C2'.repeat(500));
  expect(performance.now() - start).toBeLessThan(1000);
  expect(query.stringify({ id: 'abc', title: 'hello world' })).toContain('hello%20world');
});
it('retains the Xcode UUID API used by native project generation', () => {
  const xcode = require('xcode');
  const project = xcode.project('unused.pbxproj');
  project.hash = { project: { objects: {} } };
  expect(project.generateUuid()).toMatch(/^[A-F0-9]{24}$/);
});
