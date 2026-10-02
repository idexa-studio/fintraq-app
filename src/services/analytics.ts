import { logFirebaseEvent } from './firebase';

export const AnalyticsService = {
  screenViewed() {
    return logFirebaseEvent('screen_viewed');
  },

  onboardingCompleted() {
    return logFirebaseEvent('onboarding_completed');
  },

  transactionSaved() {
    return logFirebaseEvent('transaction_saved');
  },

  accountSaved() {
    return logFirebaseEvent('account_saved');
  },

  searchPerformed() {
    return logFirebaseEvent('search_performed');
  },

  premiumPaywallViewed() {
    return logFirebaseEvent('premium_paywall_viewed');
  },

  premiumPurchaseStarted() {
    return logFirebaseEvent('premium_purchase_started');
  },

  premiumPurchaseCompleted() {
    return logFirebaseEvent('premium_purchase_completed');
  },

  premiumPurchaseRestore() {
    return logFirebaseEvent('premium_purchase_restore');
  },
};
