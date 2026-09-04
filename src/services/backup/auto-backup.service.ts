import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getBackupState, updateBackupState } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';
import { NotificationService } from '../notification.service';

export type AutoBackupFrequency = 'off' | 'daily' | 'weekly' | 'monthly';

export const AUTO_BACKUP_STORAGE_KEYS = {
  ENABLED: '@fintraq_auto_backup_enabled',
  FREQUENCY: '@fintraq_auto_backup_frequency',
  LAST_BACKUP_META: '@fintraq_last_backup_meta',
  LAST_AUTO_BACKUP_TIME: '@fintraq_last_auto_backup_time',
} as const;

export const AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS: Record<AutoBackupFrequency, number> = {
  off: Infinity,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export async function resolveAutoBackupFrequency(): Promise<AutoBackupFrequency> {
  const [autoVal, autoFreqVal] = await Promise.all([
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.ENABLED),
    AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.FREQUENCY),
  ]);

  if (autoFreqVal === 'daily' || autoFreqVal === 'weekly' || autoFreqVal === 'monthly') {
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
export async function runAutoBackupIfDue(): Promise<AutoBackupResult> {
  const frequency = await resolveAutoBackupFrequency();
  if (frequency === 'off') return { outcome: 'skipped' };

  const currentUser = await GoogleDriveService.getCurrentUser();
  if (!currentUser) return { outcome: 'skipped' };

  const lastAutoTimeStr = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME);
  const now = Date.now();
  const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
  const threshold = AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS[frequency];

  // Synchronous check-then-set against the shared in-memory state — atomic
  // across every consumer in this JS runtime (React components and this
  // module both import the same singleton from backup-state.ts), since
  // there's no `await` between reading and setting isBackingUp.
  if (now - lastAutoTime < threshold || getBackupState().isBackingUp) {
    return { outcome: 'skipped' };
  }

  const isBackground = AppState.currentState !== 'active';
  if (isBackground) {
    NotificationService.presentBackupStartNotification();
  }

  try {
    updateBackupState({ isBackingUp: true, progress: 10, progressStage: 'Auto-backing up...' });

    const payloadStr = await DatabaseBackupService.exportBackupData();
    updateBackupState({ progress: 50, progressStage: 'Uploading background backup...' });

    const latestFile = await GoogleDriveService.findLatestBackup();
    const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, latestFile?.id, (frac) => {
      updateBackupState({ progress: 50 + Math.round(frac * 45), progressStage: `Uploading... ${Math.round(frac * 100)}%` });
    });

    updateBackupState({ progress: 100, progressStage: 'Backup complete!' });

    await Promise.all([
      AsyncStorage.setItem(AUTO_BACKUP_STORAGE_KEYS.LAST_BACKUP_META, JSON.stringify(uploadedFile)),
      AsyncStorage.setItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME, String(now)),
    ]);

    if (isBackground) {
      NotificationService.presentBackupCompleteNotification();
    }
    return { outcome: 'ran', meta: uploadedFile };
  } catch (err) {
    console.warn('[AutoBackupService] Background auto-backup warning:', err);
    if (isBackground) {
      NotificationService.presentBackupFailedNotification();
    }
    return { outcome: 'failed' };
  } finally {
    setTimeout(() => {
      updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
    }, 1000);
  }
}
