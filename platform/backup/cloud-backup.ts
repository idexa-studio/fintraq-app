import i18n from '@/shared/i18n';
import { LoggerService } from '@/shared/logging/logger';
import { NotificationService } from '@/platform/notifications/notifications';
import type { CloudBackupFileMeta, CloudBackupTrigger } from './backup.types';
import { BackupPreferences } from './backup-preferences';
import { endOperation, reportProgress, tryBeginOperation } from './backup-state';
import { DatabaseBackupService } from './database-backup';
import { BackupInProgressError, isAuthError, isTransientDriveError } from '@/platform/drive/google-drive.errors';
import { GoogleDriveService } from '@/platform/drive/google-drive';

export type CloudBackupOptions = {
  trigger: CloudBackupTrigger;
  /** Post the failure notification. Off when the caller shows its own in-app error. */
  notifyOnFailure?: boolean;
};

const MAX_UPLOAD_ATTEMPTS = 2;
const RETRY_DELAY_MS = 3_000;
const COMPLETE_NOTIFICATION_DISMISS_MS = 3_000;
// Android rate-limits notification updates per app and silently drops the excess — which can
// include the final "complete" update. Only repost when progress moves meaningfully.
const NOTIFICATION_PROGRESS_STEP = 5;

const PROGRESS = { preparing: 5, uploadStart: 25, uploadSpan: 65, finalizing: 95, complete: 100 } as const;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Mirrors progress into shared state (every change) and the OS notification (throttled). */
function createProgressReporter() {
  let lastNotified = -NOTIFICATION_PROGRESS_STEP;
  return (progress: number, stage: string, forceNotify = false) => {
    reportProgress(progress, stage);
    const rounded = Math.round(progress);
    if (forceNotify || rounded - lastNotified >= NOTIFICATION_PROGRESS_STEP) {
      lastNotified = rounded;
      void NotificationService.presentBackupProgressNotification(rounded, stage);
    }
  };
}

type ProgressReporter = ReturnType<typeof createProgressReporter>;

/** Upload is idempotent (PATCH of one file), so a transient failure is worth one full retry. */
async function uploadWithRetry(payload: string, knownFileId: string | undefined, report: ProgressReporter, tag: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await GoogleDriveService.uploadBackup(payload, knownFileId, (fraction) => {
        const pct = Math.round(fraction * 100);
        report(PROGRESS.uploadStart + fraction * PROGRESS.uploadSpan, i18n.t('backup.stageUploadingPct', { pct }));
      });
    } catch (e) {
      if (attempt >= MAX_UPLOAD_ATTEMPTS || !isTransientDriveError(e)) throw e;
      LoggerService.info('CLOUD_BACKUP', `[${tag}] Transient upload failure, retrying (${attempt + 1}/${MAX_UPLOAD_ATTEMPTS})`, e);
      report(PROGRESS.uploadStart, i18n.t('backup.stageUploadingDrive'), true);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function execute({ trigger, notifyOnFailure = true }: CloudBackupOptions): Promise<CloudBackupFileMeta> {
  const report = createProgressReporter();
  const tag = trigger.toUpperCase();
  const startedAt = Date.now();
  let result: CloudBackupFileMeta | undefined;

  try {
    report(PROGRESS.preparing, i18n.t('backup.stagePreparing'), true);
    const [payload, cached] = await Promise.all([
      DatabaseBackupService.exportBackupData(),
      BackupPreferences.getCachedBackupMeta(),
    ]);

    report(PROGRESS.uploadStart, i18n.t('backup.stageUploadingDrive'), true);
    const uploaded = await uploadWithRetry(payload, cached?.id, report, tag);

    report(PROGRESS.finalizing, i18n.t('backup.stageFinalizing'), true);
    await BackupPreferences.recordSuccessfulBackup(uploaded, startedAt);
    reportProgress(PROGRESS.complete, i18n.t('backup.stageComplete'));

    await NotificationService.presentBackupCompleteNotification();
    setTimeout(() => void NotificationService.dismissBackupNotification(), COMPLETE_NOTIFICATION_DISMISS_MS);

    LoggerService.info('CLOUD_BACKUP', `[${tag}] Completed (fileId: ${uploaded.id}, size: ${uploaded.size}, ${Date.now() - startedAt}ms)`);
    result = uploaded;
    return uploaded;
  } catch (e) {
    LoggerService.error('CLOUD_BACKUP', `[${tag}] Failed after ${Date.now() - startedAt}ms`, e);
    if (isAuthError(e)) {
      // The session was ended; retrying can't help, so tell the user what will.
      await NotificationService.presentBackupReconnectNotification();
    } else if (notifyOnFailure) {
      // Don't auto-dismiss — a failure the user never saw isn't a handled failure.
      await NotificationService.presentBackupFailedNotification();
    } else {
      await NotificationService.dismissBackupNotification();
    }
    throw e;
  } finally {
    endOperation(result);
  }
}

/**
 * The one backup pipeline, shared by the Backup screen, the foreground auto-check and the
 * headless background task. Rejects with BackupInProgressError when a backup or restore already
 * holds the operation slot, so overlapping triggers never upload concurrently.
 */
export function runCloudBackup(options: CloudBackupOptions): Promise<CloudBackupFileMeta> {
  // Claimed synchronously — before any await — so racing callers can't both start.
  if (!tryBeginOperation('backup', i18n.t('backup.stagePreparing'))) {
    return Promise.reject(new BackupInProgressError());
  }
  return execute(options);
}
