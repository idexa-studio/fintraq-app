import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getBackupState, updateBackupState } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';
import { NotificationService } from '../notification.service';
import { ReviewPromptService } from '../review-prompt.service';

import { LoggerService } from '../logger.service';

export const AutoBackupFrequencyEnum = {
  OFF: 'off',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type AutoBackupFrequency = (typeof AutoBackupFrequencyEnum)[keyof typeof AutoBackupFrequencyEnum];

export const AUTO_BACKUP_STORAGE_KEYS = {
  ENABLED: '@fintraq_auto_backup_enabled',
  FREQUENCY: '@fintraq_auto_backup_frequency',
  LAST_BACKUP_META: '@fintraq_last_backup_meta',
  LAST_AUTO_BACKUP_TIME: '@fintraq_last_auto_backup_time',
} as const;

export const AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS: Record<AutoBackupFrequency, number> = {
  [AutoBackupFrequencyEnum.OFF]: Infinity,
  [AutoBackupFrequencyEnum.DAILY]: 24 * 60 * 60 * 1000,
  [AutoBackupFrequencyEnum.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
  [AutoBackupFrequencyEnum.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
};

export async function resolveAutoBackupFrequency(): Promise<AutoBackupFrequency> {
  const [autoVal, autoFreqVal] = await Promise.all([
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.ENABLED),
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.FREQUENCY),
  ]);

  if (
    autoFreqVal === AutoBackupFrequencyEnum.DAILY ||
    autoFreqVal === AutoBackupFrequencyEnum.WEEKLY ||
    autoFreqVal === AutoBackupFrequencyEnum.MONTHLY
  ) {
    return autoFreqVal;
  }
  if (autoVal === 'true') return AutoBackupFrequencyEnum.DAILY;
  return AutoBackupFrequencyEnum.OFF;
}

export const AUTO_BACKUP_FREQUENCIES: readonly AutoBackupFrequency[] = [
  AutoBackupFrequencyEnum.OFF,
  AutoBackupFrequencyEnum.DAILY,
  AutoBackupFrequencyEnum.WEEKLY,
  AutoBackupFrequencyEnum.MONTHLY,
] as const;

export type AutoBackupResult =
  | { outcome: 'ran'; meta: CloudBackupFileMeta }
  | { outcome: 'skipped' | 'failed' };

/** Runs due auto-backup. Shared by foreground mount check and the headless background task. */
export async function runAutoBackupIfDue(force = false): Promise<AutoBackupResult> {
  const isBackground = AppState.currentState !== 'active';
  const tag = isBackground ? 'BACKGROUND' : 'FOREGROUND';
  const trigger = force ? 'dev_qa' : isBackground ? 'background_task' : 'auto_check';

  const frequency = await resolveAutoBackupFrequency();
  if (frequency === AutoBackupFrequencyEnum.OFF && !force) {
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: feature disabled in settings`);
    return { outcome: 'skipped' };
  }

  const currentUser = await GoogleDriveService.getCurrentUser();
  if (!currentUser) {
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: no signed-in Google user`);
    return { outcome: 'skipped' };
  }

  const lastAutoTimeStr = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME);
  const now = Date.now();
  const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
  const threshold = AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS[frequency] ?? (15 * 60 * 1000);

  if (!force && (now - lastAutoTime < threshold || getBackupState().isBackingUp)) {
    const elapsedSec = Math.round((now - lastAutoTime) / 1000);
    const thresholdSec = Math.round(threshold / 1000);
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: threshold not reached (${elapsedSec}s / ${thresholdSec}s)`);
    return { outcome: 'skipped' };
  }

  LoggerService.info('AUTO_BACKUP', `[${tag}] Starting cloud auto-backup sync (trigger: ${trigger}, frequency: ${frequency})`);

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
    LoggerService.info('AUTO_BACKUP', `[${tag}] Completed and synced (fileId: ${uploadedFile.id}, size: ${uploadedFile.size})`);

    if (!isBackground) {
      // Review dialog needs a foreground screen, skip for headless task
      ReviewPromptService.maybeRequestReview();
    }
    return { outcome: 'ran', meta: uploadedFile };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    LoggerService.error('AUTO_BACKUP', `[${tag}] Failed: ${errorMsg}`);
    NotificationService.presentBackupFailedNotification();
    return { outcome: 'failed' };
  } finally {
    setTimeout(() => {
      updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
      NotificationService.dismissBackupNotification();
    }, 3000);
  }
}
