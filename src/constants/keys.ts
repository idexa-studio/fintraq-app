/**
 * Global constants for AsyncStorage, SecureStore, and Database keys.
 */

export enum StorageKeys {
  PROFILE = '@luno_profile',
  ONBOARDED = '@luno_onboarded',
  PREMIUM = '@luno_premium_v7',
  PREMIUM_DEV_OVERRIDE = '@luno_dev_force_pro',
  UPSELL_DISMISSED_AT = '@luno/upsell_dismissed_at',
  SEED_EXECUTED = '@luno_seed_v2',
  RECENT_SEARCHES = '@luno_recent_searches',
  
  // Walkthrough Keys
  WALKTHROUGH_DASHBOARD = '@luno_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES = '@luno_walkthrough_categories',
  WALKTHROUGH_ANALYTICS = '@luno_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS = '@luno_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS = '@luno_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH = '@luno_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE = '@luno_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS = '@luno_walkthrough_persons',
}

export enum SecureStoreKeys {
  PIN_HASH = 'luno_lock_pin_hash',
  LOCK_MODE = 'luno_lock_mode',
}

export enum DatabaseKeys {
  DB_NAME = 'luno.db',
  MIGRATION_SEED_FILENAME = 'flutter_migration_seed.json',
}
