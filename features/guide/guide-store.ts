import { WHATS_NEW_RELEASE, parseSeen, withSeen, withoutTips } from '@/features/guide/guide-rules';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { LoggerService } from '@/shared/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** What the guide remembers on this phone. A failed read or write only means a tip is seen twice. */

export async function readSeen(): Promise<string[]> {
  return parseSeen(await AsyncStorage.getItem(StorageKeys.GUIDE_SEEN).catch(() => null));
}

export async function addSeen(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.GUIDE_SEEN, JSON.stringify(withSeen(await readSeen(), id)));
  } catch (e) {
    LoggerService.error('GUIDE', 'Could not save that a tip was seen', e);
  }
}

export const readWhatsNewSeen = (): Promise<string | null> => AsyncStorage.getItem(StorageKeys.WHATS_NEW_SEEN).catch(() => null);

/** Called when "What is new" is closed, and when setup finishes on a new install. */
export async function markWhatsNewSeen(): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.WHATS_NEW_SEEN, String(WHATS_NEW_RELEASE)).catch((e) => LoggerService.error('GUIDE', 'Could not save that the note was seen', e));
}

/**
 * Brings every tip and Home's first steps back, and returns what is still seen. What the user
 * has actually done (opened Insights) stays done: only what they closed comes back.
 */
export async function forgetTips(): Promise<string[]> {
  const kept = withoutTips(await readSeen());
  await AsyncStorage.setItem(StorageKeys.GUIDE_SEEN, JSON.stringify(kept));
  await AsyncStorage.removeItem(StorageKeys.GETTING_STARTED_DISMISSED);
  return kept;
}
