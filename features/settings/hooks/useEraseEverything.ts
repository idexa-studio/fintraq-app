import { db } from '@/data/db/client';
import { accounts, budgets, categories, loans, payments, persons } from '@/data/db/schema';
import { useAppLock } from '@/features/lock';
import { BackupPreferences } from '@/platform/backup/backup-preferences';
import { GoogleDriveService } from '@/platform/drive/google-drive';
import { syncReminders } from '@/platform/notifications/reminder-sync';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * What the user made, and what the app remembers about them. Keys the app needs to keep working
 * (purchases, review timing, migrations) stay, which is why this is a list and not a clear-all.
 * Keys the app no longer writes are here too, so they are cleared off older installs.
 */
export const ERASED_KEYS: readonly string[] = [
  StorageKeys.PROFILE,
  StorageKeys.ONBOARDED,
  StorageKeys.SEED_EXECUTED,
  StorageKeys.RECENT_SEARCHES,
  StorageKeys.UPSELL_DISMISSED_AT,
  StorageKeys.BACKUP_PROMPT_DISMISSED_AT,
  StorageKeys.REMINDER_SKIPPED_DATE,
  StorageKeys.GETTING_STARTED_DISMISSED,
  StorageKeys.GUIDE_SEEN,
  StorageKeys.WHATS_NEW_SEEN,
  StorageKeys.WALKTHROUGH_DASHBOARD,
  StorageKeys.WALKTHROUGH_CATEGORIES,
  StorageKeys.WALKTHROUGH_ANALYTICS,
  StorageKeys.WALKTHROUGH_ACCOUNTS,
  StorageKeys.WALKTHROUGH_TRANSACTIONS,
  StorageKeys.WALKTHROUGH_SEARCH,
  StorageKeys.WALKTHROUGH_TRANSACTION_CREATE,
  StorageKeys.WALKTHROUGH_PERSONS,
];

/** Erases every record and preference, leaving the app as freshly installed. Throws if it could not. */
export function useEraseEverything() {
  const queryClient = useQueryClient();
  const { disableLock } = useAppLock();

  return useCallback(async () => {
    await GoogleDriveService.signOut().catch(() => undefined);
    queryClient.clear();

    // Children before parents, in one transaction, so a failure cannot leave orphans behind. The
    // callback is not async: the expo-sqlite driver commits an async callback at its first await.
    db.transaction((tx) => {
      tx.delete(budgets).run();
      tx.delete(payments).run();
      tx.delete(loans).run();
      tx.delete(persons).run();
      tx.delete(categories).run();
      tx.delete(accounts).run();
    });

    await AsyncStorage.multiRemove([...ERASED_KEYS, ...BackupPreferences.allKeys()]);
    // A fresh install has no lock; keeping the old PIN would lock the user out of an empty app.
    await disableLock();
    // With no loans and no profile left, this cancels every scheduled reminder.
    await syncReminders();
  }, [queryClient, disableLock]);
}
