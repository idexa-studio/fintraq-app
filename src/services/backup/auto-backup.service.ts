import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getBackupState, updateBackupState } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';
import { NotificationService } from '../notification.service';
import { ReviewPromptService } from '../review-prompt.service';

import { LoggerService } from '../logger.service';

export type AutoBackupFrequency = 'off' | 'daily' | 'weekly' | 'monthly' | '15min';

export const AUTO_BACKUP_STORAGE_KEYS = {
  ENABLED: '@fintraq_auto_backup_enabled',
  FREQUENCY: '@fintraq_auto_backup_frequency',
  LAST_BACKUP_META: '@fintraq_last_backup_meta',
  LAST_AUTO_BACKUP_TIME: '@fintraq_last_auto_backup_time',
} as const;

export const AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS: Record<AutoBackupFrequency, number> = {
  off: Infinity,
  '15min': 15 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export async function resolveAutoBackupFrequency(): Promise<AutoBackupFrequency> {
  const [autoVal, autoFreqVal] = await Promise.all([
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.ENABLED),
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.FREQUENCY),
  ]);

  if (autoFreqVal === '15min' || autoFreqVal === 'daily' || autoFreqVal === 'weekly' || autoFreqVal === 'monthly') {
    return autoFreqVal;
  }
  if (autoVal === 'true') return 'daily';
  return 'off';
}

export type AutoBackupResult =
  | { outcome: 'ran'; meta: CloudBackupFileMeta }
  | { outcome: 'skipped' | 'failed' };

/**
 * Check whether a scheduled auto-backup is due and, if so, run it. Shared by
 * both `useGoogleBackup`'s foreground mount check and the headless
 * background-backup task (`background-backup.task.ts`) — the logic is
 * identical either way, only who calls it differs. Safe to call from outside
 * React: uses no hooks, only plain services and AsyncStorage.
 */
export async function runAutoBackupIfDue(force = false): Promise<AutoBackupResult> {
  const isBackground = AppState.currentState !== 'active';
  const tag = isBackground ? 'BACKGROUND' : 'FOREGROUND';
  const trigger = force ? 'dev_qa' : isBackground ? 'background_task' : 'auto_check';

  const frequency = await resolveAutoBackupFrequency();
  if (frequency === 'off' && !force) {
    await LoggerService.info('AUTO_BACKUP', 'Auto-backup skipped: Feature disabled in settings', { frequency }, tag);
    return { outcome: 'skipped' };
  }

  const currentUser = await GoogleDriveService.getCurrentUser();
  if (!currentUser) {
    await LoggerService.info('AUTO_BACKUP', 'Auto-backup skipped: No signed-in Google user', undefined, tag);
    return { outcome: 'skipped' };
  }

  const lastAutoTimeStr = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME);
  const now = Date.now();
  const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
  const threshold = AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS[frequency] ?? (15 * 60 * 1000);

  // Auto-backup is strictly background-only: skip if app is currently active in foreground (unless force = true in Dev QA)
  if (AppState.currentState === 'active' && !force) {
    await LoggerService.info('AUTO_BACKUP', 'Auto-backup skipped: App active in foreground (background only)', undefined, 'FOREGROUND');
    return { outcome: 'skipped' };
  }

  if (!force && (now - lastAutoTime < threshold || getBackupState().isBackingUp)) {
    const elapsedSec = Math.round((now - lastAutoTime) / 1000);
    const thresholdSec = Math.round(threshold / 1000);
    await LoggerService.info('AUTO_BACKUP', `Auto-backup skipped: Threshold not reached (${elapsedSec}s / ${thresholdSec}s)`, { elapsedSec, thresholdSec }, tag);
    return { outcome: 'skipped' };
  }

  await LoggerService.info('AUTO_BACKUP', `Starting cloud auto-backup sync (Trigger: ${trigger})`, { trigger, frequency }, tag);

  NotificationService.presentBackupProgressNotification(10, 'Preparing database snapshot...');

  try {
    updateBackupState({ isBackingUp: true, progress: 10, progressStage: 'Preparing database snapshot...' });

    const payloadStr = await DatabaseBackupService.exportBackupData();
    updateBackupState({ progress: 35, progressStage: 'Uploading to Google Drive...' });
    NotificationService.presentBackupProgressNotification(35, 'Uploading to Google Drive...');

    const latestFile = await GoogleDriveService.findLatestBackup();
    const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, latestFile?.id, (frac) => {
      const p = 35 + Math.round(frac * 60);
      const stage = `Uploading to Google Drive... ${Math.round(frac * 100)}%`;
      updateBackupState({ progress: p, progressStage: stage });
      NotificationService.presentBackupProgressNotification(p, stage);
    });

    updateBackupState({ progress: 100, progressStage: 'Backup complete!' });

    await Promise.all([
      AsyncStorage.setItem(AUTO_BACKUP_STORAGE_KEYS.LAST_BACKUP_META, JSON.stringify(uploadedFile)),
      AsyncStorage.setItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME, String(now)),
    ]);

    NotificationService.presentBackupCompleteNotification();
    await LoggerService.info('AUTO_BACKUP', 'Cloud auto-backup successfully completed and synced', { fileSize: uploadedFile.size, fileId: uploadedFile.id }, tag);

    if (!isBackground) {
      // Native review dialogs need an active foreground screen — only ask
      // when this ran from the foreground mount check, never from the
      // headless background task.
      ReviewPromptService.maybeRequestReview();
    }
    return { outcome: 'ran', meta: uploadedFile };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await LoggerService.error('AUTO_BACKUP', `Cloud auto-backup failed: ${errorMsg}`, { error: errorMsg }, tag);
    NotificationService.presentBackupFailedNotification();
    return { outcome: 'failed' };
  } finally {
    setTimeout(() => {
      updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
      NotificationService.dismissBackupNotification();
    }, 3000);
  }
}
