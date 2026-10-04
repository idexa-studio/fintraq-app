import { runAutoBackupIfDue } from '@/src/services/backup/auto-backup.service';
import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import { endOperation, tryBeginOperation } from '@/src/services/backup/backup-state';
import { runCloudBackup } from '@/src/services/backup/cloud-backup.service';
import { BackupInProgressError, GoogleDriveNetworkError } from '@/src/services/backup/google-drive.errors';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';

jest.mock('@/src/services/logger.service', () => ({
  LoggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/src/services/notification.service', () => ({
  NotificationService: { dismissBackupNotification: jest.fn(async () => {}) },
}));
jest.mock('@/src/services/review-prompt.service', () => ({
  ReviewPromptService: { maybeRequestReview: jest.fn(async () => {}) },
}));
jest.mock('@/src/services/backup/cloud-backup.service', () => ({ runCloudBackup: jest.fn() }));
jest.mock('@/src/services/backup/google-drive.service', () => ({
  GoogleDriveService: { getCurrentUser: jest.fn(), findLatestBackup: jest.fn() },
}));
jest.mock('@/src/services/backup/backup-preferences', () => ({
  BackupPreferences: {
    isProEntitled: jest.fn(),
    isAutoBackupSwitchOn: jest.fn(),
    getLastBackupAt: jest.fn(),
    hasSyncedWithDrive: jest.fn(),
    isOwnBackup: jest.fn(),
  },
}));

const prefs = BackupPreferences as jest.Mocked<typeof BackupPreferences>;
const getCurrentUser = GoogleDriveService.getCurrentUser as jest.Mock;
const findLatestBackup = GoogleDriveService.findLatestBackup as jest.Mock;
const runBackup = runCloudBackup as jest.Mock;
const META = { id: 'f', name: 'fintraq_backup.json', modifiedTime: '2026-09-30T00:00:00Z', size: 1 };
const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.clearAllMocks();
  prefs.isProEntitled.mockResolvedValue(true);
  prefs.isAutoBackupSwitchOn.mockResolvedValue(true);
  prefs.getLastBackupAt.mockResolvedValue(Date.now() - DAY);
  prefs.hasSyncedWithDrive.mockResolvedValue(true);
  findLatestBackup.mockResolvedValue(META);
  getCurrentUser.mockResolvedValue({ id: 'u', email: 'a@b.c', name: null, photo: null });
  runBackup.mockResolvedValue(META);
});

describe('runAutoBackupIfDue', () => {
  it('backs up when entitled, enabled, due and signed in', async () => {
    await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'ran', meta: META });
    expect(runBackup).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['not_pro', () => prefs.isProEntitled.mockResolvedValue(false)],
    ['disabled', () => prefs.isAutoBackupSwitchOn.mockResolvedValue(false)],
    ['not_due', () => prefs.getLastBackupAt.mockResolvedValue(Date.now() - 60_000)],
    ['signed_out', () => getCurrentUser.mockResolvedValue(null)],
  ])('skips with reason %s', async (reason, arrange) => {
    arrange();
    await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'skipped', reason });
    expect(runBackup).not.toHaveBeenCalled();
  });

  it('skips while another backup or restore holds the slot', async () => {
    tryBeginOperation('restore', 'locating');
    try {
      await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'skipped', reason: 'busy' });
    } finally {
      endOperation();
    }
  });

  it('treats losing the start race as busy, not as a failure', async () => {
    runBackup.mockRejectedValue(new BackupInProgressError());
    await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'skipped', reason: 'busy' });
  });

  it('reports real failures', async () => {
    const error = new GoogleDriveNetworkError('upload', new Error('offline'));
    runBackup.mockRejectedValue(error);
    await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'failed', error });
  });

  describe('on an install that has never backed up or restored', () => {
    beforeEach(() => {
      prefs.getLastBackupAt.mockResolvedValue(0);
      prefs.hasSyncedWithDrive.mockResolvedValue(false);
      prefs.isOwnBackup.mockResolvedValue(false);
    });

    it('leaves a backup already in Drive alone', async () => {
      await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'skipped', reason: 'unclaimed_backup' });
      expect(runBackup).not.toHaveBeenCalled();
    });

    it('carries on with a backup it made before the account was disconnected', async () => {
      prefs.isOwnBackup.mockResolvedValue(true);
      await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'ran', meta: META });
    });

    it('backs up when Drive is empty', async () => {
      findLatestBackup.mockResolvedValue(null);
      await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'ran', meta: META });
    });

    it('does not back up when Drive cannot be checked', async () => {
      const error = new GoogleDriveNetworkError('findLatestBackup', new Error('offline'));
      findLatestBackup.mockRejectedValue(error);
      await expect(runAutoBackupIfDue()).resolves.toEqual({ outcome: 'failed', error });
      expect(runBackup).not.toHaveBeenCalled();
    });
  });

  it('bypasses entitlement and schedule gates when forced (QA)', async () => {
    prefs.isProEntitled.mockResolvedValue(false);
    prefs.getLastBackupAt.mockResolvedValue(Date.now());
    await expect(runAutoBackupIfDue(true)).resolves.toMatchObject({ outcome: 'ran' });
    expect(runBackup).toHaveBeenCalledWith({ trigger: 'dev_qa' });
  });
});
