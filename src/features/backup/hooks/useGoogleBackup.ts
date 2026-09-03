import { DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import { CloudBackupFileMeta, GoogleDriveService, GoogleUserAccount } from '@/src/services/backup/google-drive.service';
import { NotificationService } from '@/src/services/notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type AutoBackupFrequency = 'off' | 'daily' | 'weekly' | 'monthly';

const STORAGE_KEY_AUTO_BACKUP = '@fintraq_auto_backup_enabled';
const STORAGE_KEY_AUTO_BACKUP_FREQ = '@fintraq_auto_backup_frequency';
const STORAGE_KEY_LAST_BACKUP_META = '@fintraq_last_backup_meta';
const STORAGE_KEY_LAST_AUTO_BACKUP_TIME = '@fintraq_last_auto_backup_time';

const FREQUENCY_THRESHOLDS_MS: Record<AutoBackupFrequency, number> = {
  off: Infinity,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

type SharedBackupState = {
  isBackingUp: boolean;
  isRestoring: boolean;
  progress: number;
  progressStage: string | null;
};

let sharedBackupState: SharedBackupState = {
  isBackingUp: false,
  isRestoring: false,
  progress: 0,
  progressStage: null,
};

const listeners = new Set<() => void>();

function updateSharedState(patch: Partial<SharedBackupState>) {
  sharedBackupState = { ...sharedBackupState, ...patch };
  listeners.forEach((cb) => cb());
}

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
  const [backupSyncState, setBackupSyncState] = useState<SharedBackupState>(sharedBackupState);
  const [lastBackup, setLastBackup] = useState<CloudBackupFileMeta | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequencyState] = useState<AutoBackupFrequency>('off');

  // Subscribe component to shared backup state updates
  useEffect(() => {
    const handleChange = () => setBackupSyncState(sharedBackupState);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
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

        const [autoVal, autoFreqVal, cachedMetaStr, lastAutoTimeStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_AUTO_BACKUP),
          AsyncStorage.getItem(STORAGE_KEY_AUTO_BACKUP_FREQ),
          AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP_META),
          AsyncStorage.getItem(STORAGE_KEY_LAST_AUTO_BACKUP_TIME),
        ]);

        let resolvedFreq: AutoBackupFrequency = 'off';
        if (autoFreqVal === 'daily' || autoFreqVal === 'weekly' || autoFreqVal === 'monthly') {
          resolvedFreq = autoFreqVal as AutoBackupFrequency;
        } else if (autoVal === 'true') {
          resolvedFreq = 'daily';
        }

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

        // Trigger scheduled background auto-backup if threshold elapsed
        if (isMounted && currentUser && resolvedFreq !== 'off') {
          const now = Date.now();
          const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
          const threshold = FREQUENCY_THRESHOLDS_MS[resolvedFreq];

          if (now - lastAutoTime >= threshold) {
            console.log(`[useGoogleBackup] Threshold met for ${resolvedFreq} auto-backup. Running background backup...`);
            const isBackground = AppState.currentState !== 'active';
            if (isBackground) {
              NotificationService.presentBackupStartNotification();
            }
            try {
              updateSharedState({ isBackingUp: true, progress: 10, progressStage: 'Auto-backing up...' });
              const payloadStr = await DatabaseBackupService.exportBackupData();
              updateSharedState({ progress: 50, progressStage: 'Uploading background backup...' });
              const latestFile = await GoogleDriveService.findLatestBackup();
              const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, latestFile?.id, (frac) => {
                updateSharedState({ progress: 50 + Math.round(frac * 45), progressStage: `Uploading... ${Math.round(frac * 100)}%` });
              });
              updateSharedState({ progress: 100, progressStage: 'Backup complete!' });
              if (isMounted) {
                setLastBackup(uploadedFile);
              }
              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(uploadedFile)),
                AsyncStorage.setItem(STORAGE_KEY_LAST_AUTO_BACKUP_TIME, String(now)),
              ]);
              if (isBackground) {
                NotificationService.presentBackupCompleteNotification();
              }
            } catch (err) {
              console.warn('[useGoogleBackup] Background auto-backup warning:', err);
              if (isBackground) {
                NotificationService.presentBackupFailedNotification();
              }
            } finally {
              setTimeout(() => {
                updateSharedState({ isBackingUp: false, progress: 0, progressStage: null });
              }, 1000);
            }
          }
        }
      } catch (e) {
        console.warn('[useGoogleBackup] Mount initialization error:', e);
      } finally {
        if (isMounted) setIsChecking(false);
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
          console.warn('[useGoogleBackup] Background backup check error:', e);
        }
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
      updateSharedState({ isBackingUp: true, progress: 5, progressStage: 'Preparing workspace snapshot...' });

      const payloadStr = await DatabaseBackupService.exportBackupData();

      updateSharedState({ progress: 25, progressStage: 'Uploading backup...' });

      const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, lastBackup?.id, (fraction: number) => {
        updateSharedState({
          progress: 25 + Math.round(fraction * 65),
          progressStage: `Uploading to Google Drive... ${Math.round(fraction * 100)}%`,
        });
      });

      updateSharedState({ progress: 95, progressStage: 'Finalizing backup...' });

      setLastBackup(uploadedFile);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(uploadedFile)),
        AsyncStorage.setItem(STORAGE_KEY_LAST_AUTO_BACKUP_TIME, String(Date.now())),
      ]);

      updateSharedState({ progress: 100, progressStage: 'Backup complete!' });

      if (isBackground) {
        NotificationService.presentBackupCompleteNotification();
      }
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
        updateSharedState({ isBackingUp: false, progress: 0, progressStage: null });
      }, 1000);
    }
  }, [user, lastBackup?.id]);

  const performRestore = useCallback(async (): Promise<boolean> => {
    const activeUser = user || (await GoogleDriveService.getCurrentUser());
    if (!activeUser) {
      throw new Error('Please sign in to your Google Account to restore data.');
    }

    try {
      updateSharedState({ isRestoring: true, progress: 5, progressStage: 'Locating backup...' });

      let targetBackup = lastBackup;
      if (!targetBackup?.id) {
        targetBackup = await GoogleDriveService.findLatestBackup();
        if (targetBackup) {
          setLastBackup(targetBackup);
          await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(targetBackup));
        }
      }

      if (!targetBackup?.id) {
        throw new Error('No previous Fintraq backup was found in your Google Drive account.');
      }

      updateSharedState({ progress: 15, progressStage: 'Downloading backup...' });

      const backupJsonStr = await GoogleDriveService.downloadBackup(targetBackup.id, (fraction) => {
        updateSharedState({
          progress: 15 + Math.round(fraction * 60),
          progressStage: `Downloading backup... ${Math.round(fraction * 100)}%`,
        });
      });

      updateSharedState({ progress: 80, progressStage: 'Restoring data...' });

      await DatabaseBackupService.restoreBackupData(backupJsonStr, queryClient);

      updateSharedState({ progress: 100, progressStage: 'Restore complete!' });
      return true;
    } catch (e: any) {
      console.error('[useGoogleBackup] Restore error:', e);
      throw new Error(e?.message || 'Could not restore backup. The backup file may be corrupted or invalid.');
    } finally {
      setTimeout(() => {
        updateSharedState({ isRestoring: false, progress: 0, progressStage: null });
      }, 1000);
    }
  }, [user, lastBackup, queryClient]);

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
