import AsyncStorage from '@react-native-async-storage/async-storage';
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
// Ordinary preferences/example notes only. Credentials require a dedicated platform adapter.
export const storage: KeyValueStore = AsyncStorage;
