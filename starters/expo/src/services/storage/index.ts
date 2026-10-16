import AsyncStorage from '@react-native-async-storage/async-storage';
import { withDeadline } from '@/lib/asyncWork';
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
// Ordinary preferences/example notes only. Credentials require a dedicated platform adapter.
export const storage: KeyValueStore = {
  getItem: (key) => withDeadline(() => AsyncStorage.getItem(key), 5000),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
