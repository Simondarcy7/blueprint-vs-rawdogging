import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['outbox']);
after(fixture.cleanup);
const { createDurableOutbox } = await fixture.load('services/outbox/durableOutbox.ts');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const parsePayload = input => {
  if (!input || typeof input !== 'object' || typeof input.text !== 'string') throw new Error('Invalid payload');
  return { text: input.text };
};
function setup(overrides = {}) {
  let raw = null; let id = 0;
  const sent = [];
  const storage = { read: async () => raw, write: async next => { raw = next; } };
  const options = { storage, parsePayload, createId: () => `event-${++id}`, send: async item => { sent.push(item); }, ...overrides };
  return { queue: createDurableOutbox(options), options, sent, storage, raw: () => raw, corrupt: value => { raw = value; } };
}

test('persisted submissions reopen and deliver in order without retaining caller references', async () => {
  const s = setup();
  const input = { text: 'first', privateExtra: 'drop' };
  const first = s.queue.enqueue(input); input.text = 'changed';
  await Promise.all([first, s.queue.enqueue({ text: 'second' })]);
  assert.deepEqual(await s.queue.list(), [{ id: 'event-1', payload: { text: 'first' } }, { id: 'event-2', payload: { text: 'second' } }]);
  s.queue.dispose();
  const reopened = createDurableOutbox(s.options);
  assert.deepEqual(await reopened.flush(), { sent: 2, state: 'empty' });
  assert.deepEqual(s.sent.map(item => item.id), ['event-1', 'event-2']);
});

test('failed delivery retains the original ID and concurrent flushes share one delivery', async () => {
  const gate = deferred(); let fail = true; const calls = [];
  const s = setup({ send: async item => { calls.push(item.id); await gate.promise; if (fail) throw new Error('offline'); } });
  await s.queue.enqueue({ text: 'retry' });
  const first = s.queue.flush(); const second = s.queue.flush(); assert.equal(first, second);
  gate.resolve(); assert.deepEqual(await first, { sent: 0, state: 'pending', reason: 'delivery' });
  fail = false; assert.equal((await s.queue.flush()).sent, 1);
  assert.deepEqual(calls, ['event-1', 'event-1']);
});

test('receipt-write failure retries the same ID for server-side deduplication', async () => {
  const s = setup(); await s.queue.enqueue({ text: 'value' });
  const write = s.storage.write; let fail = true;
  s.storage.write = async raw => { if (fail) throw new Error('disk unavailable'); await write(raw); };
  assert.deepEqual(await s.queue.flush(), { sent: 0, state: 'pending', reason: 'storage' });
  assert.equal((await s.queue.list()).length, 1);
  fail = false; assert.equal((await s.queue.flush()).sent, 1);
  assert.deepEqual(s.sent.map(item => item.id), ['event-1', 'event-1']);
});

test('corrupt, future, duplicate-ID and invalid payload storage are preserved without sending', async () => {
  const invalid = ['{broken', '', '{"version":2,"items":[]}', JSON.stringify({ version: 1, items: [{ id: 'x', payload: { text: 'a' } }, { id: 'x', payload: { text: 'b' } }] }), JSON.stringify({ version: 1, items: [{ id: 'x', payload: { text: 4 } }] })];
  for (const raw of invalid) {
    const s = setup(); s.corrupt(raw);
    await assert.rejects(s.queue.enqueue({ text: 'new' }));
    assert.equal((await s.queue.flush()).reason, 'storage'); assert.equal(s.raw(), raw); assert.equal(s.sent.length, 0);
  }
});

test('enqueue persists before any send and failed writes never report success', async () => {
  const s = setup({ storage: { read: async () => null, write: async () => { throw new Error('disk full'); } } });
  await assert.rejects(s.queue.enqueue({ text: 'not saved' }), /disk full/); assert.equal(s.sent.length, 0);
});

