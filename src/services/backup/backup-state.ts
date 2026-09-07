/** In-memory backup/restore progress, shared by React components and the headless background task. */
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
