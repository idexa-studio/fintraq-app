import {
  AUTO_BACKUP_INTERVAL_MS,
  DUE_TOLERANCE_MS,
  isBackupDue,
  isBackupOverdue,
  OVERDUE_AFTER_MS,
} from '@/src/services/backup/backup-schedule';

const NOW = Date.UTC(2026, 8, 30, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

describe('isBackupDue', () => {
  it('is due when there has never been a backup', () => {
    expect(isBackupDue(0, NOW)).toBe(true);
    expect(isBackupDue(Number.NaN, NOW)).toBe(true);
  });

  it('is not due before the interval (minus tolerance) has elapsed', () => {
    expect(isBackupDue(NOW - 6 * HOUR, NOW)).toBe(false);
    expect(isBackupDue(NOW - (AUTO_BACKUP_INTERVAL_MS - DUE_TOLERANCE_MS) + 1, NOW)).toBe(false);
  });

  it('is due within the tolerance window before the interval', () => {
    expect(isBackupDue(NOW - (AUTO_BACKUP_INTERVAL_MS - DUE_TOLERANCE_MS), NOW)).toBe(true);
    expect(isBackupDue(NOW - AUTO_BACKUP_INTERVAL_MS, NOW)).toBe(true);
  });

  it('is due when the recorded backup is in the future (clock moved backwards)', () => {
    expect(isBackupDue(NOW + HOUR, NOW)).toBe(true);
  });
});

describe('isBackupOverdue', () => {
  it('is false without a backup time or with an unparseable one', () => {
    expect(isBackupOverdue(null, NOW)).toBe(false);
    expect(isBackupOverdue(undefined, NOW)).toBe(false);
    expect(isBackupOverdue('not a date', NOW)).toBe(false);
  });

  it('flags backups older than twice the interval', () => {
    expect(isBackupOverdue(new Date(NOW - OVERDUE_AFTER_MS + HOUR).toISOString(), NOW)).toBe(false);
    expect(isBackupOverdue(new Date(NOW - OVERDUE_AFTER_MS - HOUR).toISOString(), NOW)).toBe(true);
  });
});
