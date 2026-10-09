/**
 * Every analytics event the app sends, with its parameters. Adding an event means adding it here
 * first, so names and params are checked at compile time and this file stays the single catalogue
 * to mirror in the GA4 console (custom definitions for each param you want to report on).
 *
 * Privacy rules — Fintraq is offline-first and markets itself as private:
 * - Never send amounts, balances, notes, names, search text, account numbers or anything typed.
 * - Only low-cardinality enums (a type, a mode, a bucket). No IDs, no free text.
 * - GA4 recommended names only when we send their prescribed params (`tutorial_begin`,
 *   `tutorial_complete`, `begin_checkout` with items/value/currency). Search is a custom event
 *   because the recommended `search` expects `search_term`, which we never send.
 * - `purchase` is deliberately NOT sent: Firebase already records store purchases as
 *   `in_app_purchase`, and both count toward revenue, which would double it. For the same reason
 *   there is no separate "Pro unlocked by purchase" event.
 * - No single-value params: a param that can only ever hold one value carries no information.
 */
export type TransactionKind = 'income' | 'expense' | 'transfer';
export type SaveMode = 'create' | 'edit';
export type ResultBucket = '0' | '1-5' | '6-20' | '21+';
export type AnalyticsItem = { item_id: string; item_name?: string };

export type AnalyticsEvents = {
  /** Onboarding opened on a fresh install. */
  tutorial_begin: undefined;
  /** Onboarding finished and the starter data was written. */
  tutorial_complete: { first_entry: 'added' | 'skipped' };
  transaction_saved: { transaction_type: TransactionKind; mode: SaveMode };
  account_saved: { account_type: string; mode: SaveMode };
  /** A budget added or changed; `scope` is one category or all spending. The limit itself is never sent. */
  budget_saved: { scope: 'category' | 'overall'; mode: SaveMode };
  /** Saving an expense took a budget to four fifths of its limit, to the limit, or past it. */
  budget_warning: { level: 'near' | 'reached' | 'over' };
  /** A settled global search. The query itself is never sent, only how many results it found. */
  search_performed: { results: ResultBucket };
  /** Paywall shown; `source` is the Pro feature the user tried, or `direct`. */
  paywall_view: { source: string };
  /** The store purchase sheet was requested. GA4 recommended shape; value/currency when the store returned a price. */
  begin_checkout: { items: AnalyticsItem[]; value?: number; currency?: string };
  /** Restore tapped; what came back. */
  purchase_restore: { outcome: 'restored' | 'none' | 'failed' };
  /** Manual "Back up now" finished. Automatic backups run headless and aren't tracked. */
  backup_created: undefined;
  backup_restored: undefined;
  data_exported: { destination: 'save' | 'share' };
};

export type AnalyticsEventName = keyof AnalyticsEvents;

/** Device-level dimensions, each registered as a user-scoped custom dimension in GA4. */
export type AnalyticsUserProperties = {
  is_pro: 'true' | 'false';
  app_language: string;
  default_currency: string;
};
