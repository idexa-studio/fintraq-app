import {
  AUTO_BACKUP_STORAGE_KEYS,
  AutoBackupFrequency,
  resolveAutoBackupFrequency,
  runAutoBackupIfDue,
} from '@/src/services/backup/auto-backup.service';
import { getBackupState, SharedBackupState, subscribeToBackupState, updateBackupState } from '@/src/services/backup/backup-state';
import { DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import { isNoBackupError, NoBackupFoundError } from '@/src/services/backup/google-drive.errors';
import { CloudBackupFileMeta, GoogleDriveService, GoogleUserAccount } from '@/src/services/backup/google-drive.service';
import { NotificationService } from '@/src/services/notification.service';
import { ReviewPromptService } from '@/src/services/review-prompt.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

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
  const [user, setUser] = useState<GoogleUserAccount | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [backupSyncState, setBackupSyncState] = useState<SharedBackupState>(getBackupState());
  const [lastBackup, setLastBackup] = useState<CloudBackupFileMeta | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequencyState] = useState<AutoBackupFrequency>('off');

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
          resolveAutoBackupFrequency(),
          AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP_META),
        ]);

        if (isMounted) {
          setAutoBackupEnabled(resolvedFreq !== 'off');
          setAutoBackupFrequencyState(resolvedFreq);

          if (cachedMetaStr) {
            try {
              setLastBackup(JSON.parse(cachedMetaStr));
            } catch {
              // Ignore corrupted cached metadata
            }
          }
        }

        // Same threshold-check-and-run logic the headless background task
        // uses (see auto-backup.service.ts) — sharing it means a change to
        // how auto-backup runs never has to be applied in two places.
        const result = await runAutoBackupIfDue();
        if (isMounted && result.outcome === 'ran') {
          setLastBackup(result.meta);
        }

        // Fetch remote backup meta in background without blocking initial UI
        // render — skip if runAutoBackupIfDue already set lastBackup from its
        // own upload response, to avoid a second redundant Drive files.list
        // round trip for metadata already known.
        if (isMounted && currentUser && result.outcome !== 'ran') {
          try {
            const backupMeta = await GoogleDriveService.findLatestBackup();
            if (isMounted && backupMeta) {
              setLastBackup(backupMeta);
              await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
            }
          } catch (e) {
            console.warn('[useGoogleBackup] Background backup check error:', e);
          }
        }
      } catch (e) {
        console.warn('[useGoogleBackup] Mount initialization error:', e);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshBackupInfo = useCallback(async () => {
    if (!user) return;
    try {
      const backupMeta = await GoogleDriveService.findLatestBackup();
      if (backupMeta) {
        setLastBackup(backupMeta);
        await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
      }
    } catch (e) {
      console.warn('[useGoogleBackup] refreshBackupInfo failed:', e);
    }
  }, [user]);

  const setAutoBackupFrequency = useCallback(async (freq: AutoBackupFrequency) => {
    try {
      setAutoBackupFrequencyState(freq);
      setAutoBackupEnabled(freq !== 'off');
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP_FREQ, freq),
        AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP, freq !== 'off' ? 'true' : 'false'),
      ]);
    } catch (e) {
      console.warn('[useGoogleBackup] setAutoBackupFrequency failed:', e);
    }
  }, []);

  const connectAccount = useCallback(async (): Promise<GoogleUserAccount | null> => {
    if (isChecking) return user;
    try {
      setIsChecking(true);
      const signedInUser = await GoogleDriveService.signIn();
      setUser(signedInUser);
      if (signedInUser) {
        // By default enable automated daily cloud backups upon connecting Google Drive
        await setAutoBackupFrequency('daily');

        const backupMeta = await GoogleDriveService.findLatestBackup();
        if (backupMeta) {
          setLastBackup(backupMeta);
          await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(backupMeta));
        }
      }
      return signedInUser;
    } catch (e: any) {
      console.warn('[useGoogleBackup] connectAccount failed:', e);
      throw new Error(e?.message || 'Failed to connect Google Account.');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, user, setAutoBackupFrequency]);

  const disconnectAccount = useCallback(async () => {
    try {
      await GoogleDriveService.signOut();
      setUser(null);
      setLastBackup(null);
      await AsyncStorage.removeItem(STORAGE_KEY_LAST_BACKUP_META);
    } catch (e: any) {
      console.warn('[useGoogleBackup] disconnectAccount failed:', e);
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

      const payloadStr = await DatabaseBackupService.exportBackupData();

      updateBackupState({ progress: 25, progressStage: 'Uploading backup...' });

      const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, lastBackup?.id, (fraction: number) => {
        updateBackupState({
          progress: 25 + Math.round(fraction * 65),
          progressStage: `Uploading to Google Drive... ${Math.round(fraction * 100)}%`,
        });
      });

      updateBackupState({ progress: 95, progressStage: 'Finalizing backup...' });

      setLastBackup(uploadedFile);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(uploadedFile)),
        AsyncStorage.setItem(STORAGE_KEY_LAST_AUTO_BACKUP_TIME, String(Date.now())),
      ]);

      updateBackupState({ progress: 100, progressStage: 'Backup complete!' });

      if (isBackground) {
        NotificationService.presentBackupCompleteNotification();
      }
      // A successful cloud backup is a real trust moment — ask for a review
      // here rather than on a random screen mount. No-ops after 1st ever ask
      // or before day 2 since install (see ReviewPromptService).
      ReviewPromptService.maybeRequestReview();
      return true;
    } catch (e: any) {
      console.warn('[useGoogleBackup] Backup error:', e);
      if (isBackground) {
        NotificationService.presentBackupFailedNotification();
      }
      if (!options?.silent) {
        throw new Error('Could not save backup to Google Drive. Please check your internet connection.');
      }
      return false;
    } finally {
      setTimeout(() => {
        updateBackupState({ isBackingUp: false, progress: 0, progressStage: null });
      }, 1000);
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

      // Save user session & enable automated daily backup by default on successful restore
      setUser(activeUser);
      setLastBackup(targetBackup);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(targetBackup)),
        setAutoBackupFrequency('daily'),
      ]);

      updateBackupState({ progress: 100, progressStage: 'Restore complete!' });
      return true;
    } catch (e: any) {
      if (isNoBackupError(e)) {
        console.log('[useGoogleBackup] Restore info: No backup file found on Google Drive.');
        throw e;
      }
      console.warn('[useGoogleBackup] Restore error:', e);
      throw e;
    } finally {
      setTimeout(() => {
        updateBackupState({ isRestoring: false, progress: 0, progressStage: null });
      }, 1000);
    }
  }, [user, queryClient, setAutoBackupFrequency]);

  const toggleAutoBackup = useCallback(async (value: boolean) => {
    const nextFreq: AutoBackupFrequency = value ? 'daily' : 'off';
    await setAutoBackupFrequency(nextFreq);
  }, [setAutoBackupFrequency]);

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
