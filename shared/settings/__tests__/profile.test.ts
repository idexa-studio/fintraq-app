import { StorageKeys } from '@/shared/contracts/storage-keys';
import { DEFAULT_PROFILE, loadProfile, readStoredProfile, saveProfile } from '@/shared/settings/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => void store.set(key, value),
      clear: async () => store.clear(),
    },
  };
});

describe('saved profile', () => {
  beforeEach(() => AsyncStorage.clear());

  it('is absent on a fresh install, and loads as the defaults', async () => {
    expect(await readStoredProfile()).toBeNull();
    expect(await loadProfile()).toEqual(DEFAULT_PROFILE);
  });

  // A profile saved before `shareUsageData` and `language` existed.
  it('fills fields an older version never saved', async () => {
    await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify({ name: 'John', defaultCurrency: 'INR', theme: 'dark' }));
    expect(await loadProfile()).toEqual({ ...DEFAULT_PROFILE, name: 'John', defaultCurrency: 'INR', theme: 'dark' });
    expect(await readStoredProfile()).toEqual({ name: 'John', defaultCurrency: 'INR', theme: 'dark' });
  });

  it('reads back what it saved, under the key existing installs use', async () => {
    await saveProfile({ ...DEFAULT_PROFILE, name: 'Asha' });
    expect(JSON.parse((await AsyncStorage.getItem('@fintraq_profile')) ?? '{}').name).toBe('Asha');
    expect((await loadProfile()).name).toBe('Asha');
  });

  it('lets unreadable storage surface as an error', async () => {
    await AsyncStorage.setItem(StorageKeys.PROFILE, '{not json');
    await expect(readStoredProfile()).rejects.toThrow();
  });
});
