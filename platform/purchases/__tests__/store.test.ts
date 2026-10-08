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
    expect(plan).toEqual({ plan: 'yearly', productId: 'luno_yearly', display: '₹999.00', amount: 999, currency: 'INR', offerToken: 'token-1' });
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
