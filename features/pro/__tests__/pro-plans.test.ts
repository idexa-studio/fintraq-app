import { DEFAULT_PLAN, PLAN_PRODUCT_IDS, PRO_PLANS, isSubscription, lifetimeBreakEvenMonths, yearlySavingPercent } from '@/features/pro/pro-plans';

const price = (amount: number) => ({ amount, display: `$${amount}` });

describe('Pro plans', () => {
  it('leads with lifetime', () => {
    expect(PRO_PLANS[0]).toBe('lifetime');
    expect(DEFAULT_PLAN).toBe('lifetime');
    expect(PRO_PLANS.filter(isSubscription)).toEqual(['yearly', 'monthly']);
  });

  it('sells each plan through its own store product', () => {
    expect(Object.keys(PLAN_PRODUCT_IDS).sort()).toEqual([...PRO_PLANS].sort());
  });

  it('says how many months of monthly the lifetime price equals, rounding up', () => {
    expect(lifetimeBreakEvenMonths(price(39.99), price(2.99))).toBe(14);
    expect(lifetimeBreakEvenMonths(price(30), price(3))).toBe(10);
  });

  it('never overstates the yearly saving', () => {
    expect(yearlySavingPercent(price(19.99), price(2.99))).toBe(44);
    expect(yearlySavingPercent(price(36), price(3))).toBeUndefined();
    expect(yearlySavingPercent(price(40), price(3))).toBeUndefined();
  });

  it('stays silent when a price is missing or zero', () => {
    expect(lifetimeBreakEvenMonths(undefined, price(3))).toBeUndefined();
    expect(lifetimeBreakEvenMonths(price(40), price(0))).toBeUndefined();
    expect(yearlySavingPercent(price(20), undefined)).toBeUndefined();
  });
});
