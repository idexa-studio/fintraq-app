import { isAuthError, isBackupInProgressError, isNoBackupError, isProRequiredError, isScopeDeniedError, isTransientDriveError } from '@/platform/drive/google-drive.errors';
import { BackupValidationError } from '@/data/backup/snapshot';
import { AUTO_BACKUP_INTERVAL_MS } from '@/platform/backup/backup-schedule';
import { differenceInCalendarDays } from 'date-fns';

/**
 * Why a backup, a restore or a connection did not happen, as the thing to do
 * about it. Each has its own words on screen; `unknown` is everything else.
 */
export type BackupFailure = 'busy' | 'signedOut' | 'permission' | 'offline' | 'noBackup' | 'needsPro' | 'damaged' | 'unknown';

function known(error: unknown): BackupFailure | null {
  if (isBackupInProgressError(error)) return 'busy';
  if (isNoBackupError(error)) return 'noBackup';
  if (isProRequiredError(error)) return 'needsPro';
  if (isScopeDeniedError(error)) return 'permission';
  if (isAuthError(error)) return 'signedOut';
  if (isTransientDriveError(error)) return 'offline';
  // The backup arrived but is empty or fails its checks: nothing was restored from it.
  if (error instanceof BackupValidationError) return 'damaged';
  return null;
}

/** Reads the failure from the error, or from whichever error it was wrapped around. */
export function failureOf(error: unknown): BackupFailure {
  // A few links at most; the bound only guards against an error that names itself as its cause.
  for (let link = error, depth = 0; depth < 5; depth += 1) {
    const failure = known(link);
    if (failure) return failure;
    if (!(link instanceof Error) || link.cause === undefined) break;
    link = link.cause;
  }
  return 'unknown';
}

/** What the screen offers under a failure: connecting again, or nothing but the words. */
export const remedyOf = (failure: BackupFailure): 'reconnect' | null => (failure === 'signedOut' || failure === 'permission' ? 'reconnect' : null);

/** How long ago the backup was made, as the wording needs it. */
export type BackupDay = 'today' | 'yesterday' | 'earlier';

export function backupDay(modifiedIso: string, now: Date = new Date()): BackupDay {
  const made = new Date(modifiedIso);
  if (Number.isNaN(made.getTime())) return 'earlier';
  const ago = differenceInCalendarDays(now, made);
  // A clock set back can put the backup in the future; it still reads as today.
  if (ago <= 0) return 'today';
  return ago === 1 ? 'yesterday' : 'earlier';
}

/** The backup's size in the largest unit that keeps it readable: "840 B", "84 KB", "1.2 MB". */
export function sizeText(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * When the next automatic backup is expected: one interval after the last.
 * Null when that cannot be said: no backup yet, or the time has already
 * passed, which means the schedule is late and a promise would be wrong.
 */
export function nextAutoBackup(lastIso: string | null | undefined, now: number = Date.now()): Date | null {
  const last = lastIso ? Date.parse(lastIso) : NaN;
  if (Number.isNaN(last)) return null;
  const next = last + AUTO_BACKUP_INTERVAL_MS;
  return next > now ? new Date(next) : null;
}

/** Why saving or restoring a backup file did not happen. */
export type FileFailure = 'busy' | 'unreadable' | 'unknown';

/** A file that is not a backup, or a damaged one, is told apart from everything else that can go wrong. */
export function fileFailureOf(error: unknown): FileFailure {
  if (isBackupInProgressError(error)) return 'busy';
  if (error instanceof BackupValidationError) return 'unreadable';
  return 'unknown';
}
