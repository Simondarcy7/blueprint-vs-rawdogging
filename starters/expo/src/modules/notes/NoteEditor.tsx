import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import * as Crypto from 'expo-crypto';
import { Button, ConfirmDialog, Field, LoadingState, Notice, Screen, Text } from '@/components/ui';
import { useNotes } from './NotesProvider';
import { validateNote, type Note } from './model';
export function NoteEditorScreen({ create = false }: { create?: boolean }) {
  const params = useLocalSearchParams<{ id?: string }>();
  const { notes, status } = useNotes();
  if (status === 'loading')
    return (
      <Screen title="Your note">
        <LoadingState />
      </Screen>
    );
  if (status === 'error')
    return (
      <Screen title="Your note">
        <Notice
          error
          title="Notes are unavailable"
          message="Return to Notes and retry loading before editing."
          action="Go to Notes"
          onAction={() => router.replace('/notes')}
        />
      </Screen>
    );
  const note = notes.find((item) => item.id === params.id);
  return <ReadyEditor key={params.id ?? 'new'} create={create} note={note} />;
}
function ReadyEditor({ create, note }: { create: boolean; note?: Note }) {
  const [initial] = useState(note);
  if (!create && !initial)
    return (
      <Screen title="Note not found">
        <Notice
          title="This note isn’t here"
          message="It may have been removed or saved on another device. Notes are stored on this device only."
          action="Go to Notes"
          onAction={() => router.replace('/notes')}
        />
      </Screen>
    );
  return <Editor initial={initial} />;
}
function Editor({ initial }: { initial?: Note }) {
  const { store } = useNotes();
  const navigation = useNavigation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [validation, setValidation] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaveAction, setLeaveAction] = useState<Parameters<typeof navigation.dispatch>[0]>();
  const dirty = !completed && (title !== (initial?.title ?? '') || body !== (initial?.body ?? ''));
  usePreventRemove(dirty || busy, ({ data }) => {
    if (!busyRef.current) setLeaveAction(data.action);
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty) return;
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);
  useEffect(() => {
    if (completed) {
      if (leaveAction) navigation.dispatch(leaveAction);
      else {
        router.dismissAll();
        router.replace('/notes');
      }
    }
  }, [completed, leaveAction, navigation]);
  async function save() {
    if (busyRef.current) return;
    const invalid = validateNote(title, body);
    setValidation(invalid);
    if (invalid) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await store.save({
        id: initial?.id ?? Crypto.randomUUID(),
        title,
        body,
        updatedAt: new Date().toISOString(),
      });
      setCompleted(true);
    } catch {
      setError('Your note could not be saved. Your text is still here—please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (!initial || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await store.remove(initial.id);
      setCompleted(true);
    } catch {
      setDeleting(false);
      setError('Your note could not be deleted. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen title={initial ? 'Edit note' : 'New note'} description="A thought worth keeping.">
      <Field
        label="Title"
        testID="note-title"
        value={title}
        onChangeText={setTitle}
        error={validation}
        maxLength={120}
        editable={!busy}
        placeholder="Give it a name"
        returnKeyType="next"
      />
      <Field
        label="Note"
        testID="note-body"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={10000}
        editable={!busy}
        style={{ minHeight: 220 }}
        placeholder="Start writing…"
        hint="Optional. Saved only on this device."
      />
      {error ? <Notice error title="Something needs attention" message={error} /> : null}
      <View style={{ gap: 12 }}>
        <Button
          label="Save note"
          onPress={() => {
            void save();
          }}
          busy={busy}
        />
        <Button label="Cancel" variant="secondary" disabled={busy} onPress={() => router.back()} />
        {initial ? (
          <Button
            label="Delete note"
            variant="danger"
            disabled={busy}
            onPress={() => setDeleting(true)}
          />
        ) : null}
      </View>
      <Text variant="small" muted>
        {dirty ? 'Changes have not been saved.' : 'No unsaved changes.'}
      </Text>
      <ConfirmDialog
        visible={!!leaveAction}
        title="Discard changes?"
        message="Your unsaved text will be lost."
        confirmLabel="Discard changes"
        onCancel={() => setLeaveAction(undefined)}
        onConfirm={() => setCompleted(true)}
      />
      <ConfirmDialog
        visible={deleting}
        title="Delete this note?"
        message="This removes the saved note from this device. This cannot be undone."
        confirmLabel="Delete permanently"
        busy={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          void remove();
        }}
      />
    </Screen>
  );
}
