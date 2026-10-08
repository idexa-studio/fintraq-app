import { BackupPreferences } from '@/platform/backup/backup-preferences';
import { getBackupState } from '@/platform/backup/backup-state';
import { runCloudBackup } from '@/platform/backup/cloud-backup';
import { DatabaseBackupService } from '@/platform/backup/database-backup';
import {
  BackupInProgressError,
  GoogleDriveAuthError,
  GoogleDriveHttpError,
  GoogleDriveNetworkError,
} from '@/platform/drive/google-drive.errors';
import { GoogleDriveService } from '@/platform/drive/google-drive';
import { NotificationService } from '@/platform/notifications/notifications';

jest.mock('@/shared/logging/logger', () => ({
  LoggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/platform/notifications/notifications', () => ({
  NotificationService: {
    presentBackupProgressNotification: jest.fn(async () => {}),
    presentBackupFailedNotification: jest.fn(async () => {}),
    presentBackupReconnectNotification: jest.fn(async () => {}),
    dismissBackupNotification: jest.fn(async () => {}),
  },
}));
jest.mock('@/platform/backup/database-backup', () => ({
  DatabaseBackupService: { exportBackupData: jest.fn(async () => '{"payload":true}') },
}));
jest.mock('@/platform/drive/google-drive', () => ({
  GoogleDriveService: { uploadBackup: jest.fn() },
}));
jest.mock('@/platform/backup/backup-preferences', () => ({
  BackupPreferences: {
    getCachedBackupMeta: jest.fn(async () => ({ id: 'cached-id', name: 'f', modifiedTime: '2026-01-01T00:00:00Z', size: 1 })),
    recordSuccessfulBackup: jest.fn(async () => {}),
  },
}));

const upload = GoogleDriveService.uploadBackup as jest.Mock;
const META = { id: 'file-1', name: 'fintraq_backup.json', modifiedTime: '2026-09-30T00:00:00Z', size: 20 };

/** Runs a backup to completion while advancing the retry delay timers. */
async function settle<T>(promise: Promise<T>) {
  const settled = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await jest.runAllTimersAsync();
  return settled;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe('runCloudBackup', () => {
  it('uploads with the cached file id, records success and releases the slot', async () => {
    upload.mockResolvedValue(META);
    const result = await settle(runCloudBackup({ trigger: 'manual' }));

    expect(result).toEqual({ value: META });
    expect(DatabaseBackupService.exportBackupData).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith('{"payload":true}', 'cached-id', expect.any(Function));
    expect(BackupPreferences.recordSuccessfulBackup).toHaveBeenCalledWith(META, expect.any(Number));
    // A backup that worked says nothing: the progress line just goes.
    expect(NotificationService.dismissBackupNotification).toHaveBeenCalled();
    expect(getBackupState()).toMatchObject({ operation: null, lastCompleted: { operation: 'backup', meta: META } });
  });

  it('rejects an overlapping call instead of uploading twice', async () => {
    let finish: (meta: typeof META) => void = () => {};
    upload.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

    const first = runCloudBackup({ trigger: 'auto_foreground' });
    await expect(runCloudBackup({ trigger: 'manual' })).rejects.toBeInstanceOf(BackupInProgressError);

    await jest.runAllTimersAsync();
    finish(META);
    await expect(first).resolves.toEqual(META);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('retries a transient upload failure once', async () => {
    upload.mockRejectedValueOnce(new GoogleDriveNetworkError('upload', new Error('offline'))).mockResolvedValueOnce(META);
    const result = await settle(runCloudBackup({ trigger: 'auto_background' }));
    expect(result).toEqual({ value: META });
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('does not retry a permanent failure, and reports it', async () => {
    upload.mockRejectedValue(new GoogleDriveHttpError(400, 'upload', 'bad request'));
    const result = await settle(runCloudBackup({ trigger: 'auto_background' }));
    expect(result).toEqual({ error: expect.any(GoogleDriveHttpError) });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(NotificationService.presentBackupFailedNotification).toHaveBeenCalled();
    expect(BackupPreferences.recordSuccessfulBackup).not.toHaveBeenCalled();
    expect(getBackupState().operation).toBeNull();
  });

  it('asks the user to reconnect when the session was lost', async () => {
    upload.mockRejectedValue(new GoogleDriveAuthError());
    await settle(runCloudBackup({ trigger: 'auto_background' }));
    expect(NotificationService.presentBackupReconnectNotification).toHaveBeenCalled();
    expect(NotificationService.presentBackupFailedNotification).not.toHaveBeenCalled();
  });

  it('stays quiet in the OS when the caller shows its own error', async () => {
    upload.mockRejectedValue(new GoogleDriveHttpError(400, 'upload', ''));
    await settle(runCloudBackup({ trigger: 'manual', notifyOnFailure: false }));
    expect(NotificationService.presentBackupFailedNotification).not.toHaveBeenCalled();
    expect(NotificationService.dismissBackupNotification).toHaveBeenCalled();
  });
});
