import Constants from 'expo-constants';
import brand from '../../brand.json';
export { brand };
export const navigation = { home: 'Home', notes: 'Notes', settings: 'Settings' } as const;

export const appVersion = Constants.expoConfig?.version ?? 'Development';
