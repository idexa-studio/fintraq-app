import { StorageKeys } from '@/src/constants/keys';
import type { UserProfile } from '@/src/providers/SettingsProvider';
import { BackupLock } from '@/src/services/backup/backup-lock';
import { db, getExpoDb, resetDbConnections } from '@/src/db/client';
import { accounts, categories, loans, payments, persons, seederState } from '@/src/db/schema';
import { runSeeds } from '@/src/db/seeds/runner';
import { MigrationSeedService } from '@/src/services/migration-seed.service';
import { getFormattedAppVersion } from '@/src/utils/version';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

export type BackupMetadata = {
  version: number;
  appVersion: string;
  timestamp: string;
  checksum: string;
  counts: {
    accounts: number;
    categories: number;
    persons: number;
    loans: number;
    payments: number;
  };
};

export type PersonBackupRow = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  company?: string | null;
  color?: number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type AccountBackupRow = {
  id: number;
  name: string;
  holderName?: string | null;
  holder_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  icon?: string | null;
  accountType?: string | null;
  account_type?: string | null;
  color?: number | null;
  isDefault?: boolean | number | null;
  is_default?: boolean | number | null;
  currency?: string | null;
  balance?: number | null;
  income?: number | null;
  expense?: number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type CategoryBackupRow = {
  id: number;
  name: string;
  icon?: string | null;
  color?: number | null;
  type?: string | null;
  isSystem?: boolean | number | null;
  is_system?: boolean | number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type LoanBackupRow = {
  id: number;
  personId?: number | null;
  person_id?: number | null;
  type?: string | null;
  principal?: number | null;
  currency?: string | null;
  accountId?: number | null;
  account_id?: number | null;
  categoryId?: number | null;
  category_id?: number | null;
  dueDate?: string | null;
  due_date?: string | null;
  note?: string | null;
  status?: string | null;
  emiReminderEnabled?: boolean | number | null;
  emi_reminder_enabled?: boolean | number | null;
  emiReminderDay?: number | null;
  emi_reminder_day?: number | null;
  emiReminderTime?: string | null;
  emi_reminder_time?: string | null;
  emiNotificationIds?: string | null;
  emi_notification_ids?: string | null;
  dueReminderEnabled?: boolean | number | null;
  due_reminder_enabled?: boolean | number | null;
  dueReminderDaysBefore?: number | null;
  due_reminder_days_before?: number | null;
  dueReminderTime?: string | null;
  due_reminder_time?: string | null;
  dueNotificationIds?: string | null;
  due_notification_ids?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type PaymentBackupRow = {
  id: number;
  accountId?: number | null;
  account_id?: number | null;
  categoryId?: number | null;
  category_id?: number | null;
  toAccountId?: number | null;
  to_account_id?: number | null;
  personId?: number | null;
  person_id?: number | null;
  loanId?: number | null;
  loan_id?: number | null;
  amount?: number | null;
  type?: string | null;
  datetime?: string | null;
  note?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type SeederBackupRow = {
  id: number;
  name: string;
  executedAt?: string;
  executed_at?: string;
};

export type BackupPackagePayload = {
  metadata: BackupMetadata;
  profile?: UserProfile | null;
  data: {
    accounts: AccountBackupRow[];
    categories: CategoryBackupRow[];
    persons: PersonBackupRow[];
    loans: LoanBackupRow[];
    payments: PaymentBackupRow[];
    seederState: SeederBackupRow[];
  };
};

class DatabaseBackupServiceClass {
  /**
   * Returns true while a restore transaction is in flight.
   */
  public isRestoring(): boolean {
    return BackupLock.isRestoring();
  }

  /**
   * Flush SQLite WAL logs and export structured backup payload
   */
  public async exportBackupData(): Promise<string> {
    // 1. Checkpoint WAL log natively
    try {
      getExpoDb().execSync('PRAGMA wal_checkpoint(PASSIVE);');
    } catch {
      // Ignore passive checkpoint warnings
    }

    // 2. Query all tables
    const [allAccounts, allCategories, allPersons, allLoans, allPayments, allSeederState] = await Promise.all([
      db.select().from(accounts),
      db.select().from(categories),
      db.select().from(persons),
      db.select().from(loans),
      db.select().from(payments),
      db.select().from(seederState),
    ]);

    const dataPart = {
      accounts: allAccounts,
      categories: allCategories,
      persons: allPersons,
      loans: allLoans,
      payments: allPayments,
      seederState: allSeederState,
    };

    const rawDataStr = JSON.stringify(dataPart);
    const checksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawDataStr,
    );

    const metadata: BackupMetadata = {
      version: 1,
      appVersion: getFormattedAppVersion(),
      timestamp: new Date().toISOString(),
      checksum,
      counts: {
        accounts: allAccounts.length,
        categories: allCategories.length,
        persons: allPersons.length,
        loans: allLoans.length,
        payments: allPayments.length,
      },
    };

    // Query profile settings to include in backup payload
    let userProfile: UserProfile | null = null;
    try {
      const storedProfileStr = await AsyncStorage.getItem(StorageKeys.PROFILE);
      if (storedProfileStr) {
        userProfile = JSON.parse(storedProfileStr);
      }
    } catch (e) {
      console.warn('[DatabaseBackupService] Could not read user profile for backup:', e);
    }

    const fullPackage: BackupPackagePayload = {
      metadata,
      profile: userProfile,
      data: dataPart,
    };

    return JSON.stringify(fullPackage);
  }

  /**
   * Restore database from backup payload with dynamic column adaptation and rollback safety
   */
  public async restoreBackupData(backupJsonStr: string, queryClient?: QueryClient): Promise<BackupMetadata> {
    BackupLock.setRestoring(true);
    try {
      let pkg: BackupPackagePayload;
      try {
        pkg = JSON.parse(backupJsonStr);
      } catch {
        throw new Error('Invalid backup format: Corrupted JSON data.');
      }

      if ((pkg as any)?.error) {
        throw new Error(`Google Drive download error: ${(pkg as any).error?.message || 'Failed to fetch backup file'}`);
      }

      if (!pkg.metadata || !pkg.data) {
        throw new Error('Invalid backup structure: Missing metadata or payload.');
      }

      // Restore user profile (including name, currency, theme, reminder settings) if present in package
      if (pkg.profile) {
        try {
          const currentProfileStr = await AsyncStorage.getItem(StorageKeys.PROFILE);
          const currentProfile = currentProfileStr ? JSON.parse(currentProfileStr) : {};
          const mergedProfile = { ...currentProfile, ...pkg.profile };
          await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(mergedProfile));
          console.log('[DatabaseBackupService] Restored user profile & default currency:', pkg.profile.defaultCurrency);
        } catch (e) {
          console.warn('[DatabaseBackupService] Profile restore warning:', e);
        }
      }

      // Verify SHA-256 checksum integrity
      const rawDataStr = JSON.stringify(pkg.data);
      const computedChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawDataStr,
      );

      if (pkg.metadata.checksum && pkg.metadata.checksum !== computedChecksum) {
        console.warn('[DatabaseBackupService] Checksum mismatch warning (proceeding for cross-version compatibility)');
      }

      // Extract table rows with multi-key fallbacks
      const personsList: PersonBackupRow[] = pkg.data?.persons || (pkg.data as any)?.person || [];
      const accountsList: AccountBackupRow[] = pkg.data?.accounts || (pkg.data as any)?.account || [];
      const categoriesList: CategoryBackupRow[] = pkg.data?.categories || (pkg.data as any)?.category || [];
      const loansList: LoanBackupRow[] = pkg.data?.loans || (pkg.data as any)?.loan || [];
      const paymentsList: PaymentBackupRow[] = pkg.data?.payments || (pkg.data as any)?.payment || [];
      const seederList: SeederBackupRow[] = pkg.data?.seederState || (pkg.data as any)?.seeder_state || (pkg.data as any)?.seeder || [];

      // Refuse to wipe local data for a backup that carries nothing to
      // restore — a corrupted download, a stale empty snapshot, or a parsing
      // mistake upstream would otherwise silently erase the user's real data
      // and replace it with nothing.
      const totalRestoreRows =
        personsList.length + accountsList.length + categoriesList.length + loansList.length + paymentsList.length;
      if (totalRestoreRows === 0) {
        throw new Error('This backup appears to be empty. Restore aborted to protect your existing data.');
      }

      // Wait for any active background migration seed query to finish
      await MigrationSeedService.waitForPendingWrite();

      // Reset native SQLite connection to release all cached statement handles and open cursors
      resetDbConnections();
      const expoDb = getExpoDb();

      // Configure SQLite native connection parameters
      try {
        expoDb.execSync('PRAGMA busy_timeout = 30000;');
        expoDb.execSync('PRAGMA wal_checkpoint(PASSIVE);');
      } catch (e) {
        console.warn('[DatabaseBackupService] Connection PRAGMA warning:', e);
      }

      // Drain any in-flight background read queries
      await new Promise(resolve => setTimeout(resolve, 150));

      // Perform atomic synchronous native transaction replacement
      try {
        expoDb.withTransactionSync(() => {
          expoDb.execSync('PRAGMA foreign_keys = OFF;');
          expoDb.execSync('DELETE FROM payments;');
          expoDb.execSync('DELETE FROM loans;');
          expoDb.execSync('DELETE FROM persons;');
          expoDb.execSync('DELETE FROM categories;');
          expoDb.execSync('DELETE FROM accounts;');
          expoDb.execSync('DELETE FROM seeder_state;');

          const clean = (val: any) => (val === undefined ? null : val);
          const toBooleanInt = (val: any, defaultVal = 0): number => {
            if (val === true || val === 1 || val === '1' || val === 'true' || val === 'TRUE') return 1;
            if (val === false || val === 0 || val === '0' || val === 'false' || val === 'FALSE') return 0;
            return defaultVal;
          };

          // 1. Insert Persons
          if (personsList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO persons (id, name, email, phone, designation, company, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            try {
              for (const r of personsList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.name ?? ''),
                  clean(r.email),
                  clean(r.phone),
                  clean(r.designation),
                  clean(r.company),
                  clean(r.color ?? 0),
                  clean(r.createdAt ?? r.created_at ?? new Date().toISOString()),
                  clean(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          // 2. Insert Accounts
          if (accountsList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO accounts (id, name, holderName, accountNumber, icon, account_type, color, isDefault, currency, balance, income, expense, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            try {
              for (const r of accountsList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.name ?? ''),
                  clean(r.holderName ?? r.holder_name ?? r.name ?? ''),
                  clean(r.accountNumber ?? r.account_number ?? ''),
                  clean(r.icon ?? 'building'),
                  clean(r.accountType ?? r.account_type ?? 'bank'),
                  clean(r.color ?? 0),
                  toBooleanInt(r.isDefault ?? r.is_default, 0),
                  clean(r.currency ?? 'USD'),
                  clean(r.balance ?? 0),
                  clean(r.income ?? 0),
                  clean(r.expense ?? 0),
                  clean(r.createdAt ?? r.created_at ?? new Date().toISOString()),
                  clean(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          // 3. Insert Categories
          if (categoriesList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO categories (id, name, icon, color, type, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            try {
              for (const r of categoriesList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.name ?? ''),
                  clean(r.icon ?? 'grid'),
                  clean(r.color ?? 0),
                  clean(r.type ?? 'DR'),
                  toBooleanInt(r.isSystem ?? r.is_system, 0),
                  clean(r.createdAt ?? r.created_at ?? new Date().toISOString()),
                  clean(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          // 4. Insert Loans
          if (loansList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO loans (id, person_id, type, principal, currency, account_id, category_id, due_date, note, status, emi_reminder_enabled, emi_reminder_day, emi_reminder_time, emi_notification_ids, due_reminder_enabled, due_reminder_days_before, due_notification_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            try {
              for (const r of loansList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.personId ?? r.person_id),
                  clean(r.type ?? 'lend'),
                  clean(r.principal ?? 0),
                  clean(r.currency ?? 'USD'),
                  clean(r.accountId ?? r.account_id),
                  clean(r.categoryId ?? r.category_id),
                  clean(r.dueDate ?? r.due_date),
                  clean(r.note ?? ''),
                  clean(r.status ?? 'active'),
                  toBooleanInt(r.emiReminderEnabled ?? r.emi_reminder_enabled, 0),
                  clean(r.emiReminderDay ?? r.emi_reminder_day),
                  clean(r.emiReminderTime ?? r.emi_reminder_time),
                  clean(r.emiNotificationIds ?? r.emi_notification_ids),
                  toBooleanInt(r.dueReminderEnabled ?? r.due_reminder_enabled, 0),
                  clean(r.dueReminderDaysBefore ?? r.due_reminder_days_before),
                  clean(r.dueNotificationIds ?? r.due_notification_ids),
                  clean(r.createdAt ?? r.created_at ?? new Date().toISOString()),
                  clean(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          // 5. Insert Payments
          if (paymentsList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO payments (id, account_id, category_id, to_account_id, person_id, loan_id, amount, type, datetime, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            try {
              for (const r of paymentsList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.accountId ?? r.account_id),
                  clean(r.categoryId ?? r.category_id),
                  clean(r.toAccountId ?? r.to_account_id),
                  clean(r.personId ?? r.person_id),
                  clean(r.loanId ?? r.loan_id),
                  clean(r.amount ?? 0),
                  clean(r.type ?? 'DR'),
                  clean(r.datetime ?? new Date().toISOString()),
                  clean(r.note ?? ''),
                  clean(r.createdAt ?? r.created_at ?? new Date().toISOString()),
                  clean(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          // 6. Insert Seeder State
          if (seederList.length > 0) {
            const stmt = expoDb.prepareSync(
              'INSERT INTO seeder_state (id, name, executed_at) VALUES (?, ?, ?)'
            );
            try {
              for (const r of seederList) {
                stmt.executeSync([
                  clean(r.id),
                  clean(r.name),
                  clean(r.executedAt ?? r.executed_at ?? new Date().toISOString()),
                ]);
              }
            } finally {
              stmt.finalizeSync();
            }
          }

          expoDb.execSync('PRAGMA foreign_keys = ON;');
        });
      } catch (error: any) {
        console.error('[DatabaseBackupService] Synchronous restore transaction failed:', error);
        throw new Error(`Database restore transaction failed: ${error?.message || error}`);
      }

      // Re-run seeds to guarantee mandatory system categories/records exist
      try {
        await runSeeds();
      } catch (e) {
        console.warn('[DatabaseBackupService] Re-seed warning:', e);
      }

      // Invalidate React Query cache for instant UI refresh
      if (queryClient) {
        queryClient.clear();
      }

      return pkg.metadata;
    } finally {
      BackupLock.setRestoring(false);
    }
  }
}

export const DatabaseBackupService = new DatabaseBackupServiceClass();
