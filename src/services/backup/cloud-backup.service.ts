import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/src/constants/keys';
import i18n from '@/src/i18n';
import { LoggerService } from '@/src/services/logger.service';
import { NotificationService } from '@/src/services/notification.service';
import { BackupLock } from './backup-lock';
import { getBackupState, updateBackupState } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { BackupInProgressError } from './google-drive.errors';
import { isTransientDriveError } from './google-drive.http';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';

export type CloudBackupTrigger = 'manual' | 'auto_foreground' | 'auto_background' | 'dev_qa';

export type CloudBackupOptions = {
  trigger: CloudBackupTrigger;
  /** Drive file id from cached metadata — skips a lookup; a stale id self-heals on 404. */
  knownFileId?: string;
  /** Post the failure notification. Off when the caller shows its own in-app error. */
  notifyOnFailure?: boolean;
};

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 3_000;
const COMPLETE_NOTIFICATION_DISMISS_MS = 3_000;
// Android rate-limits notification updates per app and silently drops the excess — which can
// include the final "complete" update. Only repost when progress moves meaningfully.
const NOTIFICATION_PROGRESS_STEP = 5;

const PROGRESS = {
  preparing: 5,
  uploadStart: 25,
  uploadSpan: 65,
  finalizing: 95,
  complete: 100,
} as const;

let inFlight: Promise<CloudBackupFileMeta> | null = null;

export function isCloudBackupRunning(): boolean {
  return inFlight !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createProgressReporter() {
  let lastNotified = -NOTIFICATION_PROGRESS_STEP;
  let lastState = -1;
  return (progress: number, stage: string, force = false) => {
    const rounded = Math.round(progress);
    if (force || rounded !== lastState) {
      lastState = rounded;
      updateBackupState({ progress: rounded, progressStage: stage });
    }
    if (force || rounded - lastNotified >= NOTIFICATION_PROGRESS_STEP) {
      lastNotified = rounded;
      void NotificationService.presentBackupProgressNotification(rounded, stage);
    }
  };
}

async function uploadWithRetry(
  payload: string,
  knownFileId: string | undefined,
  report: ReturnType<typeof createProgressReporter>,
  tag: string,
): Promise<CloudBackupFileMeta> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await GoogleDriveService.uploadBackup(payload, knownFileId, (fraction) => {
        const pct = Math.round(fraction * 100);
        report(PROGRESS.uploadStart + fraction * PROGRESS.uploadSpan, i18n.t('backup.stageUploadingPct', { pct }));
      });
    } catch (e) {
      if (attempt >= MAX_ATTEMPTS || !isTransientDriveError(e)) throw e;
      LoggerService.info('CLOUD_BACKUP', `[${tag}] Transient upload failure, retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})`, e);
      report(PROGRESS.uploadStart, i18n.t('backup.stageUploadingDrive'), true);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function execute({ trigger, knownFileId, notifyOnFailure = true }: CloudBackupOptions): Promise<CloudBackupFileMeta> {
  const report = createProgressReporter();
  const tag = trigger.toUpperCase();
  const startedAt = Date.now();

  try {
    report(PROGRESS.preparing, i18n.t('backup.stagePreparing'), true);
    const payload = await DatabaseBackupService.exportBackupData();

    report(PROGRESS.uploadStart, i18n.t('backup.stageUploadingDrive'), true);
    const uploaded = await uploadWithRetry(payload, knownFileId, report, tag);

    report(PROGRESS.finalizing, i18n.t('backup.stageFinalizing'), true);
    await AsyncStorage.multiSet([
      [StorageKeys.AUTO_BACKUP_LAST_BACKUP_META, JSON.stringify(uploaded)],
      [StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME, String(startedAt)],
    ]);

    updateBackupState({ progress: PROGRESS.complete, progressStage: i18n.t('backup.stageComplete') });
    await NotificationService.presentBackupCompleteNotification();
    setTimeout(() => void NotificationService.dismissBackupNotification(), COMPLETE_NOTIFICATION_DISMISS_MS);

    LoggerService.info('CLOUD_BACKUP', `[${tag}] Completed (fileId: ${uploaded.id}, size: ${uploaded.size}, ${Date.now() - startedAt}ms)`);
    return uploaded;
  } catch (e) {
    LoggerService.error('CLOUD_BACKUP', `[${tag}] Failed after ${Date.now() - startedAt}ms`, e);
    if (notifyOnFailure) {
      // Don't auto-dismiss — a failure the user never saw isn't a handled failure.
      await NotificationService.presentBackupFailedNotification();
    } else {
      await NotificationService.dismissBackupNotification();
    }
    throw e;
  } finally {
    updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
  }
}

/**
 * The one backup pipeline, shared by the Backup screen, the foreground auto-check and the
 * headless background task. Single-flight: overlapping callers (e.g. an AppState change racing
 * the OS task) get a BackupInProgressError instead of a second concurrent upload.
 */
export function runCloudBackup(options: CloudBackupOptions): Promise<CloudBackupFileMeta> {
  if (inFlight || getBackupState().isBackingUp) {
    return Promise.reject(new BackupInProgressError());
  }
  if (BackupLock.isRestoring() || getBackupState().isRestoring) {
    return Promise.reject(new BackupInProgressError());
  }

  // Claim the slot synchronously, before the first await, so racing callers see it.
  updateBackupState({ isBackingUp: true });
  inFlight = execute(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Cached id of the last uploaded Drive file, if any. */
export async function getCachedBackupFileId(): Promise<string | undefined> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_LAST_BACKUP_META);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<CloudBackupFileMeta> | null;
    return typeof parsed?.id === 'string' && parsed.id ? parsed.id : undefined;
  } catch {
    return undefined;
  }
}
