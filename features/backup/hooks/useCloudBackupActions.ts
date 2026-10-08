import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { BackupPreferences } from '@/platform/backup/backup-preferences';
import type { CloudBackupFileMeta } from '@/platform/backup/backup.types';
import { runCloudBackup } from '@/platform/backup/cloud-backup';
import { runCloudRestore } from '@/platform/backup/cloud-restore';
import {
  CloudBackupProRequiredError,
} from '@/platform/drive/google-drive.errors';
import { ReviewPromptService } from '@/platform/config/review-prompt';


/**
 * User-initiated backup and restore. Progress is read separately via useBackupProgress, and the
 * latest-backup cache updates itself from the shared state when either succeeds.
 */
export function useCloudBackupActions() {
  const queryClient = useQueryClient();

  const backup = useMutation({
    retry: false,
    mutationFn: async (): Promise<CloudBackupFileMeta> => {
      if (!(await BackupPreferences.isProEntitled())) throw new CloudBackupProRequiredError();
      // An error keeps its type on the way out: the screen picks the words from what went wrong (see `failureOf`).
      return runCloudBackup({
        trigger: 'manual',
        // In the foreground the screen shows its own notice; a notification would duplicate it.
        notifyOnFailure: AppState.currentState !== 'active',
      });
    },
    // A successful backup is a real trust moment — ask for a review here rather than on a
    // random screen mount. No-ops after the first ask or before day 2 (see ReviewPromptService).
    onSuccess: () => void ReviewPromptService.maybeRequestReview(),
  });

  const restore = useMutation({
    retry: false,
    mutationFn: async (): Promise<CloudBackupFileMeta> => {
      if (!(await BackupPreferences.isProEntitled())) throw new CloudBackupProRequiredError();
      return runCloudRestore();
    },
    // Every cached query now describes data that no longer exists.
    onSuccess: () => queryClient.clear(),
  });

  return {
    backupNow: backup.mutateAsync,
    restoreLatest: restore.mutateAsync,
  };
}
