let restoreInProgress = false;

export const BackupLock = {
  isRestoring(): boolean {
    return restoreInProgress;
  },
  setRestoring(val: boolean): void {
    restoreInProgress = val;
  },
};
