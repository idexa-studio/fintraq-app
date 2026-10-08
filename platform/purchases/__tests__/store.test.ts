import { NO_ENTITLEMENT, canBuy, strongerOf } from '@/platform/purchases/entitlement';
import type { Entitlement } from '@/platform/purchases/entitlement';
import { toStorePlan, toStorePurchase } from '@/platform/purchases/store';

jest.mock('expo-iap', () => ({ ErrorCode: { UserCancelled: 'user-cancelled' } }));
jest.mock('@/shared/logging/logger', () => ({ LoggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

describe('toStorePlan', () => {
  it('reads the one-time plan from the product itself', () => {
    expect(toStorePlan({ id: 'luno_lifetime', displayPrice: '₹1,999.00', price: 1999, currency: 'INR' })).toEqual({
      plan: 'lifetime', productId: 'luno_lifetime', display: '₹1,999.00', amount: 1999, currency: 'INR', offerToken: undefined,
    });
  });

  it('reads a subscription from the last pricing phase of its offer, with the token Google Play needs', () => {
    const plan = toStorePlan({
      id: 'luno_yearly',
      displayPrice: '',
      subscriptionOfferDetailsAndroid: [{
        offerToken: 'token-1',
        pricingPhases: { pricingPhaseList: [
          { formattedPrice: 'Free', priceAmountMicros: '0', priceCurrencyCode: 'INR' },
          { formattedPrice: '₹999.00', priceAmountMicros: '999000000', priceCurrencyCode: 'INR' },
        ] },
      }],
    });
    expect(plan).toEqual({ plan: 'yearly', productId: 'luno_yearly', display: '₹999.00', amount: 999, currency: 'INR', offerToken: 'token-1', intro: { display: 'Free', amount: 0 } });
  });

  it('reads a subscription that opens at less than its price, and one that opens free', () => {
    const phases = (first: [string, string]) => ({ pricingPhaseList: [
      { formattedPrice: first[0], priceAmountMicros: first[1], priceCurrencyCode: 'INR' },
      { formattedPrice: '₹280.00', priceAmountMicros: '280000000', priceCurrencyCode: 'INR' },
    ] });
    expect(toStorePlan({ id: 'luno_monthly', subscriptionOfferDetailsAndroid: [{ offerToken: 'intro', pricingPhases: phases(['₹99.00', '99000000']) }] })).toMatchObject({
      display: '₹280.00', amount: 280, intro: { display: '₹99.00', amount: 99 }, offerToken: 'intro',
    });
    expect(toStorePlan({ id: 'luno_monthly', subscriptionOfferDetailsAndroid: [{ offerToken: 'trial', pricingPhases: phases(['Free', '0']) }] })).toMatchObject({
      display: '₹280.00', intro: { display: 'Free', amount: 0 },
    });
  });

  it('takes the cheapest offer Google Play returns for a subscription', () => {
    const plain = { offerToken: 'base', pricingPhases: { pricingPhaseList: [{ formattedPrice: '₹280.00', priceAmountMicros: '280000000', priceCurrencyCode: 'INR' }] } };
    const cheaper = { offerToken: 'intro', pricingPhases: { pricingPhaseList: [
      { formattedPrice: '₹99.00', priceAmountMicros: '99000000', priceCurrencyCode: 'INR' },
      { formattedPrice: '₹280.00', priceAmountMicros: '280000000', priceCurrencyCode: 'INR' },
    ] } };
    expect(toStorePlan({ id: 'luno_monthly', subscriptionOfferDetailsAndroid: [plain, cheaper] })).toMatchObject({ offerToken: 'intro', intro: { amount: 99 } });
    const alone = toStorePlan({ id: 'luno_monthly', subscriptionOfferDetailsAndroid: [plain] });
    expect(alone?.offerToken).toBe('base');
    expect(alone?.intro).toBeUndefined();
  });

  it('reads the one-time plan on offer: the price now, the usual price, and the token to buy at it', () => {
    const plan = toStorePlan({
      id: 'luno_lifetime', displayPrice: '₹3,000.00', price: 3000, currency: 'INR',
      oneTimePurchaseOfferDetailsAndroid: [
        { offerToken: 'full', formattedPrice: '₹3,000.00', priceAmountMicros: '3000000000', priceCurrencyCode: 'INR' },
        { offerToken: 'sale', formattedPrice: '₹300.00', priceAmountMicros: '300000000', priceCurrencyCode: 'INR', fullPriceMicros: '3000000000' },
      ],
    });
    expect(plan).toMatchObject({ display: '₹300.00', amount: 300, offerToken: 'sale', regular: { amount: 3000 } });
    expect(plan?.regular?.display).toContain('3,000');
  });

  it('shows no usual price when the one-time plan is not on offer', () => {
    const plan = toStorePlan({
      id: 'luno_lifetime', displayPrice: '₹300.00', price: 300, currency: 'INR',
      oneTimePurchaseOfferDetailsAndroid: [{ offerToken: 'full', formattedPrice: '₹300.00', priceAmountMicros: '300000000', priceCurrencyCode: 'INR' }],
    });
    expect(plan?.regular).toBeUndefined();
    expect(plan?.intro).toBeUndefined();
  });

  it('leaves out a product that is not ours, or that has no price to show', () => {
    expect(toStorePlan({ id: 'someone_elses', displayPrice: '$1', price: 1 })).toBeNull();
    expect(toStorePlan({ id: 'luno_monthly', displayPrice: '', price: null })).toBeNull();
    expect(toStorePlan({ id: 'luno_monthly', displayPrice: '$0.00', price: 0 })).toBeNull();
  });
});

describe('toStorePurchase', () => {
  it('keeps what the rules need', () => {
    expect(toStorePurchase({ productId: 'luno_monthly', purchaseState: 'purchased', transactionDate: 1000, isAutoRenewing: true })).toEqual({
      productId: 'luno_monthly', pending: false, purchasedAt: 1000, renews: true, expiresAt: null,
    });
  });

  it('marks an unpaid purchase as pending, and a cancelled subscription as not renewing', () => {
    expect(toStorePurchase({ productId: 'luno_lifetime', purchaseState: 'pending' }).pending).toBe(true);
    expect(toStorePurchase({ productId: 'luno_yearly', purchaseState: 'purchased', autoRenewingAndroid: false }).renews).toBe(false);
  });
});

describe('strongerOf', () => {
  const monthly: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: 2000, renews: true };
  const yearly: Entitlement = { kind: 'subscription', plan: 'yearly', activeUntil: 9000, renews: true };
  const lifetime: Entitlement = { kind: 'lifetime' };

  it('never lets a new purchase take anything away', () => {
    expect(strongerOf(lifetime, monthly)).toBe(lifetime);
    expect(strongerOf(monthly, lifetime)).toBe(lifetime);
    expect(strongerOf(yearly, monthly)).toBe(yearly);
    expect(strongerOf(monthly, yearly)).toBe(yearly);
    expect(strongerOf(NO_ENTITLEMENT, monthly)).toBe(monthly);
    expect(strongerOf(monthly, NO_ENTITLEMENT)).toBe(monthly);
  });
});

describe('canBuy', () => {
  const now = 1_000_000;
  const running: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: now + 5000, renews: true };
  const over: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: now - 10 * 24 * 60 * 60 * 1000, renews: false };

  it('sells nothing to a lifetime owner', () => {
    expect(canBuy('monthly', { kind: 'lifetime' }, now)).toBe(false);
    expect(canBuy('yearly', { kind: 'lifetime' }, now)).toBe(false);
    expect(canBuy('lifetime', { kind: 'lifetime' }, now)).toBe(false);
  });

  it('lets a subscriber move to lifetime, but not take a second subscription', () => {
    expect(canBuy('lifetime', running, now)).toBe(true);
    expect(canBuy('yearly', running, now)).toBe(false);
  });

  it('sells any plan to someone with nothing, or whose subscription has ended', () => {
    expect(canBuy('monthly', NO_ENTITLEMENT, now)).toBe(true);
    expect(canBuy('yearly', over, now)).toBe(true);
  });
});
