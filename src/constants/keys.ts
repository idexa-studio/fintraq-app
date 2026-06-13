/**
 * Global constants for AsyncStorage, SecureStore, and Database keys.
 */

export enum StorageKeys {
  PROFILE = '@keep_profile',
  ONBOARDED = '@keep_onboarded',
  PREMIUM = '@keep_premium_v7',
  PREMIUM_DEV_OVERRIDE = '@keep_dev_force_pro',
  UPSELL_DISMISSED_AT = '@keep/upsell_dismissed_at',
  SEED_EXECUTED = '@keep_seed_v2',
  RECENT_SEARCHES = '@keep_recent_searches',
  
  // Walkthrough Keys
  WALKTHROUGH_DASHBOARD = '@keep_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES = '@keep_walkthrough_categories',
  WALKTHROUGH_ANALYTICS = '@keep_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS = '@keep_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS = '@keep_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH = '@keep_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE = '@keep_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS = '@keep_walkthrough_persons',
}

export enum SecureStoreKeys {
  PIN_HASH = 'keep_lock_pin_hash',
  LOCK_MODE = 'keep_lock_mode',
}

export enum DatabaseKeys {
  DB_NAME = 'keep.db',
  MIGRATION_SEED_FILENAME = 'keep_migration_seed.json',
}
