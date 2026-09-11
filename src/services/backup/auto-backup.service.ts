import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getBackupState, updateBackupState } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';
import { NotificationService } from '../notification.service';
import { ReviewPromptService } from '../review-prompt.service';
import { StorageKeys } from '../../constants/keys';

import { LoggerService } from '../logger.service';

export const AUTO_BACKUP_STORAGE_KEYS = {
  ENABLED: '@fintraq_auto_backup_enabled',
  LAST_BACKUP_META: '@fintraq_last_backup_meta',
  LAST_AUTO_BACKUP_TIME: '@fintraq_last_auto_backup_time',
} as const;

// Fixed schedule — no user-facing frequency choice. Prod cadence is every 24h;
// dev builds use 15min (WorkManager's floor) so background firing can be tested
// without an overnight wait.
export const AUTO_BACKUP_THRESHOLD_MS = __DEV__ ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;

async function isProUserActive(): Promise<boolean> {
  try {
    const [storedPremium, storedDev] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.PREMIUM),
      AsyncStorage.getItem(StorageKeys.PREMIUM_DEV_OVERRIDE),
    ]);

    if (storedDev === 'FORCED_ON') return true;
    if (storedDev === 'FORCED_OFF') return false;

    if (storedPremium) {
      const parsed = JSON.parse(storedPremium);
      return Boolean(parsed?.isPremium);
    }
  } catch (err) {
    LoggerService.error('AUTO_BACKUP', 'Failed to read pro status from storage', err);
  }
  return false;
}

export async function resolveAutoBackupEnabled(isPremiumOverride?: boolean): Promise<boolean> {
  const isPro = isPremiumOverride !== undefined ? isPremiumOverride : await isProUserActive();
  if (!isPro) return false;

  const autoVal = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.ENABLED);
  return autoVal === 'true';
}

export type AutoBackupResult =
  | { outcome: 'ran'; meta: CloudBackupFileMeta }
  | { outcome: 'skipped' | 'failed' };

/** Runs due auto-backup. Shared by foreground mount check and the headless background task. */
export async function runAutoBackupIfDue(force = false): Promise<AutoBackupResult> {
  const isBackground = AppState.currentState !== 'active';
  const tag = isBackground ? 'BACKGROUND' : 'FOREGROUND';
  const trigger = force ? 'dev_qa' : isBackground ? 'background_task' : 'auto_check';

  LoggerService.info('AUTO_BACKUP', `[${tag}] Checking auto-backup eligibility (force: ${force}, appState: ${AppState.currentState})`);

  const isPro = await isProUserActive();
  LoggerService.info('AUTO_BACKUP', `[${tag}] Pro status resolved: ${isPro}`);
  if (!isPro && !force) {
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: scheduled cloud auto-backup requires active Pro subscription`);
    await NotificationService.dismissBackupNotification();
    return { outcome: 'skipped' };
  }

  const enabled = await resolveAutoBackupEnabled();
  LoggerService.info('AUTO_BACKUP', `[${tag}] Resolved enabled: ${enabled}`);
  if (!enabled && !force) {
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: feature disabled in settings`);
    await NotificationService.dismissBackupNotification();
    return { outcome: 'skipped' };
  }

  const currentUser = await GoogleDriveService.getCurrentUser();
  if (!currentUser) {
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: no signed-in Google user`);
    await NotificationService.dismissBackupNotification();
    return { outcome: 'skipped' };
  }
  LoggerService.info('AUTO_BACKUP', `[${tag}] Active Google account: ${currentUser.email}`);

  const lastAutoTimeStr = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME);
  const now = Date.now();
  const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
  const effectiveThreshold = Math.max(0, AUTO_BACKUP_THRESHOLD_MS - 5_000);

  if (!force && (now - lastAutoTime < effectiveThreshold || getBackupState().isBackingUp)) {
    const elapsedSec = Math.round((now - lastAutoTime) / 1000);
    const thresholdSec = Math.round(AUTO_BACKUP_THRESHOLD_MS / 1000);
    LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: threshold not reached (${elapsedSec}s / ${thresholdSec}s, backingUp: ${getBackupState().isBackingUp})`);
    await NotificationService.dismissBackupNotification();
    return { outcome: 'skipped' };
  }

  LoggerService.info('AUTO_BACKUP', `[${tag}] Starting cloud auto-backup sync (trigger: ${trigger})`);

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
