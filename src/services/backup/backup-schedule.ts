/**
 * Auto-backup timing rules. Pure (no I/O, no React Native imports) so the policy is unit-testable
 * and shared by the foreground checks, the headless task and the UI.
 */

// Fixed schedule — no user-facing frequency choice. Same in all builds.
export const AUTO_BACKUP_INTERVAL_MINUTES = 12 * 60;
export const AUTO_BACKUP_INTERVAL_MS = AUTO_BACKUP_INTERVAL_MINUTES * 60 * 1000;

// Checks land a little early (OS jitter, a foreground check just shy of the mark). Without
// slack an 11h59m check is skipped and the next chance may be hours away.
export const DUE_TOLERANCE_MS = 30 * 60 * 1000;

// How often the OS may wake us to *check*, deliberately shorter than the backup interval.
// The wake timer and the backup clock are independent: a foreground backup resets the backup
// clock but not the OS timer, so with equal intervals a wake can land just before the backup is
// due, skip, and leave the next chance a full interval later (worst case ~24h between backups).
// A 4h cadence bounds that to ~16h. Wakes that aren't due cost one AsyncStorage read.
export const BACKGROUND_CHECK_INTERVAL_MINUTES = 4 * 60;

// Beyond this the schedule has clearly stopped firing (e.g. an OEM battery killer) and the UI
// should say so rather than let the user assume they're protected.
export const OVERDUE_AFTER_MS = AUTO_BACKUP_INTERVAL_MS * 2;

/** `lastBackupAt` is epoch ms of the last successful backup, 0 when there has never been one. */
export function isBackupDue(lastBackupAt: number, now: number): boolean {
  if (!Number.isFinite(lastBackupAt) || lastBackupAt <= 0) return true;
  // A clock moved backwards past the last backup would otherwise block backups indefinitely.
  if (lastBackupAt > now) return true;
  return now - lastBackupAt >= AUTO_BACKUP_INTERVAL_MS - DUE_TOLERANCE_MS;
}

/** True when the last backup (ISO time from Drive) is old enough that auto-backup has stalled. */
export function isBackupOverdue(lastModifiedIso: string | null | undefined, now: number): boolean {
  if (!lastModifiedIso) return false;
  const modifiedAt = Date.parse(lastModifiedIso);
  if (Number.isNaN(modifiedAt)) return false;
  return now - modifiedAt > OVERDUE_AFTER_MS;
}
