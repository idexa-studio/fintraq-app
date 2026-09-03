import { CloudBackupFileMeta, GoogleDriveService, GoogleUserAccount } from '@/src/services/backup/google-drive.service';
import { BackupMetadata, DatabaseBackupService } from '@/src/services/backup/database-backup.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const STORAGE_KEY_AUTO_BACKUP = '@fintraq_auto_backup_enabled';
const STORAGE_KEY_LAST_BACKUP_META = '@fintraq_last_backup_meta';

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
  connectAccount: () => Promise<void>;
  disconnectAccount: () => Promise<void>;
  performBackup: () => Promise<boolean>;
  performRestore: () => Promise<boolean>;
  toggleAutoBackup: (value: boolean) => Promise<void>;
  refreshBackupInfo: () => Promise<void>;
};

export function useGoogleBackup(): UseGoogleBackupReturn {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<GoogleUserAccount | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<CloudBackupFileMeta | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);

  // Load active user and auto-backup setting on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      let currentUser: GoogleUserAccount | null = null;
      try {
        currentUser = await GoogleDriveService.getCurrentUser();
        if (isMounted && currentUser) {
          setUser(currentUser);
        }

        const autoVal = await AsyncStorage.getItem(STORAGE_KEY_AUTO_BACKUP);
        if (isMounted) {
          setAutoBackupEnabled(autoVal === 'true');
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
          if (isMounted) setLastBackup(backupMeta);
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
      setLastBackup(backupMeta);
    } catch (e) {
      console.warn('[useGoogleBackup] refreshBackupInfo failed:', e);
    }
  }, [user]);

  const connectAccount = useCallback(async () => {
    try {
      setIsChecking(true);
      const signedInUser = await GoogleDriveService.signIn();
      if (signedInUser) {
        setUser(signedInUser);
        const backupMeta = await GoogleDriveService.findLatestBackup();
        setLastBackup(backupMeta);
      }
    } catch (e: any) {
      Alert.alert('Sign-In Failed', e?.message || 'Could not connect to Google account.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const disconnectAccount = useCallback(async () => {
    try {
      await GoogleDriveService.signOut();
      setUser(null);
      setLastBackup(null);
    } catch (e: any) {
      Alert.alert('Sign-Out Error', e?.message || 'Failed to disconnect Google account.');
    }
  }, []);

  const performBackup = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Google Account Required', 'Please connect your Google Account first.');
      return false;
    }

    try {
      setIsBackingUp(true);
      setProgress(15);
      setProgressStage('Preparing database snapshot...');

      const payloadStr = await DatabaseBackupService.exportBackupData();

      setProgress(20);
      setProgressStage('Uploading to Google Drive...');

      const uploadedFile = await GoogleDriveService.uploadBackup(payloadStr, lastBackup?.id, (fraction) => {
        setProgress(20 + Math.round(fraction * 70));
        setProgressStage(`Uploading to Google Drive... ${Math.round(fraction * 100)}%`);
      });

      setProgress(95);
      setProgressStage('Finalizing cloud backup...');

      setLastBackup(uploadedFile);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP_META, JSON.stringify(uploadedFile));

      setProgress(100);
      setProgressStage('Backup complete!');

      Alert.alert('Backup Successful', 'Your database has been safely backed up to your Google Cloud Drive AppData folder.');
      return true;
    } catch (e: any) {
      console.warn('[useGoogleBackup] Backup error:', e);
      Alert.alert('Backup Failed', e?.message || 'Failed to back up database to Google Cloud.');
      return false;
    } finally {
      setIsBackingUp(false);
      setTimeout(() => {
        setProgress(0);
        setProgressStage(null);
      }, 1000);
    }
  }, [user, lastBackup]);

  const performRestore = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Google Account Required', 'Please connect your Google Account first.');
      return false;
    }

    if (!lastBackup?.id) {
      Alert.alert('No Backup Found', 'No backup file was found in your Google Drive AppData folder.');
      return false;
    }

    try {
      setIsRestoring(true);
      setProgress(5);
      setProgressStage('Downloading cloud backup package...');

      const backupJsonStr = await GoogleDriveService.downloadBackup(lastBackup.id, (fraction) => {
        setProgress(5 + Math.round(fraction * 65));
        setProgressStage(`Downloading backup... ${Math.round(fraction * 100)}%`);
      });

      setProgress(75);
      setProgressStage('Verifying SHA-256 & restoring data...');

      const restoredMeta: BackupMetadata = await DatabaseBackupService.restoreBackupData(backupJsonStr, queryClient);

      setProgress(100);
      setProgressStage('Restore complete!');

      Alert.alert(
        'Restore Complete',
        `Database successfully restored from backup (App Version ${restoredMeta.appVersion || '1.0'}).`,
      );
      return true;
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Failed to restore database from Google Cloud.');
      return false;
    } finally {
      setIsRestoring(false);
      setTimeout(() => {
        setProgress(0);
        setProgressStage(null);
      }, 1000);
    }
  }, [user, lastBackup, queryClient]);

  const toggleAutoBackup = useCallback(async (value: boolean) => {
    try {
      setAutoBackupEnabled(value);
      await AsyncStorage.setItem(STORAGE_KEY_AUTO_BACKUP, value ? 'true' : 'false');
    } catch (e) {
      console.warn('[useGoogleBackup] Failed to save auto backup setting:', e);
    }
  }, []);

  return {
    user,
    isConnected: !!user,
    isChecking,
    isBackingUp,
    isRestoring,
    progress,
    progressStage,
    lastBackup,
    autoBackupEnabled,
    connectAccount,
    disconnectAccount,
    performBackup,
    performRestore,
    toggleAutoBackup,
    refreshBackupInfo,
  };
}
