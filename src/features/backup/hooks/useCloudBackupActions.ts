import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import i18n from '@/shared/i18n';
import { usePremium } from '@/src/providers/PremiumProvider';
import type { CloudBackupFileMeta } from '@/src/services/backup/backup.types';
import { runCloudBackup } from '@/src/services/backup/cloud-backup.service';
import { runCloudRestore } from '@/src/services/backup/cloud-restore.service';
import {
  CloudBackupProRequiredError,
  isAuthError,
  isBackupInProgressError,
  isNoBackupError,
} from '@/src/services/backup/google-drive.errors';
import { ReviewPromptService } from '@/src/services/review-prompt.service';

/** Errors shown in-app: the ones with a specific remedy keep their meaning, the rest are generic. */
function toBackupError(error: unknown): unknown {
  if (isBackupInProgressError(error)) return new Error(i18n.t('backup.errInProgress'));
  if (isAuthError(error)) return new Error(i18n.t('backup.errSessionExpired'));
  return new Error(i18n.t('backup.errSaveDrive'));
}

function toRestoreError(error: unknown): unknown {
  if (isNoBackupError(error)) return error;
  if (isBackupInProgressError(error)) return new Error(i18n.t('backup.errInProgress'));
  if (isAuthError(error)) return new Error(i18n.t('backup.errSessionExpired'));
  return error;
}

/**
 * User-initiated backup and restore. Progress is read separately via useBackupProgress, and the
 * latest-backup cache updates itself from the shared state when either succeeds.
 */
export function useCloudBackupActions() {
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();

  const backup = useMutation({
    retry: false,
    mutationFn: async (): Promise<CloudBackupFileMeta> => {
      if (!isPremium) throw new CloudBackupProRequiredError();
      try {
        return await runCloudBackup({
          trigger: 'manual',
          // In the foreground the screen shows its own error alert; a notification would duplicate it.
          notifyOnFailure: AppState.currentState !== 'active',
        });
      } catch (e) {
        throw toBackupError(e);
      }
    },
    // A successful backup is a real trust moment — ask for a review here rather than on a
    // random screen mount. No-ops after the first ask or before day 2 (see ReviewPromptService).
    onSuccess: () => void ReviewPromptService.maybeRequestReview(),
  });

  const restore = useMutation({
    retry: false,
    mutationFn: async (): Promise<CloudBackupFileMeta> => {
      if (!isPremium) throw new CloudBackupProRequiredError();
      try {
        return await runCloudRestore();
      } catch (e) {
        throw toRestoreError(e);
      }
    },
    // Every cached query now describes data that no longer exists.
    onSuccess: () => queryClient.clear(),
  });

  return {
    backupNow: backup.mutateAsync,
    restoreLatest: restore.mutateAsync,
  };
}
