import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { storage } from '@/services/storage';
import { useForeground } from '@/services/lifecycle';
import { createNotesStore } from './store';
const Context = createContext<ReturnType<typeof createNotesStore> | null>(null);
export function NotesProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => createNotesStore(storage));
  useEffect(() => {
    void store.load();
  }, [store]);
  useForeground(store.load);
  return <Context value={store}>{children}</Context>;
}
export function useNotes() {
  const store = useContext(Context);
  if (!store) throw new Error('NotesProvider missing.');
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot), store };
}
