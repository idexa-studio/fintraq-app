import * as Crypto from 'expo-crypto';
import { db, getExpoDb, resetDbConnections } from '@/data/db/client';
import { accounts, budgets, categories, loans, payments, persons, seederState } from '@/data/db/schema';
import { runSeeds } from '@/data/db/seeds/runner';
import { readStoredProfile, saveProfile } from '@/shared/settings/profile';
import type { UserProfile } from '@/shared/settings/profile';
import { LoggerService } from '@/shared/logging/logger';
import { getFormattedAppVersion } from '@/platform/config/version';
import {
  BackupData,
  BackupMetadata,
  BackupPackagePayload,
  BackupValidationError,
  buildRestorePlan,
  insertSql,
  parseBackupPackage,
  RESTORE_DELETE_ORDER,
} from '@/data/backup/snapshot';

// 2: `budgets` added. A reader of version 1 ignores the key; a version 1 file restores with none.
const BACKUP_FORMAT_VERSION = 2;
// Lets in-flight reads on the old connection settle before the tables are replaced.
const CONNECTION_DRAIN_MS = 150;

function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function readProfile(): Promise<Partial<UserProfile> | null> {
  try {
    return await readStoredProfile();
  } catch (e) {
    LoggerService.warn('DB_BACKUP', 'Could not read user profile for backup', e);
    return null;
  }
}

/** Snapshot export and atomic import of the local database (the file format lives in backup-snapshot). */
export const DatabaseBackupService = {
  async exportBackupData(): Promise<string> {
    try {
      getExpoDb().execSync('PRAGMA wal_checkpoint(PASSIVE);');
    } catch {
      // Passive checkpoint is opportunistic.
    }

    // One read transaction, so every table is read from the same point in time. Separate queries
    // could straddle a write and export a payment without its balance change, or a loan without
    // its payment. Sync API throughout: an `await` inside would end the transaction early.
    const data: BackupData = db.transaction((tx) => ({
      accounts: tx.select().from(accounts).all(),
      categories: tx.select().from(categories).all(),
      persons: tx.select().from(persons).all(),
      loans: tx.select().from(loans).all(),
      payments: tx.select().from(payments).all(),
      budgets: tx.select().from(budgets).all(),
      seederState: tx.select().from(seederState).all(),
    }));

    const metadata: BackupMetadata = {
      version: BACKUP_FORMAT_VERSION,
      appVersion: getFormattedAppVersion(),
      timestamp: new Date().toISOString(),
      // Restore re-stringifies the parsed `data` and compares, so hash exactly that serialisation.
      checksum: await sha256(JSON.stringify(data)),
      counts: {
        accounts: data.accounts.length,
        categories: data.categories.length,
        persons: data.persons.length,
        loans: data.loans.length,
        payments: data.payments.length,
        budgets: data.budgets?.length ?? 0,
      },
    };

    const pkg: BackupPackagePayload<Partial<UserProfile>> = { metadata, profile: await readProfile(), data };
    return JSON.stringify(pkg);
  },

  /**
   * Replaces all local data with the backup, atomically. Validation (structure, checksum,
   * non-empty) happens before anything is touched; the profile is applied only after the data
   * transaction commits, so a bad backup leaves the device exactly as it was.
   * The caller owns the operation lock and any cache invalidation.
   */
  async importBackupData(backupJson: string): Promise<BackupMetadata> {
    const pkg = parseBackupPackage(backupJson);

    if (pkg.metadata.checksum && pkg.metadata.checksum !== (await sha256(JSON.stringify(pkg.data)))) {
      throw new BackupValidationError('corrupted', 'Checksum mismatch');
    }

    const plan = buildRestorePlan(pkg.data, new Date().toISOString());

    // Fresh connection: drops cached statements and cursors held against the old tables.
    resetDbConnections();
    const expoDb = getExpoDb();
    try {
      expoDb.execSync('PRAGMA busy_timeout = 30000;');
      expoDb.execSync('PRAGMA wal_checkpoint(PASSIVE);');
    } catch (e) {
      LoggerService.warn('DB_BACKUP', 'Connection PRAGMA warning', e);
    }
    await new Promise((resolve) => setTimeout(resolve, CONNECTION_DRAIN_MS));

    // Must be set outside the transaction — SQLite ignores PRAGMA foreign_keys inside one.
    expoDb.execSync('PRAGMA foreign_keys = OFF;');
    try {
      expoDb.withTransactionSync(() => {
        RESTORE_DELETE_ORDER.forEach((table) => expoDb.execSync(`DELETE FROM ${table};`));
        for (const insert of plan) {
          const stmt = expoDb.prepareSync(insertSql(insert));
          try {
            insert.rows.forEach((row) => stmt.executeSync(row));
          } finally {
            stmt.finalizeSync();
          }
        }
      });
    } finally {
      expoDb.execSync('PRAGMA foreign_keys = ON;');
    }

    if (pkg.profile && typeof pkg.profile === 'object') {
      try {
        const current = await readProfile();
        await saveProfile({ ...current, ...pkg.profile });
      } catch (e) {
        LoggerService.warn('DB_BACKUP', 'Profile restore warning', e);
      }
    }

    // Guarantees mandatory system rows exist even if the backup predates them.
    try {
      await runSeeds();
    } catch (e) {
      LoggerService.warn('DB_BACKUP', 'Re-seed warning', e);
    }

    return pkg.metadata;
  },
};
