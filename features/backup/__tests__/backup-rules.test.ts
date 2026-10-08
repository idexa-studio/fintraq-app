import { backupDay, failureOf, nextAutoBackup, remedyOf, sizeText } from '@/features/backup/backup-rules';
import { BackupInProgressError, CloudBackupProRequiredError, GoogleDriveAuthError, GoogleDriveNetworkError, NoBackupFoundError } from '@/platform/drive/google-drive.errors';

describe('backup rules', () => {
  it('names each failure by what can be done about it', () => {
    expect(failureOf(new BackupInProgressError())).toBe('busy');
    expect(failureOf(new NoBackupFoundError())).toBe('noBackup');
    expect(failureOf(new CloudBackupProRequiredError())).toBe('needsPro');
    expect(failureOf(new GoogleDriveAuthError())).toBe('signedOut');
    expect(failureOf(new GoogleDriveNetworkError('op', new TypeError('Network request failed')))).toBe('offline');
    expect(failureOf(new Error('anything else'))).toBe('unknown');
    expect(failureOf('not an error')).toBe('unknown');
  });

  it('reads the failure through an error wrapped for display', () => {
    expect(failureOf(new Error('Google Drive session expired.', { cause: new GoogleDriveAuthError() }))).toBe('signedOut');
  });

  it('offers to connect again only when the connection is the problem', () => {
    expect(remedyOf('signedOut')).toBe('reconnect');
    expect(remedyOf('permission')).toBe('reconnect');
    expect(remedyOf('offline')).toBeNull();
    expect(remedyOf('unknown')).toBeNull();
  });

  it('says whether the backup is from today, yesterday or earlier', () => {
    const now = new Date(2026, 9, 8, 9, 0);
    expect(backupDay(new Date(2026, 9, 8, 0, 5).toISOString(), now)).toBe('today');
    expect(backupDay(new Date(2026, 9, 7, 23, 55).toISOString(), now)).toBe('yesterday');
    expect(backupDay(new Date(2026, 9, 1, 12, 0).toISOString(), now)).toBe('earlier');
    expect(backupDay(new Date(2026, 9, 9, 12, 0).toISOString(), now)).toBe('today');
    expect(backupDay('nonsense', now)).toBe('earlier');
  });

  it('writes a size in a readable unit', () => {
    expect(sizeText(840)).toBe('840 B');
    expect(sizeText(86_016)).toBe('84 KB');
    expect(sizeText(1_258_291)).toBe('1.2 MB');
    expect(sizeText(0)).toBe('');
  });

  it('expects the next automatic backup twelve hours after the last', () => {
    const last = '2026-10-08T02:00:00.000Z';
    expect(nextAutoBackup(last, Date.parse('2026-10-08T05:00:00.000Z'))?.toISOString()).toBe('2026-10-08T14:00:00.000Z');
  });

  it('promises no time when there is no backup or the schedule is late', () => {
    expect(nextAutoBackup(null)).toBeNull();
    expect(nextAutoBackup('nonsense')).toBeNull();
    expect(nextAutoBackup('2026-10-07T02:00:00.000Z', Date.parse('2026-10-08T05:00:00.000Z'))).toBeNull();
  });
});
