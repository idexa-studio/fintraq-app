import { BackupPreferences } from '@/platform/backup/backup-preferences';
import { toSaved } from '@/platform/purchases/entitlement';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => void store.set(key, value),
      multiGet: async (keys: string[]) => keys.map((key) => [key, store.get(key) ?? null]),
      clear: async () => store.clear(),
    },
  };
});

const DAY = 24 * 60 * 60 * 1000;

// The background backup has no app around it: it decides from what is saved, and from today's date.
describe('whether the background backup may run', () => {
  beforeEach(() => AsyncStorage.clear());

  it('runs for someone who bought on the shipped app', async () => {
    await AsyncStorage.setItem(StorageKeys.PREMIUM, '{"isPremium":true}');
    expect(await BackupPreferences.isProEntitled()).toBe(true);
  });

  it('does not run with nothing bought', async () => {
    expect(await BackupPreferences.isProEntitled()).toBe(false);
    await AsyncStorage.setItem(StorageKeys.PREMIUM, '{"isPremium":false}');
    expect(await BackupPreferences.isProEntitled()).toBe(false);
  });

  it('runs during a subscription and stops once it has ended, even if the app was never reopened', async () => {
    const saved = Date.now() - 40 * DAY;
    await AsyncStorage.setItem(StorageKeys.PREMIUM, toSaved({ kind: 'subscription', plan: 'monthly', activeUntil: Date.now() + 5 * DAY, renews: false }, saved));
    expect(await BackupPreferences.isProEntitled()).toBe(true);
    // Saved while active, so `isPremium` still says true; the date decides.
    await AsyncStorage.setItem(StorageKeys.PREMIUM, toSaved({ kind: 'subscription', plan: 'monthly', activeUntil: Date.now() - DAY, renews: false }, saved));
    expect(await BackupPreferences.isProEntitled()).toBe(false);
  });
});
