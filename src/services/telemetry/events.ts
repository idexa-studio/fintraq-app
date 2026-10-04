/**
 * Every analytics event the app sends, with its parameters. Adding an event means adding it here
 * first, so names and params are checked at compile time and this file stays the single catalogue
 * to mirror in the GA4 console (custom definitions for each param you want to report on).
 *
 * Privacy rules — Fintraq is offline-first and markets itself as private:
 * - Never send amounts, balances, notes, names, search text, account numbers or anything typed.
 * - Only low-cardinality enums (a type, a mode, a bucket). No IDs, no free text.
 * - GA4 recommended names (`tutorial_begin`, `search`, `begin_checkout`) where one fits, so the
 *   built-in reports pick them up. `purchase` is deliberately NOT sent: Firebase already records
 *   store purchases as `in_app_purchase`, and both count toward revenue, which would double it.
 */
export type TransactionKind = 'income' | 'expense' | 'transfer';
export type SaveMode = 'create' | 'edit';
export type ResultBucket = '0' | '1-5' | '6-20' | '21+';

export type AnalyticsEvents = {
  /** Onboarding opened on a fresh install. */
  tutorial_begin: undefined;
  /** Onboarding finished and the starter data was written. */
  tutorial_complete: { first_entry: 'added' | 'skipped' };
  transaction_saved: { transaction_type: TransactionKind; mode: SaveMode };
  account_saved: { account_type: string; mode: SaveMode };
  /** A settled global search. The query itself is never sent, only how many results it found. */
  search: { results: ResultBucket };
  /** Paywall shown; `source` is the Pro feature the user tried, or `direct`. */
  paywall_view: { source: string };
  /** The store purchase sheet was requested. */
  begin_checkout: { item_id: string };
  /** Pro became active on this device. */
  pro_unlocked: { method: 'purchase' | 'restore' };
  /** Restore tapped; what came back. */
  purchase_restore: { outcome: 'restored' | 'none' | 'failed' };
  backup_created: { trigger: 'manual' };
  backup_restored: undefined;
  data_exported: { destination: 'save' | 'share' };
};

export type AnalyticsEventName = keyof AnalyticsEvents;

/** Device-level dimensions, each registered as a user-scoped custom dimension in GA4. */
export type AnalyticsUserProperties = {
  is_pro: 'true' | 'false';
  app_language: string;
  app_theme: 'system' | 'light' | 'dark';
  default_currency: string;
};
