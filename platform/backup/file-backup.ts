import { parseBackupPackage } from '@/data/backup/snapshot';
import type { BackupMetadata } from '@/data/backup/snapshot';
import { BackupInProgressError } from '@/platform/drive/google-drive.errors';
import { LoggerService } from '@/shared/logging/logger';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { endOperation, tryBeginOperation } from './backup-state';
import { DatabaseBackupService } from './database-backup';

/** The name a backup file is given: "fintraq_backup_2026-10-08.json". */
export function backupFileName(day: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `fintraq_backup_${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}.json`;
}

/** A backup file the user chose, read and checked, waiting to be restored. */
export type ChosenBackup = { json: string; metadata: BackupMetadata };

/**
 * Makes the full backup as a file and hands it to the system's share sheet, where the user
 * saves it to the phone or sends it to themselves. The file is the same snapshot a Drive backup
 * uploads, so either can be restored anywhere. Holds the shared operation slot while the
 * snapshot is taken, so it can never be taken across a restore.
 */
export async function saveBackupFile(dialogTitle: string): Promise<void> {
  if (!tryBeginOperation('backup', '')) throw new BackupInProgressError();
  let file: File;
  try {
    const json = await DatabaseBackupService.exportBackupData();
    file = new File(Paths.cache, backupFileName());
    file.write(json);
  } finally {
    endOperation();
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle });
}

/**
 * Lets the user choose a backup file and checks it is one before anything is touched. Resolves
 * null when they back out of choosing; throws `BackupValidationError` when the file is not a
 * Fintraq backup or is damaged.
 */
export async function chooseBackupFile(): Promise<ChosenBackup | null> {
  // Only its text is needed; the chooser's own file type differs from the one this module writes with.
  let picked: { text(): Promise<string> } | { text(): Promise<string> }[];
  try {
    picked = await File.pickFileAsync(undefined, 'application/json');
  } catch (e) {
    // The chooser rejects when it is dismissed; that is a change of mind, not a failure.
    LoggerService.info('FILE_BACKUP', 'No file chosen', e);
    return null;
  }
  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;
  const json = await file.text();
  return { json, metadata: parseBackupPackage(json).metadata };
}

/**
 * Replaces everything on this phone with what the chosen file holds. Runs the same checked,
 * all-or-nothing import a Drive restore does, under the shared operation slot. The caller
 * restarts the app afterwards: what is held in memory describes the data that was replaced.
 */
export async function restoreBackupFile(chosen: ChosenBackup): Promise<BackupMetadata> {
  if (!tryBeginOperation('restore', '')) throw new BackupInProgressError();
  try {
    return await DatabaseBackupService.importBackupData(chosen.json);
  } catch (e) {
    LoggerService.warn('FILE_BACKUP', 'Restore from a file failed', e);
    throw e;
  } finally {
    endOperation();
  }
}
