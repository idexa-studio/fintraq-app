import { readDraft, writeDraft } from '@/features/transactions/entry-draft';
import type { EntryDraft } from '@/features/transactions/entry-draft';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { LoggerService } from '@/shared/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Where the entry being typed is kept. A failed read or write only means it is not offered back. */

export async function loadDraft(): Promise<EntryDraft | null> {
  return readDraft(await AsyncStorage.getItem(StorageKeys.ENTRY_DRAFT).catch(() => null), Date.now());
}

export async function keepDraft(draft: EntryDraft): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.ENTRY_DRAFT, writeDraft(draft)).catch((e) => LoggerService.warn('ENTRY', 'Could not keep the entry being typed', e));
}

export async function forgetDraft(): Promise<void> {
  await AsyncStorage.removeItem(StorageKeys.ENTRY_DRAFT).catch((e) => LoggerService.warn('ENTRY', 'Could not forget the entry being typed', e));
}
