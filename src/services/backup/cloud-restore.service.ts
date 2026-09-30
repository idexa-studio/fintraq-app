import i18n from '@/src/i18n';
import { LoggerService } from '@/src/services/logger.service';
import type { CloudBackupFileMeta } from './backup.types';
import { BackupPreferences } from './backup-preferences';
import { BackupValidationError } from './backup-snapshot';
import { endOperation, reportProgress, tryBeginOperation } from './backup-state';
import { DatabaseBackupService } from './database-backup.service';
import { BackupInProgressError, GoogleDriveAuthError, NoBackupFoundError } from './google-drive.errors';
import { GoogleDriveService } from './google-drive.service';

const PROGRESS = { locating: 5, downloadStart: 15, downloadSpan: 60, importing: 80, complete: 100 } as const;

/** Maps internal validation failures to the message the user sees. */
function toUserFacingError(error: unknown): unknown {
  if (!(error instanceof BackupValidationError)) return error;
  if (error.code === 'empty') return new Error(i18n.t('backup.errRestoreEmpty'));
  return new Error(i18n.t('backup.errRestoreIntegrity'));
}

async function execute(): Promise<CloudBackupFileMeta> {
  let result: CloudBackupFileMeta | undefined;
  try {
    if (!(await GoogleDriveService.getCurrentUser())) throw new GoogleDriveAuthError();

    const target = await GoogleDriveService.findLatestBackup();
    if (!target) throw new NoBackupFoundError();

    reportProgress(PROGRESS.downloadStart, i18n.t('backup.stageDownloading'));
    const json = await GoogleDriveService.downloadBackup(
      target.id,
      (fraction) => {
        const pct = Math.round(fraction * 100);
        reportProgress(PROGRESS.downloadStart + fraction * PROGRESS.downloadSpan, i18n.t('backup.stageDownloadingPct', { pct }));
      },
      target.size,
    );
    if (!json.trim()) throw new BackupValidationError('corrupted', 'Downloaded backup is empty');

    reportProgress(PROGRESS.importing, i18n.t('backup.stageRestoring'));
    await DatabaseBackupService.importBackupData(json);
    // Local data now equals this backup, so it counts as the last backup for scheduling.
    await BackupPreferences.recordSuccessfulBackup(target, Date.parse(target.modifiedTime) || Date.now());

    reportProgress(PROGRESS.complete, i18n.t('backup.stageRestoreComplete'));
    LoggerService.info('CLOUD_RESTORE', `Restored backup ${target.id} (${target.size} bytes)`);
    result = target;
    return target;
  } catch (e) {
    LoggerService.warn('CLOUD_RESTORE', 'Restore failed', e);
    throw toUserFacingError(e);
  } finally {
    endOperation(result);
  }
}

/**
 * Downloads the latest Drive backup and replaces local data with it. Holds the shared operation
 * slot for the whole run, so no auto-backup can snapshot a half-replaced database.
 * Callers should reload the app afterwards: providers hold state read before the restore.
 */
export function runCloudRestore(): Promise<CloudBackupFileMeta> {
  if (!tryBeginOperation('restore', i18n.t('backup.stageLocating'))) {
    return Promise.reject(new BackupInProgressError());
  }
  return execute();
}
