import type { KeyValueStore } from '@/services/storage';
import { parseNotes, type Note, type NotesDocument, validateNote } from './model';
export type NotesState = { status: 'loading' | 'ready' | 'error'; notes: Note[] };
export function createNotesStore(storage: KeyValueStore, key = 'shell.notes.v1') {
  let state: NotesState = { status: 'loading', notes: [] };
  const listeners = new Set<() => void>();
  let queue: Promise<unknown> = Promise.resolve();
  let initializing: Promise<void> | undefined;
  const notify = (next: NotesState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }
  function load() {
    if (initializing) return initializing;
    initializing = enqueue(async () => {
      notify({ ...state, status: 'loading' });
      try {
        const data = parseNotes(await storage.getItem(key));
        notify({ status: 'ready', notes: data.notes });
      } catch {
        notify({ ...state, status: 'error' });
      }
    }).finally(() => {
      initializing = undefined;
    });
    return initializing;
  }
  async function commit(update: (notes: Note[]) => Note[]) {
    return enqueue(async () => {
      if (state.status !== 'ready') throw new Error('Storage is not ready.');
      const notes = update(state.notes);
      const document: NotesDocument = { version: 1, notes };
      await storage.setItem(key, JSON.stringify(document));
      notify({ status: 'ready', notes });
    });
  }
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    load,
    save: (note: Note) => {
      const error = validateNote(note.title, note.body);
      if (error) return Promise.reject(new Error(error));
      return commit((notes) => [
        { ...note, title: note.title.trim() },
        ...notes.filter((item) => item.id !== note.id),
      ]);
    },
    remove: (id: string) => commit((notes) => notes.filter((note) => note.id !== id)),
  };
}
