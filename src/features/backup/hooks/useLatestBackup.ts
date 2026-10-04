import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import type { CloudBackupFileMeta } from '@/src/services/backup/backup.types';
import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import { getBackupState, subscribeToBackupState } from '@/src/services/backup/backup-state';
import { isTransientDriveError } from '@/src/services/backup/google-drive.errors';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import { LoggerService } from '@/src/services/logger.service';
import { useBackupAccount } from './useBackupAccount';

const STALE_MS = 5 * 60 * 1000;

/**
 * Drive is the source of truth; the persisted copy keeps the card meaningful offline.
 * Transient failures fall back to it, auth failures propagate (the session has been ended).
 */
async function fetchLatestBackup(): Promise<CloudBackupFileMeta | null> {
  try {
    const latest = await GoogleDriveService.findLatestBackup();
    if (latest) {
      await BackupPreferences.setCachedBackupMeta(latest);
    } else {
      // Nothing on Drive (e.g. the user wiped app data there): forget the stale copy so the
      // UI doesn't claim protection that no longer exists, and the next check backs up.
      await BackupPreferences.clearBackupCache();
    }
    return latest;
  } catch (e) {
    if (!isTransientDriveError(e)) throw e;
    LoggerService.info('GOOGLE_BACKUP', 'Drive unreachable, showing cached backup info', e);
    return BackupPreferences.getCachedBackupMeta();
  }
}

/** Metadata of the newest backup for the connected account; null when there is none. */
export function useLatestBackup() {
  const queryClient = useQueryClient();
  const { account } = useBackupAccount();
  const accountId = account?.id ?? null;

  const query = useQuery({
    queryKey: QUERY_KEYS.backup.latest(accountId ?? ''),
    queryFn: fetchLatestBackup,
    enabled: accountId !== null,
    staleTime: STALE_MS,
    // One Drive round-trip per resume is wasted work; completed runs push updates below.
    refetchOnWindowFocus: false,
    retry: false,
  });

  const latestBackup = query.data ?? null;
  const fileId = latestBackup?.id ?? null;

  const ownershipQuery = useQuery({
    queryKey: QUERY_KEYS.backup.ownership(accountId ?? '', fileId ?? ''),
    queryFn: () => BackupPreferences.isOwnBackup(fileId ?? ''),
    enabled: accountId !== null && fileId !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Any successful backup or restore — including auto-backups started outside React — carries
  // the new file metadata, so write it straight into the cache.
  useEffect(() => {
    if (!accountId) return;
    let seen = getBackupState().lastCompleted;
    return subscribeToBackupState(() => {
      const { lastCompleted } = getBackupState();
      if (lastCompleted && lastCompleted !== seen) {
        queryClient.setQueryData(QUERY_KEYS.backup.latest(accountId), lastCompleted.meta);
        queryClient.setQueryData(QUERY_KEYS.backup.ownership(accountId, lastCompleted.meta.id), true);
      }
      seen = lastCompleted;
    });
  }, [accountId, queryClient]);

  return {
    latestBackup,
    /**
     * Drive holds a backup this install has neither made nor restored. Auto-backup leaves it
     * alone; a manual backup must confirm before replacing it.
     */
    isFromAnotherInstall: latestBackup !== null && ownershipQuery.data === false,
    isLoading: accountId !== null && query.isPending,
  };
}
