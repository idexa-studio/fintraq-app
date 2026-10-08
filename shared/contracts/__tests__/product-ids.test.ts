import { PRODUCT_IDS } from '@/shared/contracts/product-ids';

// Existing buyers own these exact products; changing an id would stop recognising their purchase.
it('keeps the store product ids exactly as they are in the stores', () => {
  expect(PRODUCT_IDS).toEqual({
    lifetime: { ios: 'com.luno.lifetime', android: 'luno_lifetime' },
    yearly: { ios: 'com.luno.yearly', android: 'luno_yearly' },
    monthly: { ios: 'com.luno.monthly', android: 'luno_monthly' },
  });
});