test('enqueue during delivery is retained when acknowledging the earlier item', async () => {
  const gate = deferred(); const started = deferred(); const delivered = [];
  const s = setup({ send: async item => { delivered.push(item.id); started.resolve(); await gate.promise; } });
  await s.queue.enqueue({ text: 'first' }); const flushing = s.queue.flush(); await started.promise;
  await s.queue.enqueue({ text: 'second' }); gate.resolve();
  assert.deepEqual(await flushing, { sent: 2, state: 'empty' }); assert.deepEqual(delivered, ['event-1', 'event-2']);
});

test('disposal during delivery prevents acknowledgement and preserves data for a future owner', async () => {
  const gate = deferred(); const started = deferred();
  const s = setup({ send: async () => { started.resolve(); await gate.promise; } });
  await s.queue.enqueue({ text: 'pending' }); const flushing = s.queue.flush(); await started.promise;
  s.queue.dispose(); gate.resolve(); assert.equal((await flushing).state, 'stopped');
  assert.equal(JSON.parse(s.raw()).items.length, 1); await assert.rejects(s.queue.enqueue({ text: 'later' }), /disposed/);
});

test('ownership loss after storage read fences writes and delivery', async () => {
  let owner = true; let writes = 0;
  const s = setup({ assertOwner: () => { if (!owner) throw new Error('lost owner'); }, storage: { read: async () => { owner = false; return null; }, write: async () => { writes++; } } });
  await assert.rejects(s.queue.enqueue({ text: 'blocked' }), /lost owner/);
  assert.equal(writes, 0); assert.equal((await s.queue.flush()).reason, 'storage'); assert.equal(s.sent.length, 0);
});

test('a stalled transport times out, receives cancellation and leaves pending work intact', async () => {
  let signal;
  const s = setup({ deliveryTimeoutMs: 5, send: async (_, value) => { signal = value; return new Promise(() => {}); } });
  await s.queue.enqueue({ text: 'pending' }); assert.equal((await s.queue.flush()).reason, 'delivery');
  assert.equal(signal.aborted, true); assert.equal((await s.queue.list()).length, 1);
});

test('disposal while a storage read is outstanding prevents a later write', async () => {
  const gate = deferred(); const started = deferred(); let writes = 0;
  const s = setup({ storage: { read: async () => { started.resolve(); await gate.promise; return null; }, write: async () => { writes++; } } });
  const queued = s.queue.enqueue({ text: 'pending' });
  const rejected = assert.rejects(queued, /disposed/);
  await started.promise; s.queue.dispose(); gate.resolve(); await rejected;
  assert.equal(writes, 0);
});

test('bounds, invalid IDs and oversized input fail without replacing saved data', async () => {
  for (const limits of [{ limit: 0 }, { maxBytes: Infinity }, { deliveryTimeoutMs: -1 }]) assert.throws(() => setup(limits));
  const s = setup({ limit: 1 }); await s.queue.enqueue({ text: 'one' }); const raw = s.raw();
  await assert.rejects(s.queue.enqueue({ text: 'two' }), /full/); assert.equal(s.raw(), raw);
  const invalid = setup({ createId: () => '../bad' }); await assert.rejects(invalid.queue.enqueue({ text: 'one' }), /identity/); assert.equal(invalid.raw(), null);
  const big = setup({ maxBytes: 80 }); await assert.rejects(big.queue.enqueue({ text: '🌎'.repeat(30) }), /byte limit/); assert.equal(big.raw(), null);
});

test('transport mutation cannot change which durable receipt is acknowledged', async () => {
  const s = setup({ send: async item => { item.id = 'different'; item.payload.text = 'mutated'; } });
  await s.queue.enqueue({ text: 'original' }); assert.equal((await s.queue.flush()).state, 'empty');
});

test('the same implementation supports distinct validated feedback and inventory payloads', async () => {
  for (const field of ['message', 'sku']) {
    const received = [];
    const parse = input => { if (!input || typeof input[field] !== 'string') throw new Error('Invalid domain payload'); return { [field]: input[field] }; };
    const s = setup({ parsePayload: parse, send: async item => { received.push(item.payload); } });
    await s.queue.enqueue({ [field]: 'example' }); await s.queue.flush();
    assert.deepEqual(received, [{ [field]: 'example' }]);
  }
});
