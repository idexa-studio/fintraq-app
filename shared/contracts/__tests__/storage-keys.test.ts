import { DatabaseKeys, RETIRED_AUTO_BACKUP_FREQUENCY_KEY, SecureStoreKeys, StorageKeys } from '@/shared/contracts/storage-keys';

/**
 * Every key the app has written to a user's phone. A renamed or removed key
 * silently orphans whatever an existing install saved under it (settings,
 * the Pro licence, the PIN), so this list only ever grows.
 */
const STORAGE_KEYS_ON_DEVICES: Record<string, string> = {
  PROFILE: '@fintraq_profile',
  ONBOARDED: '@fintraq_onboarded',
  PREMIUM: '@fintraq_premium_v7',
  PREMIUM_DEV_OVERRIDE: '@fintraq_dev_force_pro',
  UPSELL_DISMISSED_AT: '@fintraq/upsell_dismissed_at',
  SEED_EXECUTED: '@fintraq_seed_v2',
  RECENT_SEARCHES: '@fintraq_recent_searches',
  NAMESPACE_MIGRATED: '@fintraq_namespace_migrated_v2',
  BACKUP_PROMPT_DISMISSED_AT: '@fintraq_backup_prompt_dismissed_at',
  REMINDER_SKIPPED_DATE: '@fintraq_reminder_skipped_date',
  GETTING_STARTED_DISMISSED: '@fintraq_getting_started_dismissed',
  GUIDE_SEEN: '@fintraq_guide_seen',
  WHATS_NEW_SEEN: '@fintraq_whats_new_seen',
  WALKTHROUGH_DASHBOARD: '@fintraq_walkthrough_dashboard',
  WALKTHROUGH_CATEGORIES: '@fintraq_walkthrough_categories',
  WALKTHROUGH_ANALYTICS: '@fintraq_walkthrough_analytics',
  WALKTHROUGH_ACCOUNTS: '@fintraq_walkthrough_accounts',
  WALKTHROUGH_TRANSACTIONS: '@fintraq_walkthrough_transactions_list',
  WALKTHROUGH_SEARCH: '@fintraq_walkthrough_search',
  WALKTHROUGH_TRANSACTION_CREATE: '@fintraq_walkthrough_transaction_create',
  WALKTHROUGH_PERSONS: '@fintraq_walkthrough_persons',
  AUTO_BACKUP_ENABLED: '@fintraq_auto_backup_enabled',
  AUTO_BACKUP_LAST_BACKUP_META: '@fintraq_last_backup_meta',
  AUTO_BACKUP_LAST_AUTO_TIME: '@fintraq_last_auto_backup_time',
  AUTO_BACKUP_SYNCED_FILE_ID: '@fintraq_synced_backup_file_id',
  AUTO_BACKUP_LAST_REGISTERED_INTERVAL: '@fintraq_bg_task_last_interval',
  AUTO_BACKUP_BATTERY_PROMPT_SHOWN: '@fintraq_battery_prompt_shown',
  FIRST_LAUNCH_AT: '@fintraq_first_launch_at',
  REVIEW_REQUESTED_AT: '@fintraq_review_requested_at',
};

const SECURE_STORE_KEYS_ON_DEVICES: Record<string, string> = {
  PIN_HASH: 'fintraq_lock_pin_hash',
  LOCK_MODE: 'fintraq_lock_mode',
  PIN_FAILURES: 'fintraq_lock_pin_failures',
};

const DATABASE_KEYS_ON_DEVICES: Record<string, string> = {
  DB_NAME: 'fintraq.db',
};

describe('storage keys', () => {
  it.each([
    ['AsyncStorage', StorageKeys, STORAGE_KEYS_ON_DEVICES],
    ['secure store', SecureStoreKeys, SECURE_STORE_KEYS_ON_DEVICES],
    ['database', DatabaseKeys, DATABASE_KEYS_ON_DEVICES],
  ])('keeps every %s key exactly as shipped', (_name, current, shipped) => {
    for (const [name, value] of Object.entries(shipped)) expect(`${name}=${(current as Record<string, string>)[name]}`).toBe(`${name}=${value}`);
  });

  it('adds no key without recording it here', () => {
    expect(Object.keys(StorageKeys).sort()).toEqual(Object.keys(STORAGE_KEYS_ON_DEVICES).sort());
    expect(Object.keys(SecureStoreKeys).sort()).toEqual(Object.keys(SECURE_STORE_KEYS_ON_DEVICES).sort());
    expect(Object.keys(DatabaseKeys).sort()).toEqual(Object.keys(DATABASE_KEYS_ON_DEVICES).sort());
  });

  it('still knows the retired key, so a reset clears it from old installs', () => {
    expect(RETIRED_AUTO_BACKUP_FREQUENCY_KEY).toBe('@fintraq_auto_backup_frequency');
  });
});
