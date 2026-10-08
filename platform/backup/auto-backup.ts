import { AppState } from 'react-native';
import { LoggerService } from '@/shared/logging/logger';
import { NotificationService } from '@/platform/notifications/notifications';
import { ReviewPromptService } from '@/platform/config/review-prompt';
import type { CloudBackupFileMeta } from './backup.types';
import { BackupPreferences } from './backup-preferences';
import { isBackupDue } from './backup-schedule';
import { isBackupBusy } from './backup-state';
import { runCloudBackup } from './cloud-backup';
import { isBackupInProgressError } from '@/platform/drive/google-drive.errors';
import { GoogleDriveService } from '@/platform/drive/google-drive';

export type AutoBackupSkipReason = 'not_pro' | 'disabled' | 'signed_out' | 'busy' | 'not_due' | 'unclaimed_backup';

export type AutoBackupResult =
  | { outcome: 'ran'; meta: CloudBackupFileMeta }
  | { outcome: 'skipped'; reason: AutoBackupSkipReason }
  | { outcome: 'failed'; error: unknown };

function skipped(tag: string, reason: AutoBackupSkipReason, detail = ''): AutoBackupResult {
  LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: ${reason}${detail ? ` (${detail})` : ''}`);
  // Clears a sticky "syncing" notification left behind if the OS killed a previous run mid-upload.
  // Never while busy: that notification belongs to the run in progress.
  if (reason !== 'busy') void NotificationService.dismissBackupNotification();
  return { outcome: 'skipped', reason };
}

/**
 * Runs the auto-backup if it's due. The single policy entry point for the foreground checks
 * (launch, resume, backgrounding) and the headless OS task. `force` bypasses gating for QA.
 */
export async function runAutoBackupIfDue(force = false): Promise<AutoBackupResult> {
  const isBackground = AppState.currentState !== 'active';
  const tag = isBackground ? 'BACKGROUND' : 'FOREGROUND';
  LoggerService.info('AUTO_BACKUP', `[${tag}] Checking (force: ${force}, appState: ${AppState.currentState})`);

  if (!force) {
    if (!(await BackupPreferences.isProEntitled())) return skipped(tag, 'not_pro');
    if (!(await BackupPreferences.isAutoBackupSwitchOn())) return skipped(tag, 'disabled');
  }
  if (isBackupBusy()) return skipped(tag, 'busy');

  if (!force) {
    const lastBackupAt = await BackupPreferences.getLastBackupAt();
    if (!isBackupDue(lastBackupAt, Date.now())) {
      return skipped(tag, 'not_due', `last ${Math.round((Date.now() - lastBackupAt) / 60_000)}min ago`);
    }
  }

  const account = await GoogleDriveService.getCurrentUser();
  if (!account) return skipped(tag, 'signed_out');

  // A fresh install that hasn't restored would replace the only copy of the user's history with
  // an empty ledger. Leave that backup alone until they restore it or back up by hand.
  if (!force && !(await BackupPreferences.hasSyncedWithDrive())) {
    try {
      const remote = await GoogleDriveService.findLatestBackup();
      if (remote && !(await BackupPreferences.isOwnBackup(remote.id))) return skipped(tag, 'unclaimed_backup');
    } catch (error) {
      return { outcome: 'failed', error };
    }
  }

  LoggerService.info('AUTO_BACKUP', `[${tag}] Starting auto-backup`);
  try {
    const meta = await runCloudBackup({
      trigger: force ? 'dev_qa' : isBackground ? 'auto_background' : 'auto_foreground',
    });
    // The review dialog needs a foreground screen.
    if (!isBackground) void ReviewPromptService.maybeRequestReview();
    return { outcome: 'ran', meta };
  } catch (error) {
    // Lost a race for the operation slot between the busy check and starting — not a failure.
    if (isBackupInProgressError(error)) return skipped(tag, 'busy');
    return { outcome: 'failed', error };
  }
}
