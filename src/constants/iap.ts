import { Platform } from 'react-native';

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

// Free-tier caps before Pro is required. Pro features themselves live in src/features/premium/pro-features.ts.
export const FREE_LOAN_LIMIT = 3;
export const FREE_PERSON_LIMIT = 10;
