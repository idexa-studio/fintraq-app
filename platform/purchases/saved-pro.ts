import { IS_PREMIUM_OVERRIDE_ALLOWED } from '@/platform/purchases/dev-override';
import { isPro, parseSaved } from '@/platform/purchases/entitlement';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Whether the user is Pro, from what is saved on the phone and today's date.
 * It needs no store connection, so it answers offline and in the background
 * task. The developer override, honoured in development builds only, wins.
 */
export async function readSavedPro(now: number = Date.now()): Promise<boolean> {
  const [saved, override] = await AsyncStorage.multiGet([StorageKeys.PREMIUM, StorageKeys.PREMIUM_DEV_OVERRIDE]);
  if (IS_PREMIUM_OVERRIDE_ALLOWED) {
    if (override[1] === 'FORCED_ON') return true;
    if (override[1] === 'FORCED_OFF') return false;
  }
  // Read with its date: a subscription that has ended stops counting even if the app was never reopened.
  return isPro(parseSaved(saved[1]), now);
}
