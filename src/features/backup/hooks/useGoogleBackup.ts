import {
  AUTO_BACKUP_STORAGE_KEYS,
  AutoBackupFrequency,
  AutoBackupFrequencyEnum,
  resolveAutoBackupFrequency,
} from '@/src/services/backup/auto-backup.service';
import { getBackupState, SharedBackupState, subscribeToBackupState, updateBackupState } from '@/src/services/backup/backup-state';
import { DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import { GoogleDriveAuthError, isNoBackupError, NoBackupFoundError } from '@/src/services/backup/google-drive.errors';
import { CloudBackupFileMeta, GoogleDriveService, GoogleUserAccount } from '@/src/services/backup/google-drive.service';
import { NotificationService } from '@/src/services/notification.service';
import { ReviewPromptService } from '@/src/services/review-prompt.service';
import { registerBackgroundBackupTaskAsync } from '@/src/services/backup/background-backup.task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { LoggerService } from '@/src/services/logger.service';
import { usePremium } from '@/src/providers/PremiumProvider';

export type { AutoBackupFrequency };

const STORAGE_KEY_AUTO_BACKUP = AUTO_BACKUP_STORAGE_KEYS.ENABLED;
const STORAGE_KEY_AUTO_BACKUP_FREQ = AUTO_BACKUP_STORAGE_KEYS.FREQUENCY;
const STORAGE_KEY_LAST_BACKUP_META = AUTO_BACKUP_STORAGE_KEYS.LAST_BACKUP_META;
const STORAGE_KEY_LAST_AUTO_BACKUP_TIME = AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME;

export type UseGoogleBackupReturn = {
  user: GoogleUserAccount | null;
  isConnected: boolean;
  isChecking: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  progress: number;
  progressStage: string | null;
  lastBackup: CloudBackupFileMeta | null;
  autoBackupEnabled: boolean;
  autoBackupFrequency: AutoBackupFrequency;
  connectAccount: () => Promise<GoogleUserAccount | null>;
  disconnectAccount: () => Promise<void>;
  performBackup: (options?: { silent?: boolean }) => Promise<boolean>;
  performRestore: () => Promise<boolean>;
  setAutoBackupFrequency: (freq: AutoBackupFrequency) => Promise<void>;
  toggleAutoBackup: (value: boolean) => Promise<void>;
  refreshBackupInfo: () => Promise<void>;
};

export function useGoogleBackup(): UseGoogleBackupReturn {
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();
  const [user, setUser] = useState<GoogleUserAccount | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [backupSyncState, setBackupSyncState] = useState<SharedBackupState>(getBackupState());
  const [lastBackup, setLastBackup] = useState<CloudBackupFileMeta | null>(null);
  const [rawAutoBackupFrequency, setAutoBackupFrequencyState] = useState<AutoBackupFrequency>('off');

  const autoBackupFrequency: AutoBackupFrequency = isPremium ? rawAutoBackupFrequency : AutoBackupFrequencyEnum.OFF;
  const autoBackupEnabled: boolean = isPremium && autoBackupFrequency !== AutoBackupFrequencyEnum.OFF;

  // Subscribe component to shared backup state updates
  useEffect(() => {
    return subscribeToBackupState(() => setBackupSyncState(getBackupState()));
  }, []);

  // Load active user, auto-backup setting, and cached backup metadata on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      let currentUser: GoogleUserAccount | null = null;
      try {
        currentUser = await GoogleDriveService.getCurrentUser();
        if (isMounted && currentUser) {
          setUser(currentUser);
        }

        const [resolvedFreq, cachedMetaStr] = await Promise.all([
          resolveAutoBackupFrequency(isPremium),
          AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP_META),
        ]);

        if (isMounted) {
          setAutoBackupFrequencyState(isPremium ? resolvedFreq : 'off');

          if (cachedMetaStr) {
            try {
              setLastBackup(JSON.parse(cachedMetaStr));
            } catch {
              // Ignore corrupted cached metadata
            }
          }
        }

        // Fetch remote backup meta in background without blocking initial UI render
        if (isMounted && currentUser) {
          try {
            const backupMeta = await GoogleDriveService.findLatestBackup();
            if (isMounted && backupMeta) {
              setLastBackup(backupMeta);
              await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
            }
          } catch (e: any) {
            if (e instanceof GoogleDriveAuthError || e?.name === 'GoogleDriveAuthError') {
              LoggerService.info('GOOGLE_BACKUP', 'Google Drive session expired. Re-authentication required.');
              if (isMounted) {
                setUser(null);
                setLastBackup(null);
              }
              await AsyncStorage.removeItem(STORAGE_KEY_LAST_BACKUP_META);
            } else {
              LoggerService.warn('GOOGLE_BACKUP', 'Background backup check failed', e);
            }
          }
        }
      } catch (e) {
        LoggerService.warn('GOOGLE_BACKUP', 'Initialization on mount failed', e);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isPremium]);

  const refreshBackupInfo = useCallback(async () => {
    if (!user) return;
    try {
      const backupMeta = await GoogleDriveService.findLatestBackup();
      if (backupMeta) {
        setLastBackup(backupMeta);
        await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
      }
    } catch (e: any) {
      if (e instanceof GoogleDriveAuthError || e?.name === 'GoogleDriveAuthError') {
        LoggerService.info('GOOGLE_BACKUP', 'Refresh check: Google Drive session expired.');
        setUser(null);
        setLastBackup(null);
        await AsyncStorage.removeItem(STORAGE_KEY_LAST_BACKUP_META);
      } else {
        LoggerService.warn('GOOGLE_BACKUP', 'Failed to refresh backup info', e);
      }
    }
  }, [user]);

  const setAutoBackupFrequency = useCallback(async (freq: AutoBackupFrequency) => {
    try {
      if (freq !== AutoBackupFrequencyEnum.OFF && !isPremium) {
        LoggerService.info('GOOGLE_BACKUP', 'Skipped frequency change: auto-backup requires active Pro subscription');
        return;
      }
      if (freq !== AutoBackupFrequencyEnum.OFF) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          LoggerService.info('GOOGLE_BACKUP', 'Auto-backup enabled but notification permission was denied by user');
        }
      }
      setAutoBackupFrequencyState(freq);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP_FREQ, freq),
        AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP, freq !== AutoBackupFrequencyEnum.OFF ? 'true' : 'false'),
      ]);
      await registerBackgroundBackupTaskAsync();
    } catch (e) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to save auto-backup frequency', e);
    }
  }, [isPremium]);

  const connectAccount = useCallback(async (): Promise<GoogleUserAccount | null> => {
    if (isChecking) return user;
    try {
      setIsChecking(true);
      const signedInUser = await GoogleDriveService.signIn();
      setUser(signedInUser);
      if (signedInUser) {
        // Enable automated daily cloud backups upon connecting Google Drive only if Pro user
        await setAutoBackupFrequency(isPremium ? AutoBackupFrequencyEnum.DAILY : AutoBackupFrequencyEnum.OFF);

        const backupMeta = await GoogleDriveService.findLatestBackup();
        if (backupMeta) {
          setLastBackup(backupMeta);
          await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
        }
      }
      return signedInUser;
    } catch (e: any) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to connect Google account', e);
      throw new Error(e?.message || 'Failed to connect Google Account.');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, user, isPremium, setAutoBackupFrequency]);

  const disconnectAccount = useCallback(async () => {
    try {
      await GoogleDriveService.signOut();
      setUser(null);
      setLastBackup(null);
      await AsyncStorage.removeItem(STORAGE_KEY_LAST_BACKUP_META);
    } catch (e: any) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to disconnect Google account', e);
      throw new Error(e?.message || 'Failed to disconnect Google Account.');
    }
  }, []);

  const performBackup = useCallback(async (options?: { silent?: boolean }): Promise<boolean> => {
    if (getBackupState().isBackingUp || getBackupState().isRestoring) {
      if (!options?.silent) {
        throw new Error('A backup or restore is already in progress.');
      }
      return false;
    }

    const activeUser = user || (await GoogleDriveService.getCurrentUser());
    if (!activeUser) {
      if (!options?.silent) {
        throw new Error('Please sign in to your Google Account to perform a backup.');
      }
      return false;
    }

    const isBackground = AppState.currentState !== 'active' || options?.silent;
    if (isBackground) {
      NotificationService.presentBackupStartNotification();
    }

    try {
      updateBackupState({ isBackingUp: true, progress: 5, progressStage: 'Preparing workspace snapshot...' });
      NotificationService.presentBackupProgressNotification(5, 'Preparing workspace snapshot...');

      const payloadStr = await DatabaseBackupService.exportBackupData();

      updateBackupState({ progress: 25, progressStage: 'Uploading backup...' });
      NotificationService.presentBackupProgressNotification(25, 'Uploading to Google Drive...');

      const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, lastBackup?.id, (fraction: number) => {
        const p = 25 + Math.round(fraction * 65);
        const stage = `Uploading to Google Drive... ${Math.round(fraction * 100)}%`;
        updateBackupState({
          progress: p,
          progressStage: stage,
        });
        NotificationService.presentBackupProgressNotification(p, stage);
      });

      updateBackupState({ progress: 95, progressStage: 'Finalizing backup...' });

      setLastBackup(uploadedFile);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(uploadedFile)),
        AsyncStorage.setItem(STORAGE_KEY_LAST_AUTO_BACKUP_TIME, String(Date.now())),
      ]);

      updateBackupState({ progress: 100, progressStage: 'Backup complete!' });

      NotificationService.presentBackupCompleteNotification();

      // A successful cloud backup is a real trust moment — ask for a review
      // here rather than on a random screen mount. No-ops after 1st ever ask
      // or before day 2 since install (see ReviewPromptService).
      ReviewPromptService.maybeRequestReview();
      return true;
    } catch (e: any) {
      LoggerService.warn('GOOGLE_BACKUP', 'Backup failed', e);
      NotificationService.presentBackupFailedNotification();
      if (e instanceof GoogleDriveAuthError || e?.name === 'GoogleDriveAuthError') {
        setUser(null);
      }
      if (!options?.silent) {
        if (e instanceof GoogleDriveAuthError || e?.name === 'GoogleDriveAuthError') {
          throw new Error('Google Drive session expired. Please sign in again.');
        }
        throw new Error('Could not save backup to Google Drive. Please check your internet connection.');
      }
      return false;
    } finally {
      setTimeout(() => {
        updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
        NotificationService.dismissBackupNotification();
      }, 3000);
    }
  }, [user, lastBackup?.id]);

  const performRestore = useCallback(async (): Promise<boolean> => {
    if (getBackupState().isBackingUp || getBackupState().isRestoring) {
      throw new Error('A backup or restore is already in progress.');
    }

    const activeUser = user || (await GoogleDriveService.getCurrentUser());
    if (!activeUser) {
      throw new Error('Please sign in to your Google Account to restore data.');
    }

    try {
      updateBackupState({ isRestoring: true, progress: 5, progressStage: 'Locating backup...' });

      // Always query Google Drive directly for the latest remote backup file
      const targetBackup = await GoogleDriveService.findLatestBackup();

      if (!targetBackup?.id) {
        throw new NoBackupFoundError();
      }

      updateBackupState({ progress: 15, progressStage: 'Downloading backup...' });

      const backupJsonStr = await GoogleDriveService.downloadBackup(targetBackup.id, (fraction) => {
        updateBackupState({
          progress: 15 + Math.round(fraction * 60),
          progressStage: `Downloading backup... ${Math.round(fraction * 100)}%`,
        });
      });

      if (!backupJsonStr || backupJsonStr.trim().length === 0) {
        throw new Error('Downloaded backup file is empty or corrupted.');
      }

      updateBackupState({ progress: 80, progressStage: 'Restoring data...' });

      await DatabaseBackupService.restoreBackupData(backupJsonStr, queryClient);

      // Save user session & enable automated daily backup by default on successful restore (if Pro)
      setUser(activeUser);
      setLastBackup(targetBackup);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(targetBackup)),
        setAutoBackupFrequency(isPremium ? AutoBackupFrequencyEnum.DAILY : AutoBackupFrequencyEnum.OFF),
      ]);

      updateBackupState({ progress: 100, progressStage: 'Restore complete!' });
      return true;
    } catch (e: any) {
      if (isNoBackupError(e)) {
        LoggerService.info('GOOGLE_BACKUP', 'No backup file found on Google Drive');
        throw e;
      }
      if (e instanceof GoogleDriveAuthError || e?.name === 'GoogleDriveAuthError') {
        setUser(null);
        throw new Error('Google Drive session expired. Please sign in again.');
      }
      LoggerService.warn('GOOGLE_BACKUP', 'Restore failed', e);
      throw e;
    } finally {
      setTimeout(() => {
        updateBackupState({ isRestoring: false, progress: 0, progressStage: null });
      }, 1000);
    }
  }, [user, queryClient, isPremium, setAutoBackupFrequency]);

  const toggleAutoBackup = useCallback(async (value: boolean) => {
    const nextFreq: AutoBackupFrequency = (value && isPremium) ? AutoBackupFrequencyEnum.DAILY : AutoBackupFrequencyEnum.OFF;
    await setAutoBackupFrequency(nextFreq);
  }, [isPremium, setAutoBackupFrequency]);

  return {
    user,
    isConnected: !!user,
    isChecking,
    isBackingUp: backupSyncState.isBackingUp,
    isRestoring: backupSyncState.isRestoring,
    progress: backupSyncState.progress,
    progressStage: backupSyncState.progressStage,
    lastBackup,
    autoBackupEnabled,
    autoBackupFrequency,
    connectAccount,
    disconnectAccount,
    performBackup,
    performRestore,
    setAutoBackupFrequency,
    toggleAutoBackup,
    refreshBackupInfo,
  };
}
