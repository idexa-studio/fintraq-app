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
  NAMESPACE_MIGRATED = '@fintraq_namespace_migrated_v2',
  BACKUP_PROMPT_DISMISSED_AT = '@fintraq_backup_prompt_dismissed_at',
  /** Local date (YYYY-MM-DD) whose daily reminder is skipped because the user already logged. */
  REMINDER_SKIPPED_DATE = '@fintraq_reminder_skipped_date',
  /** Set when the user closes Home's "Get started" checklist. */
  GETTING_STARTED_DISMISSED = '@fintraq_getting_started_dismissed',
  /** JSON list of the one-time tips closed and the tabs visited, by name. */
  GUIDE_SEEN = '@fintraq_guide_seen',
  /** The release whose "what is new" note was seen, as a number. Written at setup on a new install. */
  WHATS_NEW_SEEN = '@fintraq_whats_new_seen',

  // Walkthrough Keys
  WALKTHROUGH_DASHBOARD = '@fintraq_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES = '@fintraq_walkthrough_categories',
  WALKTHROUGH_ANALYTICS = '@fintraq_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS = '@fintraq_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS = '@fintraq_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH = '@fintraq_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE = '@fintraq_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS = '@fintraq_walkthrough_persons',

  // Auto-backup (see src/services/backup/auto-backup.service.ts)
  AUTO_BACKUP_ENABLED = '@fintraq_auto_backup_enabled',
  AUTO_BACKUP_LAST_BACKUP_META = '@fintraq_last_backup_meta',
  AUTO_BACKUP_LAST_AUTO_TIME = '@fintraq_last_auto_backup_time',
  /** Drive file id this install last backed up to or restored from. Survives disconnect. */
  AUTO_BACKUP_SYNCED_FILE_ID = '@fintraq_synced_backup_file_id',
  AUTO_BACKUP_LAST_REGISTERED_INTERVAL = '@fintraq_bg_task_last_interval',
  AUTO_BACKUP_BATTERY_PROMPT_SHOWN = '@fintraq_battery_prompt_shown',

  // Review prompt
  FIRST_LAUNCH_AT = '@fintraq_first_launch_at',
  REVIEW_REQUESTED_AT = '@fintraq_review_requested_at',
}

/** Retired key, no longer written — kept only so factory reset still clears it off old installs. */
export const RETIRED_AUTO_BACKUP_FREQUENCY_KEY = '@fintraq_auto_backup_frequency';

export enum SecureStoreKeys {
  PIN_HASH = 'fintraq_lock_pin_hash',
  LOCK_MODE = 'fintraq_lock_mode',
  /** JSON `{ count, until }`: consecutive wrong PINs and when the pad unlocks again (epoch ms). */
  PIN_FAILURES = 'fintraq_lock_pin_failures',
}

export enum DatabaseKeys {
  DB_NAME = 'fintraq.db',
}
