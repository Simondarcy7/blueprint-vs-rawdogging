export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}
export interface NotesDocument {
  version: 1;
  notes: Note[];
}
export function parseNotes(raw: string | null): NotesDocument {
  if (raw === null) return { version: 1, notes: [] };
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('notes' in value) ||
    !Array.isArray(value.notes)
  )
    throw new Error('Unsupported notes document.');
  const ids = new Set<string>();
  for (const note of value.notes) {
    if (
      !note ||
      typeof note.id !== 'string' ||
      !note.id ||
      ids.has(note.id) ||
      typeof note.title !== 'string' ||
      !note.title.trim() ||
      note.title.length > 120 ||
      typeof note.body !== 'string' ||
      note.body.length > 10000 ||
      typeof note.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(note.updatedAt))
    )
      throw new Error('Invalid note.');
    ids.add(note.id);
  }
  return { version: 1, notes: value.notes };
}
export function validateNote(title: string, body: string): string | undefined {
  if (!title.trim()) return 'Give your note a title.';
  if (title.trim().length > 120) return 'Use 120 characters or fewer for the title.';
  if (body.length > 10000) return 'Use 10,000 characters or fewer for the note.';
}
