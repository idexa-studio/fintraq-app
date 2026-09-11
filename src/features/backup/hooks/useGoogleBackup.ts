import { resolveAutoBackupEnabled } from '@/src/services/backup/auto-backup.service';
import { getBackupState, SharedBackupState, subscribeToBackupState, updateBackupState } from '@/src/services/backup/backup-state';
import { DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import { CloudBackupProRequiredError, GoogleDriveAuthError, isNoBackupError, NoBackupFoundError } from '@/src/services/backup/google-drive.errors';
import { CloudBackupFileMeta, GoogleDriveService, GoogleUserAccount } from '@/src/services/backup/google-drive.service';
import { NotificationService } from '@/src/services/notification.service';
import { ReviewPromptService } from '@/src/services/review-prompt.service';
import { registerBackgroundBackupTaskAsync } from '@/src/services/backup/background-backup.task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { LoggerService } from '@/src/services/logger.service';
import { usePremium } from '@/src/providers/PremiumProvider';
import { StorageKeys } from '@/src/constants/keys';

const STORAGE_KEY_AUTO_BACKUP = StorageKeys.AUTO_BACKUP_ENABLED;
const STORAGE_KEY_LAST_BACKUP_META = StorageKeys.AUTO_BACKUP_LAST_BACKUP_META;
const STORAGE_KEY_LAST_AUTO_BACKUP_TIME = StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME;
const STORAGE_KEY_BATTERY_PROMPT_SHOWN = StorageKeys.AUTO_BACKUP_BATTERY_PROMPT_SHOWN;

export type SetAutoBackupResult = {
  blockedByNotifications: boolean;
  showBatteryPrompt: boolean;
};

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
  connectAccount: () => Promise<GoogleUserAccount | null>;
  disconnectAccount: () => Promise<void>;
  performBackup: (options?: { silent?: boolean }) => Promise<boolean>;
  performRestore: () => Promise<boolean>;
  setAutoBackupEnabled: (value: boolean) => Promise<SetAutoBackupResult>;
  toggleAutoBackup: (value: boolean) => Promise<SetAutoBackupResult>;
  refreshBackupInfo: () => Promise<void>;
};

export function useGoogleBackup(): UseGoogleBackupReturn {
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();
  const [user, setUser] = useState<GoogleUserAccount | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [backupSyncState, setBackupSyncState] = useState<SharedBackupState>(getBackupState());
  const [lastBackup, setLastBackup] = useState<CloudBackupFileMeta | null>(null);
  const [rawAutoBackupEnabled, setAutoBackupEnabledState] = useState(false);

  const autoBackupEnabled: boolean = isPremium && rawAutoBackupEnabled;

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

        const [resolvedEnabled, cachedMetaStr] = await Promise.all([
          resolveAutoBackupEnabled(isPremium),
          AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP_META),
        ]);

        if (isMounted) {
          setAutoBackupEnabledState(isPremium && resolvedEnabled);

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

  const setAutoBackupEnabled = useCallback(async (value: boolean): Promise<SetAutoBackupResult> => {
    const noPrompts: SetAutoBackupResult = { blockedByNotifications: false, showBatteryPrompt: false };
    try {
      if (value && !isPremium) {
        LoggerService.info('GOOGLE_BACKUP', 'Skipped enabling auto-backup: requires active Pro subscription');
        return noPrompts;
      }

      const isFirstEnable = !rawAutoBackupEnabled && value;

      // Notifications are required, not advisory, for auto-backup — same hard gate the
      // daily reminder toggle already uses (SettingsScreen.tsx handleToggleReminders):
      // deny permission, nothing gets enabled.
      if (value) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          LoggerService.info('GOOGLE_BACKUP', 'Auto-backup not enabled: notification permission denied');
          return { blockedByNotifications: true, showBatteryPrompt: false };
        }
      }

      setAutoBackupEnabledState(value);
      LoggerService.info('GOOGLE_BACKUP', `Updated auto-backup enabled: ${value}`);
      await AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP, value ? 'true' : 'false');
      await registerBackgroundBackupTaskAsync();

      let showBatteryPrompt = false;
      if (isFirstEnable && Platform.OS === 'android') {
        const alreadyShown = await AsyncStorage.getItem(STORAGE_KEY_BATTERY_PROMPT_SHOWN);
        if (!alreadyShown) {
          showBatteryPrompt = true;
          await AsyncStorage.setItem(STORAGE_KEY_BATTERY_PROMPT_SHOWN, 'true');
        }
      }

      return { blockedByNotifications: false, showBatteryPrompt };
    } catch (e) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to save auto-backup setting', e);
      return noPrompts;
    }
  }, [isPremium, rawAutoBackupEnabled]);

  const connectAccount = useCallback(async (): Promise<GoogleUserAccount | null> => {
    if (!isPremium) throw new CloudBackupProRequiredError();
    if (isChecking) return user;
    try {
      setIsChecking(true);
      const signedInUser = await GoogleDriveService.signIn();
      setUser(signedInUser);
      if (signedInUser) {
        LoggerService.info('GOOGLE_BACKUP', `Connected Google Account: ${signedInUser.email}`);

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
  }, [isChecking, user, isPremium]);

  const disconnectAccount = useCallback(async () => {
    try {
      await GoogleDriveService.signOut();
      setUser(null);
      setLastBackup(null);
      await AsyncStorage.removeItem(STORAGE_KEY_LAST_BACKUP_META);
      LoggerService.info('GOOGLE_BACKUP', 'Disconnected Google Account and cleared local backup cache');
    } catch (e: any) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to disconnect Google account', e);
      throw new Error(e?.message || 'Failed to disconnect Google Account.');
    }
  }, []);

  const performBackup = useCallback(async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!isPremium) {
      if (!options?.silent) throw new CloudBackupProRequiredError();
      return false;
    }

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
  }, [user, lastBackup?.id, isPremium]);

  const performRestore = useCallback(async (): Promise<boolean> => {
    if (!isPremium) throw new CloudBackupProRequiredError();

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

      setUser(activeUser);
      setLastBackup(targetBackup);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(targetBackup));

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
  }, [user, queryClient, isPremium]);

  const toggleAutoBackup = useCallback(async (value: boolean) => {
    return setAutoBackupEnabled(value && isPremium);
  }, [isPremium, setAutoBackupEnabled]);

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
    connectAccount,
    disconnectAccount,
    performBackup,
    performRestore,
    setAutoBackupEnabled,
    toggleAutoBackup,
    refreshBackupInfo,
  };
}
