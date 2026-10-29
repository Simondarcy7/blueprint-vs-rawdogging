import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['import-review']);
after(fixture.cleanup);
const { createImportReview } = await fixture.load('services/import-review/importReview.ts');
const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const source = JSON.stringify({ items: [{ title: 'A book' }] });
function example(overrides = {}) {
  const writes = [];
  let owner = 'owner-one';
  const controller = createImportReview({
    parse(contents) {
      const value = JSON.parse(contents);
      if (!Array.isArray(value.items) || !value.items.every(item => typeof item.title === 'string')) throw new Error('Invalid items');
      return value;
    },
    summarize: value => ({ itemCount: value.items.length }),
    commit: async (value, context) => {
      if (!context.isCurrent()) throw new Error('Wrong owner');
      writes.push({ value, owner: context.owner, revision: context.reviewRevision });
    },
    getOwner: () => owner,
    validationTimeoutMs: 50,
    ...overrides,
  });
  return { controller, writes, setOwner: value => { owner = value; } };
}

test('selection validates and reviews without writing; only an explicit matching revision commits', async () => {
  const { controller, writes } = example();
  assert.equal(controller.getSnapshot().status, 'idle');
  const staged = await controller.stage(source);
  assert.equal(staged.status, 'review');
  assert.deepEqual(staged.review.summary, { itemCount: 1 });
  assert.equal(writes.length, 0);
  assert.equal((await controller.confirm(staged.review.revision + 1)).status, 'stale');
  assert.equal(writes.length, 0);
  assert.deepEqual(await controller.confirm(staged.review.revision), { status: 'committed', current: true });
  assert.equal(controller.getSnapshot().status, 'committed');
  assert.equal(writes.length, 1);
  assert.equal((await controller.confirm(staged.review.revision)).status, 'stale');
  assert.equal(writes.length, 1);
  controller.dispose();
});

test('source and parsed structure limits reject before review or write', async () => {
  const { controller, writes } = example({ maxBytes: 40 });
  for (const input of ['not JSON', '{"items":1}', 'x'.repeat(41), '🌎'.repeat(11)]) {
    assert.equal((await controller.stage(input)).status, 'invalid');
    assert.equal(controller.getSnapshot().review, null);
  }
  assert.equal(writes.length, 0);
  for (const parsed of [NaN, undefined, new Date(), { get secret() { throw new Error('Should not invoke'); } }]) {
    const next = example({ parse: () => parsed, summarize: () => ({}) });
    assert.equal((await next.controller.stage('{}')).status, 'invalid');
    next.controller.dispose();
  }
  controller.dispose();
});

test('review data and summary are copied and deeply frozen, including arrays', async () => {
  const parsed = { items: [{ title: 'Original' }] };
  const summary = { counts: [1] };
  const { controller } = example({ parse: () => parsed, summarize: () => summary });
  const { review } = await controller.stage(source);
  parsed.items[0].title = 'Changed';
  summary.counts[0] = 8;
  assert.equal(review.value.items[0].title, 'Original');
  assert.deepEqual(review.summary, { counts: [1] });
  assert.throws(() => { review.value.items.push({ title: 'New' }); }, TypeError);
  assert.throws(() => { review.summary.counts[0] = 9; }, TypeError);
  controller.dispose();
});

test('new source invalidates older asynchronous validation and its confirmation', async () => {
  const old = deferred();
  const started = deferred();
  const { controller, writes } = example({ parse: contents => {
    if (contents === 'old') { started.resolve(); return old.promise; }
    return { items: [{ title: contents }] };
  } });
  const first = controller.stage('old');
  await started.promise;
  const second = await controller.stage('new');
  old.resolve({ items: [{ title: 'old' }] });
  assert.equal((await first).status, 'cancelled');
  assert.equal(controller.getSnapshot().review.value.items[0].title, 'new');
  assert.equal((await controller.confirm(second.review.revision - 1)).status, 'stale');
  assert.equal(writes.length, 0);
  controller.dispose();
});

test('cancel settles a non-cooperative validator and prevents late review publication', async () => {
  const started = deferred();
  let signal;
  const { controller } = example({ parse: (_, next) => { signal = next; started.resolve(); return new Promise(() => {}); } });
  const staged = controller.stage(source);
  await started.promise;
  controller.cancel();
  assert.equal((await staged).status, 'cancelled');
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'cancelled');
  assert.equal(controller.getSnapshot().review, null);
  controller.dispose();
});

test('a validation deadline opens an actionable invalid state without an unbounded wait', async () => {
  let signal;
  const { controller } = example({ parse: (_, next) => { signal = next; return new Promise(() => {}); }, validationTimeoutMs: 5 });
  assert.equal((await controller.stage(source)).status, 'invalid');
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().error, 'validation-failed');
  controller.dispose();
});

test('owner changes invalidate validation and a previously displayed review', async () => {
  const pending = deferred();
  const started = deferred();
  const r = example({ parse: () => { started.resolve(); return pending.promise; } });
  const staged = r.controller.stage(source);
  await started.promise;
  r.setOwner('owner-two');
  pending.resolve({ items: [] });
  assert.equal((await staged).status, 'cancelled');
  assert.equal(r.controller.getSnapshot().error, 'owner-changed');
  r.controller.dispose();

  const next = example();
  const { review } = await next.controller.stage(source);
  next.setOwner('owner-two');
  assert.equal((await next.controller.confirm(review.revision)).status, 'stale');
  assert.equal(next.controller.getSnapshot().review, null);
  assert.equal(next.writes.length, 0);
  next.controller.dispose();
});

