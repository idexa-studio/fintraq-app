import { db } from '@/src/db/client';
import { accounts, categories, payments, persons } from '@/src/db/schema';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseKeys, StorageKeys } from '@/src/constants/keys';
import { BackupLock } from '@/src/services/backup/backup-lock';
import { LoggerService } from '@/src/services/logger.service';

export class MigrationSeedService {
  private static activePromise: Promise<any> | null = null;

  /** Waits for any in-flight writeMigrationSeed to finish. */
  static async waitForPendingWrite(): Promise<void> {
    if (this.activePromise) {
      try {
        await this.activePromise;
      } catch {
        // Ignore background write errors
      }
    }
  }

  /** Snapshots DB tables + AsyncStorage keys to a JSON file for the future Flutter app. */
  static async writeMigrationSeed(): Promise<{ success: boolean; path?: string; error?: string }> {
    if (BackupLock.isRestoring()) {
      return { success: false, error: 'Skipped: database restore in progress.' };
    }

    if (this.activePromise) {
      return { success: false, error: 'Skipped: write operation already in progress.' };
    }

    const task = (async () => {
      try {
        // 1. Fetch SQLite tables
        const allAccounts = await db.select().from(accounts);
        const allCategories = await db.select().from(categories);
        const allPayments = await db.select().from(payments);
        const allPersons = await db.select().from(persons);

        // 2. Fetch AsyncStorage settings/keys
        const profileRaw = await AsyncStorage.getItem(StorageKeys.PROFILE);
        const onboardedRaw = await AsyncStorage.getItem(StorageKeys.ONBOARDED);
        const premiumRaw = await AsyncStorage.getItem(StorageKeys.PREMIUM);

        const seedData = {
          meta: {
            platform: 'react-native',
            exportTime: new Date().toISOString(),
            app: 'Fintraq',
            schemaVersion: 1,
          },
          database: {
            accounts: allAccounts,
            categories: allCategories,
            payments: allPayments,
            persons: allPersons,
          },
          asyncStorage: {
            profile: profileRaw ? JSON.parse(profileRaw) : null,
            onboarded: onboardedRaw === 'true',
            premium: premiumRaw ? JSON.parse(premiumRaw) : null,
          },
        };

        const seedFile = new File(Paths.document, DatabaseKeys.MIGRATION_SEED_FILENAME);
        await seedFile.write(JSON.stringify(seedData, null, 2));

        if (__DEV__) {
          LoggerService.info('MIGRATION_SEED', `Migration seed saved to ${seedFile.uri}`);
        }
        return { success: true, path: seedFile.uri };
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        LoggerService.error('MIGRATION_SEED', 'Failed to write migration seed', e);
        return { success: false, error: errorMsg };
      } finally {
        MigrationSeedService.activePromise = null;
      }
    })();

    this.activePromise = task;
    return await task;
  }
}
