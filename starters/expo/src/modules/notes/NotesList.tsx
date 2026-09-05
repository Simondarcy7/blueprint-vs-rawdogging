import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card, Text, Field, Notice, LoadingState, Screen, Button } from '@/components/ui';
import { useNotes } from './NotesProvider';
export function RecentNotes({ limit }: { limit?: number }) {
  const { status, notes, store } = useNotes();
  if (status === 'loading') return <LoadingState label="Loading notes…" />;
  if (status === 'error')
    return (
      <Notice
        error
        title="Your notes couldn’t be loaded"
        message="Storage may be unavailable or contain data this version cannot read. Your stored data has not been replaced."
        action="Retry loading"
        onAction={() => {
          void store.load();
        }}
      />
    );
  if (!notes.length)
    return (
      <Notice
        title="A fresh page"
        message="Your ideas have a home here. Add your first note whenever you’re ready."
        action="Create a note"
        onAction={() => router.push('/note/new')}
      />
    );
  return (
    <View style={{ gap: 12 }}>
      {notes.slice(0, limit).map((note) => (
        <Link key={note.id} href={{ pathname: '/note', params: { id: note.id } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`Open note: ${note.title}`}>
            <Card>
              <Text variant="heading">{note.title}</Text>
              <Text muted numberOfLines={2}>
                {note.body || 'No additional text'}
              </Text>
              <Text variant="small" muted>
                Updated {new Date(note.updatedAt).toLocaleDateString()}
              </Text>
            </Card>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
export function NotesScreen() {
  const [query, setQuery] = useState('');
  const { notes, status } = useNotes();
  const matches = notes.filter((note) =>
    `${note.title} ${note.body}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Screen title="Notes" description="A place for the things you want to keep.">
      <Button label="New note" onPress={() => router.push('/note/new')} />
      <Field
        label="Search notes"
        value={query}
        onChangeText={setQuery}
        placeholder="Find a thought…"
        returnKeyType="search"
      />
      {query.trim() && status === 'ready' ? (
        matches.length ? (
          <View style={{ gap: 12 }}>
            {matches.map((note) => (
              <Link key={note.id} href={{ pathname: '/note', params: { id: note.id } }} asChild>
                <Pressable accessibilityRole="link">
                  <Card>
                    <Text variant="heading">{note.title}</Text>
                    <Text muted numberOfLines={2}>
                      {note.body}
                    </Text>
                  </Card>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : (
          <Notice
            title="No matching notes"
            message="Try a different word or clear your search."
            action="Clear search"
            onAction={() => setQuery('')}
          />
        )
      ) : (
        <RecentNotes />
      )}
    </Screen>
  );
}
