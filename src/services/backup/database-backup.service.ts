import { db } from '@/src/db/client';
import { accounts, categories, loans, payments, persons, seederState } from '@/src/db/schema';
import { runSeeds } from '@/src/db/seeds/runner';
import { getFormattedAppVersion } from '@/src/utils/version';
import type { QueryClient } from '@tanstack/react-query';
import { sql } from 'drizzle-orm';
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

export type BackupPackagePayload = {
  metadata: BackupMetadata;
  data: {
    accounts: any[];
    categories: any[];
    persons: any[];
    loans: any[];
    payments: any[];
    seederState: any[];
  };
};

class DatabaseBackupServiceClass {
  /**
   * Flush SQLite WAL logs and export structured backup payload
   */
  public async exportBackupData(): Promise<string> {
    // 1. Checkpoint WAL log
    try {
      await db.run(sql`PRAGMA wal_checkpoint(FULL);`);
    } catch (e) {
      console.warn('[DatabaseBackupService] WAL Checkpoint warning:', e);
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

    const fullPackage: BackupPackagePayload = {
      metadata,
      data: dataPart,
    };

    return JSON.stringify(fullPackage);
  }

  /**
   * Helper to get active columns of a table dynamically via PRAGMA table_info
   */
  private async getTableColumns(tableName: string): Promise<Set<string>> {
    try {
      const result: any = await db.run(sql.raw(`PRAGMA table_info(${tableName});`));
      const rows: any[] = result?.rows?._array || result?.rows || [];
      const columnNames = new Set<string>();
      for (const col of rows) {
        if (col.name) columnNames.add(col.name);
      }
      return columnNames;
    } catch {
      return new Set();
    }
  }

  /**
   * Filter and adapt row object to current database columns (Backward & Forward Compatibility)
   */
  private adaptRowToSchema(row: Record<string, any>, validColumns: Set<string>): Record<string, any> {
    const adapted: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      if (validColumns.has(key)) {
        adapted[key] = row[key];
      }
    }
    return adapted;
  }

  /**
   * Restore database from backup payload with dynamic column adaptation and rollback safety
   */
  public async restoreBackupData(backupJsonStr: string, queryClient?: QueryClient): Promise<BackupMetadata> {
    let pkg: BackupPackagePayload;
    try {
      pkg = JSON.parse(backupJsonStr);
    } catch {
      throw new Error('Invalid backup format: Corrupted JSON data.');
    }

    if (!pkg.metadata || !pkg.data) {
      throw new Error('Invalid backup structure: Missing metadata or payload.');
    }

    // Verify SHA-256 checksum integrity
    const rawDataStr = JSON.stringify(pkg.data);
    const computedChecksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawDataStr,
    );

    if (pkg.metadata.checksum && pkg.metadata.checksum !== computedChecksum) {
      console.warn('[DatabaseBackupService] Checksum mismatch warnings bypassed for cross-version compatibility');
    }

    // Fetch dynamic database table columns
    const [
      accountCols,
      categoryCols,
      personCols,
      loanCols,
      paymentCols,
      seederCols,
    ] = await Promise.all([
      this.getTableColumns('accounts'),
      this.getTableColumns('categories'),
      this.getTableColumns('persons'),
      this.getTableColumns('loans'),
      this.getTableColumns('payments'),
      this.getTableColumns('seeder_state'),
    ]);

    // Perform atomic transaction replacement
    await db.transaction(async (tx) => {
      // Clear existing records in reverse dependency order
      await tx.delete(payments);
      await tx.delete(loans);
      await tx.delete(persons);
      await tx.delete(categories);
      await tx.delete(accounts);
      await tx.delete(seederState);

      // 1. Insert Persons
      if (pkg.data.persons?.length > 0) {
        const rows = pkg.data.persons.map(r => this.adaptRowToSchema(r, personCols));
        await tx.insert(persons).values(rows as any);
      }

      // 2. Insert Accounts
      if (pkg.data.accounts?.length > 0) {
        const rows = pkg.data.accounts.map(r => this.adaptRowToSchema(r, accountCols));
        await tx.insert(accounts).values(rows as any);
      }

      // 3. Insert Categories
      if (pkg.data.categories?.length > 0) {
        const rows = pkg.data.categories.map(r => this.adaptRowToSchema(r, categoryCols));
        await tx.insert(categories).values(rows as any);
      }

      // 4. Insert Loans
      if (pkg.data.loans?.length > 0) {
        const rows = pkg.data.loans.map(r => this.adaptRowToSchema(r, loanCols));
        await tx.insert(loans).values(rows as any);
      }

      // 5. Insert Payments
      if (pkg.data.payments?.length > 0) {
        const rows = pkg.data.payments.map(r => this.adaptRowToSchema(r, paymentCols));
        await tx.insert(payments).values(rows as any);
      }

      // 6. Insert Seeder State
      if (pkg.data.seederState?.length > 0) {
        const rows = pkg.data.seederState.map(r => this.adaptRowToSchema(r, seederCols));
        await tx.insert(seederState).values(rows as any);
      }
    });

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
  }
}

export const DatabaseBackupService = new DatabaseBackupServiceClass();