test('revalidation cannot silently replace the material the user reviewed', async () => {
  let count = 0;
  const r = example({ parse: () => ({ items: [{ title: ++count === 1 ? 'Reviewed' : 'Different' }] }) });
  const { review } = await r.controller.stage(source);
  assert.equal((await r.controller.confirm(review.revision)).status, 'invalid');
  assert.equal(r.controller.getSnapshot().error, 'stale-review');
  assert.equal(r.writes.length, 0);
  r.controller.dispose();
});

test('object key ordering alone is not treated as changed content', async () => {
  let count = 0;
  const r = example({ parse: () => ++count === 1 ? { items: [], kind: 'books' } : { kind: 'books', items: [] } });
  const { review } = await r.controller.stage(source);
  assert.equal((await r.controller.confirm(review.revision)).status, 'committed');
  assert.equal(r.writes.length, 1);
  r.controller.dispose();
});

test('double confirmation coalesces, and a new import cannot interrupt an active commit', async () => {
  const pending = deferred();
  const started = deferred();
  let commits = 0;
  const r = example({ commit: async () => { commits++; started.resolve(); await pending.promise; } });
  const { review } = await r.controller.stage(source);
  const first = r.controller.confirm(review.revision);
  assert.equal(r.controller.confirm(review.revision), first);
  await started.promise;
  assert.equal((await r.controller.stage(source)).status, 'busy');
  assert.equal((await r.controller.confirm(review.revision + 1)).status, 'busy');
  pending.resolve();
  assert.equal((await first).status, 'committed');
  assert.equal(commits, 1);
  r.controller.dispose();
});

test('failed commit preserves the exact review and allows an explicit safe retry', async () => {
  let fails = true;
  const committed = [];
  const r = example({ commit: async value => {
    if (fails) throw new Error('Storage unavailable PRIVATE_SENTINEL');
    committed.push(value);
  } });
  const { review } = await r.controller.stage(source);
  assert.equal((await r.controller.confirm(review.revision)).status, 'retryable');
  assert.equal(r.controller.getSnapshot().review, review);
  assert.equal(r.controller.getSnapshot().error, 'commit-failed');
  assert.equal(JSON.stringify(r.controller.getSnapshot()).includes('PRIVATE_SENTINEL'), false);
  fails = false;
  assert.equal((await r.controller.confirm(review.revision)).status, 'committed');
  assert.equal(committed[0], review.value);
  r.controller.dispose();
});

test('revalidation failure and timeout keep the review available for retry', async () => {
  for (const failure of ['reject', 'timeout']) {
    let count = 0;
    const r = example({ validationTimeoutMs: 5, parse: async () => {
      if (++count === 2) {
        if (failure === 'timeout') return new Promise(() => {});
        throw new Error('Validator unavailable');
      }
      return { items: [] };
    } });
    const { review } = await r.controller.stage(source);
    assert.equal((await r.controller.confirm(review.revision)).status, 'retryable');
    assert.equal(r.controller.getSnapshot().review, review);
    assert.equal(r.controller.getSnapshot().error, 'validation-failed');
    assert.equal((await r.controller.confirm(review.revision)).status, 'committed');
    r.controller.dispose();
  }
});

test('host atomic fence prevents commit after cancellation or owner change', async () => {
  for (const action of ['cancel', 'owner']) {
    const pending = deferred();
    const started = deferred();
    let writes = 0;
    const r = example({ commit: async (_, context) => {
      started.resolve(); await pending.promise;
      if (!context.isCurrent()) throw new Error('Atomic owner fence refused write');
      writes++;
    } });
    const { review } = await r.controller.stage(source);
    const committing = r.controller.confirm(review.revision);
    await started.promise;
    if (action === 'cancel') r.controller.cancel(); else r.setOwner('owner-two');
    pending.resolve();
    assert.equal((await committing).status, action === 'cancel' ? 'cancelled' : 'stale');
    assert.equal(writes, 0);
    assert.equal(r.controller.getSnapshot().review, null);
    r.controller.dispose();
  }
});

test('cancellation after irreversible commit never claims the write was rolled back', async () => {
  const receipt = deferred();
  const written = deferred();
  let writes = 0;
  const r = example({ commit: async (_, context) => {
    if (!context.isCurrent()) throw new Error('Stale');
    writes++; written.resolve(); await receipt.promise;
  } });
  const { review } = await r.controller.stage(source);
  const committing = r.controller.confirm(review.revision);
  await written.promise;
  r.controller.cancel();
  assert.equal(r.controller.getSnapshot().status, 'cancelling');
  receipt.resolve();
  assert.deepEqual(await committing, { status: 'committed', current: false });
  assert.equal(r.controller.getSnapshot().status, 'committed');
  assert.equal(writes, 1);
  r.controller.dispose();
});

test('observers can cancel before validation or commit without creating a write', async () => {
  const r = example();
  const { review } = await r.controller.stage(source);
  const unsubscribe = r.controller.subscribe(() => {
    if (r.controller.getSnapshot().status === 'committing') r.controller.cancel();
  });
  assert.equal((await r.controller.confirm(review.revision)).status, 'cancelled');
  assert.equal(r.writes.length, 0);
  unsubscribe();
  r.controller.dispose();
  assert.equal((await r.controller.stage(source)).status, 'cancelled');
});

test('configuration rejects invalid budgets and owner-reader failures fail closed', async () => {
  for (const maxBytes of [0, -1, NaN, Infinity, 0.5, 104857601]) assert.throws(() => example({ maxBytes }), /byte limit/);
  for (const validationTimeoutMs of [0, -1, NaN, 0.5, 60001]) assert.throws(() => example({ validationTimeoutMs }), /timeout/);
  const r = example({ getOwner() { throw new Error('Owner unavailable'); } });
  assert.equal((await r.controller.stage(source)).status, 'invalid');
  assert.equal(r.controller.getSnapshot().error, 'owner-changed');
  r.controller.dispose();
});
