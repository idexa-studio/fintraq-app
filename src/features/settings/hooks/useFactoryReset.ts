import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { StorageKeys } from '@/src/constants/keys';
import { db } from '@/src/db/client';
import { accounts, categories, loans, payments, persons } from '@/src/db/schema';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';

/**
 * User-facing state a reset clears. Infra keys (purchases, review-prompt timing, migrations) stay,
 * which is why this is an explicit list rather than AsyncStorage.clear().
 */
const RESET_KEYS: readonly string[] = [
  StorageKeys.PROFILE,
  StorageKeys.ONBOARDED,
  StorageKeys.SEED_EXECUTED,
  StorageKeys.RECENT_SEARCHES,
  StorageKeys.UPSELL_DISMISSED_AT,
  StorageKeys.BACKUP_PROMPT_DISMISSED_AT,
  StorageKeys.WALKTHROUGH_DASHBOARD,
  StorageKeys.WALKTHROUGH_CATEGORIES,
  StorageKeys.WALKTHROUGH_ANALYTICS,
  StorageKeys.WALKTHROUGH_ACCOUNTS,
  StorageKeys.WALKTHROUGH_TRANSACTIONS,
  StorageKeys.WALKTHROUGH_SEARCH,
  StorageKeys.WALKTHROUGH_TRANSACTION_CREATE,
  StorageKeys.WALKTHROUGH_PERSONS,
];

/** Erases every user record and preference, leaving the app as freshly installed. Throws on failure. */
export function useFactoryReset() {
  const queryClient = useQueryClient();
  const { disableLock } = useAppLock();

  return useCallback(async () => {
    await GoogleDriveService.signOut().catch(() => {});
    queryClient.clear();

    // Children before parents, in one transaction so a failure can't leave orphans behind.
    await db.transaction(async (tx) => {
      await tx.delete(payments);
      await tx.delete(loans);
      await tx.delete(persons);
      await tx.delete(categories);
      await tx.delete(accounts);
    });

    await AsyncStorage.multiRemove([...RESET_KEYS, ...BackupPreferences.allKeys()]);
    // A fresh install has no lock; keeping the old PIN would lock the user out of an empty app.
    await disableLock();
  }, [queryClient, disableLock]);
}
