import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const MIGRATION_MARKER = '@keep_namespace_migrated_v1';

const LEGACY_STORAGE_KEYS = {
  PROFILE: '@luno_profile',
  ONBOARDED: '@luno_onboarded',
  PREMIUM: '@luno_premium_v7',
  PREMIUM_DEV_OVERRIDE: '@luno_dev_force_pro',
  UPSELL_DISMISSED_AT: '@luno/upsell_dismissed_at',
  SEED_EXECUTED: '@luno_seed_v2',
  RECENT_SEARCHES: '@luno_recent_searches',
  WALKTHROUGH_DASHBOARD: '@luno_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES: '@luno_walkthrough_categories',
  WALKTHROUGH_ANALYTICS: '@luno_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS: '@luno_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS: '@luno_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH: '@luno_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE: '@luno_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS: '@luno_walkthrough_persons',
};

const NEW_STORAGE_KEYS = {
  PROFILE: '@keep_profile',
  ONBOARDED: '@keep_onboarded',
  PREMIUM: '@keep_premium_v7',
  PREMIUM_DEV_OVERRIDE: '@keep_dev_force_pro',
  UPSELL_DISMISSED_AT: '@keep/upsell_dismissed_at',
  SEED_EXECUTED: '@keep_seed_v2',
  RECENT_SEARCHES: '@keep_recent_searches',
  WALKTHROUGH_DASHBOARD: '@keep_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES: '@keep_walkthrough_categories',
  WALKTHROUGH_ANALYTICS: '@keep_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS: '@keep_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS: '@keep_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH: '@keep_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE: '@keep_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS: '@keep_walkthrough_persons',
};

const LEGACY_SECURE_KEYS = {
  PIN_HASH: 'luno_lock_pin_hash',
  LOCK_MODE: 'luno_lock_mode',
};

const NEW_SECURE_KEYS = {
  PIN_HASH: 'keep_lock_pin_hash',
  LOCK_MODE: 'keep_lock_mode',
};

export class LocalMigrationService {
  /**
   * Migrate legacy luno database files, AsyncStorage keys, and SecureStore
   * keys to keep namespace equivalents in this version.
   */
  static async execute(): Promise<void> {
    try {
      const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_MARKER);
      if (alreadyMigrated === 'true') {
        return;
      }

      console.log('[LocalMigrationService] Executing Keep namespace storage migration...');

      // 1. Migrate SQLite database files
      const sqliteDir = new Directory(Paths.document, 'SQLite');
      const legacyDbFile = new File(sqliteDir, 'luno.db');
      const newDbFile = new File(sqliteDir, 'keep.db');

      if (legacyDbFile.exists) {
        console.log('[LocalMigrationService] Legacy luno.db database found. Copying to keep.db...');
        
        // Ensure SQLite target dir exists
        if (!sqliteDir.exists) {
          sqliteDir.create({ intermediates: true, idempotent: true });
        }

        // Copy database file
        legacyDbFile.copy(newDbFile);

        // Copy optional SQLite journal files if they exist (WAL mode, etc.)
        const filesToCopy = ['-journal', '-wal', '-shm'];
        for (const suffix of filesToCopy) {
          const legacyFile = new File(sqliteDir, `luno.db${suffix}`);
          const newFile = new File(sqliteDir, `keep.db${suffix}`);
          if (legacyFile.exists) {
            legacyFile.copy(newFile);
          }
        }
        console.log('[LocalMigrationService] SQLite files migrated successfully.');
      }

      // 2. Migrate AsyncStorage keys
      for (const [keyName, legacyKey] of Object.entries(LEGACY_STORAGE_KEYS)) {
        const newKey = NEW_STORAGE_KEYS[keyName as keyof typeof NEW_STORAGE_KEYS];
        const val = await AsyncStorage.getItem(legacyKey);
        if (val !== null) {
          await AsyncStorage.setItem(newKey, val);
          await AsyncStorage.removeItem(legacyKey);
        }
      }
      console.log('[LocalMigrationService] AsyncStorage keys migrated successfully.');

      // 3. Migrate SecureStore keys
      for (const [keyName, legacyKey] of Object.entries(LEGACY_SECURE_KEYS)) {
        const newKey = NEW_SECURE_KEYS[keyName as keyof typeof NEW_SECURE_KEYS];
        const val = await SecureStore.getItemAsync(legacyKey);
        if (val !== null) {
          await SecureStore.setItemAsync(newKey, val);
          await SecureStore.deleteItemAsync(legacyKey);
        }
      }
      console.log('[LocalMigrationService] SecureStore keys migrated successfully.');

      // 4. Mark migration as executed
      await AsyncStorage.setItem(MIGRATION_MARKER, 'true');
      console.log('[LocalMigrationService] Namespace migration completed successfully.');
    } catch (error) {
      console.error('[LocalMigrationService] Error during database/keys migration:', error);
      // Fail silently to let the app load instead of rendering a white screen
    }
  }
}
