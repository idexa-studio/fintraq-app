import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { StorageKeys } from '@/src/constants/keys';
import { db, getExpoDb, resetDbConnections } from '@/src/db/client';
import { accounts, categories, loans, payments, persons, seederState } from '@/src/db/schema';
import { runSeeds } from '@/src/db/seeds/runner';
import type { UserProfile } from '@/src/providers/SettingsProvider';
import { LoggerService } from '@/src/services/logger.service';
import { getFormattedAppVersion } from '@/src/utils/version';
import {
  BackupData,
  BackupMetadata,
  BackupPackagePayload,
  BackupValidationError,
  buildRestorePlan,
  insertSql,
  parseBackupPackage,
  RESTORE_DELETE_ORDER,
} from './backup-snapshot';

const BACKUP_FORMAT_VERSION = 1;
// Lets in-flight reads on the old connection settle before the tables are replaced.
const CONNECTION_DRAIN_MS = 150;

function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function readProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.PROFILE);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
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

    const [allAccounts, allCategories, allPersons, allLoans, allPayments, allSeederState] = await Promise.all([
      db.select().from(accounts),
      db.select().from(categories),
      db.select().from(persons),
      db.select().from(loans),
      db.select().from(payments),
      db.select().from(seederState),
    ]);

    const data: BackupData = {
      accounts: allAccounts,
      categories: allCategories,
      persons: allPersons,
      loans: allLoans,
      payments: allPayments,
      seederState: allSeederState,
    };

    const metadata: BackupMetadata = {
      version: BACKUP_FORMAT_VERSION,
      appVersion: getFormattedAppVersion(),
      timestamp: new Date().toISOString(),
      // Restore re-stringifies the parsed `data` and compares, so hash exactly that serialisation.
      checksum: await sha256(JSON.stringify(data)),
      counts: {
        accounts: allAccounts.length,
        categories: allCategories.length,
        persons: allPersons.length,
        loans: allLoans.length,
        payments: allPayments.length,
      },
    };

    const pkg: BackupPackagePayload<UserProfile> = { metadata, profile: await readProfile(), data };
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
        await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify({ ...current, ...pkg.profile }));
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
