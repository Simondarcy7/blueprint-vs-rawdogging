import { createDraftController } from './capabilities/services/drafts/draftController.ts';
import { createImportReview } from './capabilities/services/import-review/importReview.ts';
import { createOverlayFocusManager } from './capabilities/services/interactions/overlayFocus.ts';
import { createPromptPolicy } from './capabilities/services/engagement/promptPolicy.ts';

type Note = { title: string; body: string };
type Collection = { entries: Note[] };
const element = <T extends HTMLElement>(id: string) => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing example element: ${id}`);
  return node as T;
};
const text = (id: string, value: string) => { const node = element(id); if (node.textContent !== value) node.textContent = value; };
const title = element<HTMLInputElement>('title');
const body = element<HTMLTextAreaElement>('body');
const source = element<HTMLTextAreaElement>('import-source');
const dialog = element<HTMLDialogElement>('discard-dialog');
const draftKey = 'blueprint-fieldnotes:v1:draft';
const entriesKey = 'blueprint-fieldnotes:v1:entries';
let active = true;
let completedImports = 0;
const owner = () => active ? 'local-example-owner' : 'disposed';
const assertOwner = () => { if (!active) throw new Error('Example disposed'); };
const delay = () => new Promise<void>(resolve => setTimeout(resolve, 100));
function parseNote(input: unknown): Note {
  if (!input || typeof input !== 'object') throw new Error('A note is required');
  const value = input as Record<string, unknown>;
  if (typeof value.title !== 'string' || typeof value.body !== 'string' || value.title.length > 120 || value.body.length > 5000)
    throw new Error('Invalid note');
  return { title: value.title, body: value.body };
}
function parseCollection(input: unknown): Collection {
  if (!input || typeof input !== 'object') throw new Error('A collection is required');
  const entries = (input as Record<string, unknown>).entries;
  if (!Array.isArray(entries) || entries.length > 20) throw new Error('Choose up to 20 entries');
  return { entries: entries.map(value => { const note = parseNote(value); if (!note.title.trim()) throw new Error('A title is required'); return note; }) };
}
const drafts = createDraftController({
  owner: 'local-example-owner', draftId: 'editor', baselineRevision: 'empty-editor-v1',
  initial: { title: '', body: '' }, parse: parseNote, assertOwner,
  storage: {
    async read() { await delay(); assertOwner(); return localStorage.getItem(draftKey); },
    async write(raw) { await delay(); assertOwner(); if (element<HTMLInputElement>('fail-draft').checked) throw new Error('Demo storage failure'); localStorage.setItem(draftKey, raw); },
    async remove() { await delay(); assertOwner(); if (element<HTMLInputElement>('fail-draft').checked) throw new Error('Demo storage failure'); localStorage.removeItem(draftKey); },
  },
});
const imports = createImportReview({
  getOwner: owner,
  async parse(contents) { await delay(); return parseCollection(JSON.parse(contents)); },
  summarize(value) { return { count: value.entries.length, titles: value.entries.map(entry => entry.title) }; },
  async commit(value, context) {
    await delay();
    if (element<HTMLInputElement>('fail-import').checked) throw new Error('Demo commit failure');
    assertOwner();
    if (!context.isCurrent()) throw new Error('Review is no longer current');
    localStorage.setItem(entriesKey, JSON.stringify(value));
    completedImports++;
    renderCollection();
  },
});
const focus = createOverlayFocusManager({ document });
const stopTriggers = focus.watchTriggers();
let restoreFocus: ReturnType<typeof focus.captureReturnFocus> | undefined;
const prompt = createPromptPolicy({ minimumActivities: 3, activitiesBetweenRequests: 3, promptGapMs: 14 * 86_400_000, requestGapMs: 180 * 86_400_000 });
function renderEngagement() {
  const draft = drafts.getSnapshot(); const review = imports.getSnapshot();
  const decision = prompt({ enabled: true, workflowBusy: draft.dirty || draft.busy || dialog.open || ['validating', 'review', 'committing', 'cancelling'].includes(review.status),
    completedActivities: completedImports, now: Date.now(), history: { lastPromptAt: null, lastRequestAt: null, activitiesAtLastRequest: 0 } });
  text('engagement-status', `Prompt policy: ${decision.replaceAll('-', ' ')}. This example evaluates eligibility only; no review request is made.`);
}
function renderDraft() {
  const state = drafts.getSnapshot();
  if (title.value !== state.value.title) title.value = state.value.title;
  if (body.value !== state.value.body) body.value = state.value.body;
  let status = state.saved ? 'Saved in this browser.' : state.dirty ? 'Unsaved changes.' : 'Your draft is ready.';
  if (state.status === 'loading') status = 'Opening your draft… You can keep writing.';
  if (state.busy && state.status !== 'loading') status = 'Saving your changes…';
  if (state.recovery) status = 'Choose how to recover the stored draft before saving.';
  if (state.error === 'save') status = 'Could not save. Your writing is still here. Try again.';
  if (state.error === 'clear') status = 'Could not discard. Your draft is still here.';
  if (state.status === 'blocked') status = state.error === 'read'
    ? 'Could not load your draft. Your writing is kept. Retry loading without discarding it.'
    : 'The stored draft could not be validated. It has been preserved. Explicitly discard it to start again.';
  text('draft-status', status);
  element('draft-status').dataset.error = String(Boolean(state.error));
  element('draft-recovery').hidden = !state.recovery;
  element('retry-draft').hidden = state.error !== 'read';
  element<HTMLButtonElement>('save-draft').disabled = state.busy || state.status !== 'ready' || Boolean(state.recovery);
  element<HTMLButtonElement>('discard-draft').disabled = state.busy;
  renderEngagement();
}
function renderImport() {
  const state = imports.getSnapshot();
  const inFlight = state.status === 'committing' || state.status === 'cancelling';
  source.disabled = inFlight;
  element<HTMLButtonElement>('review-import').disabled = inFlight || state.status === 'validating';
  element<HTMLButtonElement>('example-import').disabled = inFlight;
  element<HTMLButtonElement>('confirm-import').disabled = inFlight || !state.review;
  element<HTMLButtonElement>('cancel-import').disabled = inFlight;
  element('import-review').hidden = !state.review;
  const messages: Record<string, string> = {
    idle: 'Nothing will change until you confirm.', validating: 'Checking the file. Your collection is unchanged.',
    review: 'Review the entries, then confirm replacement.', committing: 'Replacing the collection…',
    cancelling: 'Waiting for the current write to settle.', committed: 'Import complete. The collection below is saved.',
    invalid: 'This is not a valid journal file. Your collection is unchanged.', cancelled: 'Import cancelled. Nothing was replaced.',
  };
  text('import-status', state.error === 'commit-failed' ? 'Could not import. Your review is kept. Try again or cancel.' : messages[state.status] ?? state.status);
  element('import-status').dataset.error = String(Boolean(state.error));
  if (state.review) {
    const value = state.review.value;
    text('review-summary', `${value.entries.length} ${value.entries.length === 1 ? 'entry' : 'entries'} will replace the current collection.`);
    element('review-titles').replaceChildren(...value.entries.map(entry => { const li = document.createElement('li'); li.textContent = entry.title; return li; }));
  }
  renderEngagement();
}
function renderCollection() {
  try {
    const raw = localStorage.getItem(entriesKey);
    const value = raw === null ? { entries: [] } : parseCollection(JSON.parse(raw));
    text('collection-count', String(value.entries.length));
    element('entries').replaceChildren(...value.entries.map(note => {
      const li = document.createElement('li'); const heading = document.createElement('h3'); const paragraph = document.createElement('p');
      heading.textContent = note.title; paragraph.textContent = note.body; li.append(heading, paragraph); return li;
    }));
    if (!value.entries.length) { const li = document.createElement('li'); li.textContent = 'No saved entries yet. Review the example to try an import.'; element('entries').append(li); }
    element('collection-error').hidden = true;
  } catch { text('collection-count', '?'); text('collection-error', 'The saved collection could not be read. Its data has been preserved.'); element('collection-error').hidden = false; }
}
function edit() { try { drafts.set({ title: title.value, body: body.value }); } catch { text('draft-status', 'These changes could not be accepted. Keep a copy before leaving.'); } }
title.addEventListener('input', edit); body.addEventListener('input', edit);
element('save-draft').addEventListener('click', () => { void drafts.save(); });
element('retry-draft').addEventListener('click', () => { void drafts.load(); });
element('recover').addEventListener('click', () => { drafts.recover(); });
element('keep-current').addEventListener('click', () => { drafts.keepCurrent(); });
element('discard-draft').addEventListener('click', () => { restoreFocus?.cancel(); restoreFocus = focus.captureReturnFocus(); dialog.showModal(); renderEngagement(); });
element('cancel-discard').addEventListener('click', () => dialog.close());
element('confirm-discard').addEventListener('click', async () => {
  element<HTMLButtonElement>('confirm-discard').disabled = true;
  await drafts.clear(); element<HTMLButtonElement>('confirm-discard').disabled = false; dialog.close();
});
dialog.addEventListener('close', () => { restoreFocus?.(); renderEngagement(); });
element('review-import').addEventListener('click', () => { void imports.stage(source.value); });
element('confirm-import').addEventListener('click', () => { const reviewed = imports.getSnapshot().review; if (reviewed) void imports.confirm(reviewed.revision); });
element('cancel-import').addEventListener('click', () => imports.cancel());
source.addEventListener('input', () => imports.cancel());
function example() {
  if (imports.getSnapshot().status !== 'idle') imports.cancel();
  source.value = JSON.stringify({ entries: [{ title: 'A slower morning', body: 'Make room for a thought before the day begins.' }, { title: 'Keep the useful details', body: 'Good product behaviour survives both interruption and failure.' }] }, null, 2);
}
element('example-import').addEventListener('click', example);
const stopDraft = drafts.subscribe(renderDraft); const stopImport = imports.subscribe(renderImport);
example(); renderCollection(); renderDraft(); renderImport(); void drafts.load();
window.addEventListener('pagehide', event => {
  // A BFCache entry resumes this exact page and its controllers when the user returns.
  if (event.persisted) return;
  active = false; stopDraft(); stopImport(); drafts.dispose(); imports.dispose(); restoreFocus?.cancel(); stopTriggers(); focus.dispose();
});
