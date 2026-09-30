import type { BackupOperation, CloudBackupFileMeta } from './backup.types';

/**
 * The single source of truth for "is a backup or restore running, and how far along".
 * Shared by React (via useSyncExternalStore) and the headless background task, which run in
 * the same JS runtime when the app process is alive.
 *
 * Only one operation may run at a time: a backup uploading mid-restore would snapshot a
 * half-replaced database, and a restore mid-backup would race the export.
 */
export type BackupState = {
  operation: BackupOperation | null;
  /** 0–100 */
  progress: number;
  stage: string | null;
  /** Set when an operation succeeds, so observers (e.g. cached "last backup" UI) can refresh. */
  lastCompleted: { operation: BackupOperation; meta: CloudBackupFileMeta; at: number } | null;
};

const IDLE: Pick<BackupState, 'operation' | 'progress' | 'stage'> = { operation: null, progress: 0, stage: null };

let state: BackupState = { ...IDLE, lastCompleted: null };
const listeners = new Set<() => void>();

function setState(next: BackupState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Stable snapshot reference between changes — required by useSyncExternalStore. */
export function getBackupState(): BackupState {
  return state;
}

export function subscribeToBackupState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isBackupBusy(): boolean {
  return state.operation !== null;
}

/**
 * Atomically claims the operation slot. Synchronous on purpose: callers must claim before their
 * first `await`, so two racing callers can never both see the slot as free.
 */
export function tryBeginOperation(operation: BackupOperation, stage: string): boolean {
  if (state.operation !== null) return false;
  setState({ ...state, operation, progress: 0, stage });
  return true;
}

export function reportProgress(progress: number, stage: string): void {
  if (state.operation === null) return;
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  if (clamped === state.progress && stage === state.stage) return;
  setState({ ...state, progress: clamped, stage });
}

/** Releases the slot. Pass `meta` only when the operation succeeded. */
export function endOperation(meta?: CloudBackupFileMeta): void {
  const finished = state.operation;
  if (finished === null) return;
  setState({
    ...IDLE,
    lastCompleted: meta ? { operation: finished, meta, at: Date.now() } : state.lastCompleted,
  });
}
