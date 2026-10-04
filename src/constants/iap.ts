import { Platform } from 'react-native';

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

// Free-tier caps before Pro is required. Pro features themselves live in src/features/premium/pro-features.ts.
export const FREE_LOAN_LIMIT = 3;
export const FREE_PERSON_LIMIT = 10;

/**
 * The Developer screen's "Premium override" is a debugging aid. It is honoured in development
 * builds only: a release build ignores any stored override, so Pro can't be unlocked without a
 * store purchase.
 */
export const IS_PREMIUM_OVERRIDE_ALLOWED = __DEV__;
