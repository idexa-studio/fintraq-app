import { db } from '@/src/db/client';
import { accounts, categories, payments, persons } from '@/src/db/schema';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseKeys, StorageKeys } from '@/src/constants/keys';

export class MigrationSeedService {
  /**
   * Snaps SQLite database tables and AsyncStorage keys and writes them to a JSON file
   * in the application's document directory so the future Flutter app can read it.
   */
  static async writeMigrationSeed(): Promise<{ success: boolean; path?: string; error?: string }> {
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
        console.log(`[MigrationSeedService] Migration seed saved successfully to: ${seedFile.uri}`);
      }
      return { success: true, path: seedFile.uri };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('[MigrationSeedService] Failed to write migration seed:', e);
      return { success: false, error: errorMsg };
    }
  }
}
