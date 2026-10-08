import { BackupValidationError } from '@/data/backup/snapshot';

const mockPick = jest.fn();
jest.mock('expo-file-system', () => ({
  File: Object.assign(jest.fn(), { pickFileAsync: (...args: unknown[]) => mockPick(...args) }),
  Paths: { cache: 'cache' },
}));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
const mockImport = jest.fn();
jest.mock('@/platform/backup/database-backup', () => ({ DatabaseBackupService: { exportBackupData: jest.fn(), importBackupData: (...args: unknown[]) => mockImport(...args) } }));

// eslint-disable-next-line import/first
import { backupFileName, chooseBackupFile, restoreBackupFile } from '@/platform/backup/file-backup';
// eslint-disable-next-line import/first
import { isBackupBusy } from '@/platform/backup/backup-state';

describe('file backup', () => {
  beforeEach(() => {
    mockPick.mockReset();
    mockImport.mockReset();
  });

  it('names the file by the day it was made', () => {
    expect(backupFileName(new Date(2026, 9, 8))).toBe('fintraq_backup_2026-10-08.json');
    expect(backupFileName(new Date(2026, 0, 3))).toBe('fintraq_backup_2026-01-03.json');
  });

  it('treats a dismissed chooser as a change of mind', async () => {
    mockPick.mockRejectedValue(new Error('cancelled'));
    await expect(chooseBackupFile()).resolves.toBeNull();
  });

  it('refuses a file that is not a backup before anything is touched', async () => {
    mockPick.mockResolvedValue({ text: async () => 'not a backup' });
    await expect(chooseBackupFile()).rejects.toBeInstanceOf(BackupValidationError);
    expect(mockImport).not.toHaveBeenCalled();
  });

  it('frees the operation slot whether the restore works or not', async () => {
    const chosen = { json: '{}', metadata: { version: 1, appVersion: '1.2.4', timestamp: '2026-10-08T00:00:00.000Z', checksum: 'x', counts: { accounts: 0, categories: 0, persons: 0, loans: 0, payments: 0 } } };
    mockImport.mockResolvedValue(chosen.metadata);
    await expect(restoreBackupFile(chosen)).resolves.toBe(chosen.metadata);
    expect(isBackupBusy()).toBe(false);

    mockImport.mockRejectedValue(new BackupValidationError('corrupted', 'bad'));
    await expect(restoreBackupFile(chosen)).rejects.toBeInstanceOf(BackupValidationError);
    expect(isBackupBusy()).toBe(false);
  });
});
