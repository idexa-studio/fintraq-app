import { logFirebaseEvent } from './firebase';

type TxType = 'CR' | 'DR' | 'TR';
type SearchSection = 'transactions' | 'accounts' | 'categories' | 'persons';

export const AnalyticsService = {
  screenViewed(path: string) {
    return logFirebaseEvent('screen_viewed', {
      screen_path: path,
    });
  },

  onboardingCompleted(defaultCurrency: string) {
    return logFirebaseEvent('onboarding_completed', {
      default_currency: defaultCurrency,
    });
  },

  transactionSaved(mode: 'create' | 'edit', type: TxType, amount: number, currency: string, hasNote: boolean, hasPerson: boolean) {
    return logFirebaseEvent('transaction_saved', {
      mode,
      transaction_type: type,
      amount_bucket: bucketAmount(amount),
      currency,
      has_note: hasNote,
      has_person: hasPerson,
    });
  },

  accountSaved(mode: 'create' | 'edit', currency: string, hasOpeningBalance: boolean, icon: string) {
    return logFirebaseEvent('account_saved', {
      mode,
      currency,
      has_opening_balance: hasOpeningBalance,
      icon_family: icon,
    });
  },

  searchPerformed(queryLength: number, resultCount: number, topSection: SearchSection | 'none') {
    return logFirebaseEvent('search_performed', {
      query_length: queryLength,
      result_count_bucket: bucketCount(resultCount),
      top_section: topSection,
    });
  },

  premiumPaywallViewed(source: string) {
    return logFirebaseEvent('premium_paywall_viewed', {
      source,
    });
  },

  premiumPurchaseStarted() {
    return logFirebaseEvent('premium_purchase_started');
  },

  premiumPurchaseCompleted() {
    return logFirebaseEvent('premium_purchase_completed');
  },

  premiumPurchaseRestore(result: 'restored' | 'not_found' | 'failed') {
    return logFirebaseEvent('premium_purchase_restore', {
      result,
    });
  },
};

function bucketAmount(amount: number) {
  if (amount < 10) return 'lt_10';
  if (amount < 50) return '10_49';
  if (amount < 100) return '50_99';
  if (amount < 500) return '100_499';
  if (amount < 1000) return '500_999';
  return '1000_plus';
}

function bucketCount(count: number) {
  if (count === 0) return '0';
  if (count === 1) return '1';
  if (count <= 5) return '2_5';
  if (count <= 10) return '6_10';
  return '11_plus';
}
