/**
 * Store product ids. A purchase is recorded by the store against these exact
 * strings, so they are never changed: doing so would stop recognising what
 * people have already bought. Lifetime has been on sale since launch; yearly
 * and monthly were created before launch and enabled for the three-plan
 * paywall.
 *
 * The app is Android only for now. The `ios` ids are the ones reserved for
 * an iOS app and are not in any store yet.
 */
export const PRODUCT_IDS = {
  lifetime: { ios: 'com.luno.lifetime', android: 'luno_lifetime' },
  yearly: { ios: 'com.luno.yearly', android: 'luno_yearly' },
  monthly: { ios: 'com.luno.monthly', android: 'luno_monthly' },
} as const;

export type ProductKey = keyof typeof PRODUCT_IDS;
