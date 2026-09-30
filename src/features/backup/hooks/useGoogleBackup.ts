import { resolveAutoBackupEnabled } from '@/src/services/backup/auto-backup.service';
import { getBackupState, SharedBackupState, subscribeToBackupState, updateBackupState } from '@/src/services/backup/backup-state';
import { DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import { BackupInProgressError, CloudBackupProRequiredError, isAuthError, isNoBackupError, NoBackupFoundError } from '@/src/services/backup/google-drive.errors';
import { isCloudBackupRunning, runCloudBackup } from '@/src/services/backup/cloud-backup.service';
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
import i18n from '@/src/i18n';

const STORAGE_KEY_AUTO_BACKUP = StorageKeys.AUTO_BACKUP_ENABLED;
const STORAGE_KEY_LAST_BACKUP_META = StorageKeys.AUTO_BACKUP_LAST_BACKUP_META;
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
    let wasBackingUp = getBackupState().isBackingUp;
    return subscribeToBackupState(() => {
      const next = getBackupState();
      setBackupSyncState(next);
      // An auto-backup (not started from this hook) just finished — pick up its metadata.
      if (wasBackingUp && !next.isBackingUp) {
        AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP_META)
          .then((raw) => {
            if (raw) setLastBackup(JSON.parse(raw) as CloudBackupFileMeta);
          })
          .catch(() => {});
      }
      wasBackingUp = next.isBackingUp;
    });
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
          } catch (e) {
            if (isAuthError(e)) {
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
    } catch (e) {
      if (isAuthError(e)) {
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
    } catch (e) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to connect Google account', e);
      throw new Error(e instanceof Error && e.message ? e.message : i18n.t('backup.errConnect'));
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
    } catch (e) {
      LoggerService.warn('GOOGLE_BACKUP', 'Failed to disconnect Google account', e);
      throw new Error(e instanceof Error && e.message ? e.message : i18n.t('backup.errDisconnect'));
    }
  }, []);

  const performBackup = useCallback(async (options?: { silent?: boolean }): Promise<boolean> => {
    const silent = options?.silent ?? false;
    if (!isPremium) {
      if (!silent) throw new CloudBackupProRequiredError();
      return false;
    }

    if (isCloudBackupRunning() || getBackupState().isBackingUp || getBackupState().isRestoring) {
      if (!silent) throw new Error(i18n.t('backup.errInProgress'));
      return false;
    }

    const activeUser = user || (await GoogleDriveService.getCurrentUser());
    if (!activeUser) {
      if (!silent) throw new Error(i18n.t('backup.errSignInBackup'));
      return false;
    }

    const isForeground = AppState.currentState === 'active';
    try {
      const uploadedFile = await runCloudBackup({
        trigger: 'manual',
        knownFileId: lastBackup?.id,
        // A foreground, non-silent backup surfaces its own in-app error alert.
        notifyOnFailure: silent || !isForeground,
      });
      setLastBackup(uploadedFile);

      // A successful cloud backup is a real trust moment — ask for a review
      // here rather than on a random screen mount. No-ops after 1st ever ask
      // or before day 2 since install (see ReviewPromptService).
      void ReviewPromptService.maybeRequestReview();
      return true;
    } catch (e) {
      LoggerService.warn('GOOGLE_BACKUP', 'Backup failed', e);
      if (isAuthError(e)) setUser(null);
      if (silent) return false;
      if (e instanceof BackupInProgressError) throw new Error(i18n.t('backup.errInProgress'));
      if (isAuthError(e)) throw new Error(i18n.t('backup.errSessionExpired'));
      throw new Error(i18n.t('backup.errSaveDrive'));
    }
  }, [user, lastBackup?.id, isPremium]);

  const performRestore = useCallback(async (): Promise<boolean> => {
    if (!isPremium) throw new CloudBackupProRequiredError();

    if (isCloudBackupRunning() || getBackupState().isBackingUp || getBackupState().isRestoring) {
      throw new Error(i18n.t('backup.errInProgress'));
    }

    // Claim the restore flag before the first await so an auto-backup can't start mid-restore
    // and upload a half-replaced database.
    updateBackupState({ isRestoring: true, progress: 5, progressStage: i18n.t('backup.stageLocating') });

    try {
      const activeUser = user || (await GoogleDriveService.getCurrentUser());
      if (!activeUser) {
        throw new Error(i18n.t('backup.errSignInRestore'));
      }

      // Always query Google Drive directly for the latest remote backup file
      const targetBackup = await GoogleDriveService.findLatestBackup();

      if (!targetBackup?.id) {
        throw new NoBackupFoundError();
      }

      updateBackupState({ progress: 15, progressStage: i18n.t('backup.stageDownloading') });

      const backupJsonStr = await GoogleDriveService.downloadBackup(
        targetBackup.id,
        (fraction) => {
          updateBackupState({
            progress: 15 + Math.round(fraction * 60),
            progressStage: i18n.t('backup.stageDownloadingPct', { pct: Math.round(fraction * 100) }),
          });
        },
        targetBackup.size,
      );

      if (!backupJsonStr || backupJsonStr.trim().length === 0) {
        throw new Error(i18n.t('backup.errCorrupted'));
      }

      updateBackupState({ progress: 80, progressStage: i18n.t('backup.stageRestoring') });

      await DatabaseBackupService.restoreBackupData(backupJsonStr, queryClient);

      setUser(activeUser);
      setLastBackup(targetBackup);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(targetBackup));

      updateBackupState({ progress: 100, progressStage: i18n.t('backup.stageRestoreComplete') });
      return true;
    } catch (e) {
      if (isNoBackupError(e)) {
        LoggerService.info('GOOGLE_BACKUP', 'No backup file found on Google Drive');
        throw e;
      }
      if (isAuthError(e)) {
        setUser(null);
        throw new Error(i18n.t('backup.errSessionExpired'));
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
