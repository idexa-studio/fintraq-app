import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const FINTRAQ_MIGRATION_MARKER = '@fintraq_namespace_migrated_v2';

const LUNO_STORAGE_KEYS = {
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

const KEEP_STORAGE_KEYS = {
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

const FINTRAQ_STORAGE_KEYS = {
  PROFILE: '@fintraq_profile',
  ONBOARDED: '@fintraq_onboarded',
  PREMIUM: '@fintraq_premium_v7',
  PREMIUM_DEV_OVERRIDE: '@fintraq_dev_force_pro',
  UPSELL_DISMISSED_AT: '@fintraq/upsell_dismissed_at',
  SEED_EXECUTED: '@fintraq_seed_v2',
  RECENT_SEARCHES: '@fintraq_recent_searches',
  WALKTHROUGH_DASHBOARD: '@fintraq_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES: '@fintraq_walkthrough_categories',
  WALKTHROUGH_ANALYTICS: '@fintraq_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS: '@fintraq_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS: '@fintraq_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH: '@fintraq_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE: '@fintraq_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS: '@fintraq_walkthrough_persons',
};

const LUNO_SECURE_KEYS = {
  PIN_HASH: 'luno_lock_pin_hash',
  LOCK_MODE: 'luno_lock_mode',
};

const KEEP_SECURE_KEYS = {
  PIN_HASH: 'keep_lock_pin_hash',
  LOCK_MODE: 'keep_lock_mode',
};

const FINTRAQ_SECURE_KEYS = {
  PIN_HASH: 'fintraq_lock_pin_hash',
  LOCK_MODE: 'fintraq_lock_mode',
};

const LEGACY_STORAGE_KEYSETS = [KEEP_STORAGE_KEYS, LUNO_STORAGE_KEYS] as const;
const LEGACY_SECURE_KEYSETS = [KEEP_SECURE_KEYS, LUNO_SECURE_KEYS] as const;

const STORAGE_KEY_NAMES = Object.keys(FINTRAQ_STORAGE_KEYS) as (keyof typeof FINTRAQ_STORAGE_KEYS)[];
const SECURE_KEY_NAMES = Object.keys(FINTRAQ_SECURE_KEYS) as (keyof typeof FINTRAQ_SECURE_KEYS)[];

export class LocalMigrationService {
  /**
   * Migrate legacy luno/keep database files, AsyncStorage keys, and SecureStore
   * keys to fintraq namespace equivalents in this version.
   */
  static async execute(): Promise<void> {
    try {
      const alreadyMigrated = await AsyncStorage.getItem(FINTRAQ_MIGRATION_MARKER);
      if (alreadyMigrated === 'true') {
        return;
      }

      console.log('[LocalMigrationService] Executing Fintraq namespace storage migration...');

      const sqliteDir = new Directory(Paths.document, 'SQLite');
      const lunoDbFile = new File(sqliteDir, 'luno.db');
      const keepDbFile = new File(sqliteDir, 'keep.db');
      const fintraqDbFile = new File(sqliteDir, 'fintraq.db');

      let sourceDbFile: File | null = null;
      let dbPrefix: string = '';

      if (!fintraqDbFile.exists && keepDbFile.exists) {
        sourceDbFile = keepDbFile;
        dbPrefix = 'keep.db';
        console.log('[LocalMigrationService] Keep database found. Will migrate to fintraq.db.');
      } else if (!fintraqDbFile.exists && lunoDbFile.exists) {
        sourceDbFile = lunoDbFile;
        dbPrefix = 'luno.db';
        console.log('[LocalMigrationService] Legacy luno database found. Will migrate to fintraq.db.');
      }

      // 1. Migrate SQLite database files
      if (sourceDbFile && sourceDbFile.exists) {
        // Ensure SQLite target dir exists
        if (!sqliteDir.exists) {
          sqliteDir.create({ intermediates: true, idempotent: true });
        }

        // Copy database file
        sourceDbFile.copy(fintraqDbFile);

        // Copy optional SQLite journal files if they exist (WAL mode, etc.)
        const filesToCopy = ['-journal', '-wal', '-shm'];
        for (const suffix of filesToCopy) {
          const legacyFile = new File(sqliteDir, `${dbPrefix}${suffix}`);
          const newFile = new File(sqliteDir, `fintraq.db${suffix}`);
          if (legacyFile.exists) {
            legacyFile.copy(newFile);
          }
        }
        console.log('[LocalMigrationService] SQLite files migrated successfully.');
      }

      // 2. Migrate AsyncStorage keys
      for (const keyName of STORAGE_KEY_NAMES) {
        const newKey = FINTRAQ_STORAGE_KEYS[keyName];
        let existingNewValue = await AsyncStorage.getItem(newKey);

        for (const legacyKeys of LEGACY_STORAGE_KEYSETS) {
          const legacyKey = legacyKeys[keyName];
          const legacyValue = await AsyncStorage.getItem(legacyKey);

          if (legacyValue === null) {
            continue;
          }

          if (existingNewValue === null) {
            await AsyncStorage.setItem(newKey, legacyValue);
            existingNewValue = legacyValue;
          }

          await AsyncStorage.removeItem(legacyKey);
        }
      }
      console.log('[LocalMigrationService] AsyncStorage keys migrated successfully.');

      // 3. Migrate SecureStore keys
      for (const keyName of SECURE_KEY_NAMES) {
        const newKey = FINTRAQ_SECURE_KEYS[keyName];
        let existingNewValue = await SecureStore.getItemAsync(newKey);

        for (const legacyKeys of LEGACY_SECURE_KEYSETS) {
          const legacyKey = legacyKeys[keyName];
          const legacyValue = await SecureStore.getItemAsync(legacyKey);

          if (legacyValue === null) {
            continue;
          }

          if (existingNewValue === null) {
            await SecureStore.setItemAsync(newKey, legacyValue);
            existingNewValue = legacyValue;
          }

          await SecureStore.deleteItemAsync(legacyKey);
        }
      }
      console.log('[LocalMigrationService] SecureStore keys migrated successfully.');

      // 4. Mark migration as executed
      await AsyncStorage.setItem(FINTRAQ_MIGRATION_MARKER, 'true');
      console.log('[LocalMigrationService] Fintraq namespace migration completed successfully.');
    } catch (error) {
      console.error('[LocalMigrationService] Error during database/keys migration:', error);
      // Fail silently to let the app load instead of rendering a white screen
    }
  }
}
