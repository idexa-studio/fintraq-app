import { useSyncExternalStore } from 'react';
import { getBackupState, subscribeToBackupState } from '@/platform/backup/backup-state';

export type BackupProgress = {
  isBackingUp: boolean;
  isRestoring: boolean;
  isBusy: boolean;
  /** 0–100 */
  progress: number;
  stage: string | null;
};

/** Live backup/restore progress from the shared store — includes runs started by auto-backup. */
export function useBackupProgress(): BackupProgress {
  const state = useSyncExternalStore(subscribeToBackupState, getBackupState);
  return {
    isBackingUp: state.operation === 'backup',
    isRestoring: state.operation === 'restore',
    isBusy: state.operation !== null,
    progress: state.progress,
    stage: state.stage,
  };
}
