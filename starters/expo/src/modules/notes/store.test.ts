import { describe, expect, it } from 'vitest';
import { createNotesStore } from './store';
import { parseNotes } from './model';
const note = (id: string) => ({
  id,
  title: `Note ${id}`,
  body: '',
  updatedAt: '2026-01-01T00:00:00.000Z',
});
function fixture() {
  let value: string | null = null;
  let fail = false;
  const storage = {
    getItem: async () => value,
    setItem: async (_: string, next: string) => {
      if (fail) throw new Error('Unavailable');
      value = next;
    },
  };
  return {
    storage,
    value: () => value,
    fail: (next: boolean) => {
      fail = next;
    },
    seed: (next: string) => {
      value = next;
    },
  };
}
describe('durable notes', () => {
  it('serializes overlapping writes without losing a note', async () => {
    const f = fixture();
    const store = createNotesStore(f.storage);
    await store.load();
    await Promise.all([store.save(note('a')), store.save(note('b'))]);
    expect(parseNotes(f.value()).notes.map((n) => n.id)).toEqual(['b', 'a']);
  });
  it('keeps memory unchanged on failed write and permits retry', async () => {
    const f = fixture();
    const store = createNotesStore(f.storage);
    await store.load();
    f.fail(true);
    await expect(store.save(note('a'))).rejects.toThrow();
    expect(store.getSnapshot().notes).toEqual([]);
    f.fail(false);
    await store.save(note('a'));
    expect(parseNotes(f.value()).notes).toHaveLength(1);
  });
  it('never overwrites unreadable or newer data, and can retry initialization', async () => {
    const f = fixture();
    f.seed('{"version":2,"notes":[]}');
    const store = createNotesStore(f.storage);
    await store.load();
    expect(store.getSnapshot().status).toBe('error');
    await expect(store.save(note('a'))).rejects.toThrow();
    expect(f.value()).toContain('"version":2');
    f.seed('{"version":1,"notes":[]}');
    await store.load();
    await store.save(note('b'));
    expect(store.getSnapshot().status).toBe('ready');
  });
  it('rejects duplicate identities and blank titles', () => {
    expect(() =>
      parseNotes(JSON.stringify({ version: 1, notes: [note('a'), note('a')] })),
    ).toThrow();
    expect(() =>
      parseNotes(JSON.stringify({ version: 1, notes: [{ ...note('a'), title: ' ' }] })),
    ).toThrow();
  });
  it('deletes durably and restores in a fresh instance', async () => {
    const f = fixture();
    const store = createNotesStore(f.storage);
    await store.load();
    await store.save(note('a'));
    const fresh = createNotesStore(f.storage);
    await fresh.load();
    expect(fresh.getSnapshot().notes).toHaveLength(1);
    await fresh.remove('a');
    expect(parseNotes(f.value()).notes).toEqual([]);
  });
});
