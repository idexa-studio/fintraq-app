/**
 * Global constants for AsyncStorage, SecureStore, and Database keys.
 */

export enum StorageKeys {
  PROFILE = '@fintraq_profile',
  ONBOARDED = '@fintraq_onboarded',
  PREMIUM = '@fintraq_premium_v7',
  PREMIUM_DEV_OVERRIDE = '@fintraq_dev_force_pro',
  UPSELL_DISMISSED_AT = '@fintraq/upsell_dismissed_at',
  SEED_EXECUTED = '@fintraq_seed_v2',
  RECENT_SEARCHES = '@fintraq_recent_searches',
  
  // Walkthrough Keys
  WALKTHROUGH_DASHBOARD = '@fintraq_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES = '@fintraq_walkthrough_categories',
  WALKTHROUGH_ANALYTICS = '@fintraq_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS = '@fintraq_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS = '@fintraq_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH = '@fintraq_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE = '@fintraq_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS = '@fintraq_walkthrough_persons',
}

export enum SecureStoreKeys {
  PIN_HASH = 'fintraq_lock_pin_hash',
  LOCK_MODE = 'fintraq_lock_mode',
}

export enum DatabaseKeys {
  DB_NAME = 'fintraq.db',
  MIGRATION_SEED_FILENAME = 'fintraq_migration_seed.json',
}
