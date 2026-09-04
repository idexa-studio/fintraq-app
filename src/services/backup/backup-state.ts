/**
 * In-memory backup/restore progress state, shared across every consumer —
 * React components (via useGoogleBackup) and the headless background-backup
 * task, which runs with no React tree at all. Lives here, not inside the
 * hook, precisely because the background task needs to read/write it too.
 */
export type SharedBackupState = {
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

export function getBackupState(): SharedBackupState {
  return sharedBackupState;
}

export function updateBackupState(patch: Partial<SharedBackupState>): void {
  sharedBackupState = { ...sharedBackupState, ...patch };
  listeners.forEach((cb) => cb());
}

export function subscribeToBackupState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
