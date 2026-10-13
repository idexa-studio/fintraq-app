import { NO_ENTITLEMENT, RENEWAL_GRACE, entitlementFrom, isPro, parseSaved, periodEnd, planOfProduct, reconcile, toSaved } from '@/platform/purchases/entitlement';
import type { Entitlement, StorePurchase } from '@/platform/purchases/entitlement';

const at = (iso: string) => new Date(iso).getTime();
const NOW = at('2026-10-08T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const bought = (productId: string, over: Partial<StorePurchase> = {}): StorePurchase => ({ productId, pending: false, purchasedAt: at('2026-09-20T09:00:00Z'), renews: true, ...over });

describe('entitlement', () => {
  it('knows each store product, on both platforms', () => {
    expect(planOfProduct('luno_lifetime')).toBe('lifetime');
    expect(planOfProduct('luno_yearly')).toBe('yearly');
    expect(planOfProduct('com.luno.monthly')).toBe('monthly');
    expect(planOfProduct('something_else')).toBeNull();
  });

  describe('what was saved by the shipped app', () => {
    it('reads a 1.2.4 buyer as a lifetime owner', () => {
      expect(parseSaved('{"isPremium":true}')).toEqual({ kind: 'lifetime' });
    });

    it('reads a non-buyer, nothing saved, or damaged data as no entitlement', () => {
      expect(parseSaved('{"isPremium":false}')).toEqual(NO_ENTITLEMENT);
      expect(parseSaved(null)).toEqual(NO_ENTITLEMENT);
      expect(parseSaved('not json')).toEqual(NO_ENTITLEMENT);
      expect(parseSaved('"true"')).toEqual(NO_ENTITLEMENT);
      expect(parseSaved('{"isPremium":"yes"}')).toEqual(NO_ENTITLEMENT);
    });

    it('keeps writing isPremium beside the detail, and reads its own writing back', () => {
      const yearly: Entitlement = { kind: 'subscription', plan: 'yearly', activeUntil: NOW + 30 * DAY, renews: true };
      expect(JSON.parse(toSaved({ kind: 'lifetime' }, NOW))).toEqual({ isPremium: true, entitlement: { kind: 'lifetime' } });
      expect(JSON.parse(toSaved(NO_ENTITLEMENT, NOW)).isPremium).toBe(false);
      expect(parseSaved(toSaved(yearly, NOW))).toEqual(yearly);
    });

    it('does not trust a subscription saved without a valid plan or date', () => {
      expect(parseSaved('{"isPremium":true,"entitlement":{"kind":"subscription","plan":"weekly","activeUntil":1}}')).toEqual(NO_ENTITLEMENT);
      expect(parseSaved('{"isPremium":true,"entitlement":{"kind":"subscription","plan":"monthly"}}')).toEqual(NO_ENTITLEMENT);
    });
  });

  describe('what the store reports', () => {
    it('grants nothing for a pending payment', () => {
      expect(entitlementFrom([bought('luno_lifetime', { pending: true })], NOW)).toEqual(NO_ENTITLEMENT);
      expect(entitlementFrom([bought('luno_monthly', { pending: true })], NOW)).toEqual(NO_ENTITLEMENT);
    });

    it('finds a lifetime licence, which outranks a subscription', () => {
      expect(entitlementFrom([bought('luno_monthly'), bought('luno_lifetime')], NOW)).toEqual({ kind: 'lifetime' });
    });

    it('finds an active subscription, ending on the next anniversary of its purchase', () => {
      expect(entitlementFrom([bought('luno_monthly')], NOW)).toEqual({ kind: 'subscription', plan: 'monthly', activeUntil: at('2026-10-20T09:00:00Z'), renews: true });
      expect(entitlementFrom([bought('luno_yearly', { renews: false })], NOW)).toEqual({ kind: 'subscription', plan: 'yearly', activeUntil: at('2027-09-20T09:00:00Z'), renews: false });
    });

    it('uses the end date where the store gives one', () => {
      const until = at('2026-11-01T00:00:00Z');
      expect(entitlementFrom([bought('com.luno.monthly', { expiresAt: until })], NOW)).toMatchObject({ activeUntil: until });
    });

    it('takes the subscription that lasts longer, and ignores products it does not know', () => {
      expect(entitlementFrom([bought('luno_monthly'), bought('luno_yearly'), bought('other')], NOW)).toMatchObject({ plan: 'yearly' });
      expect(entitlementFrom([], NOW)).toEqual(NO_ENTITLEMENT);
    });

    it('moves the end forward when a subscription has renewed', () => {
      const later = at('2026-12-05T00:00:00Z');
      expect(periodEnd('monthly', at('2026-09-20T09:00:00Z'), later)).toBe(at('2026-12-20T09:00:00Z'));
      expect(periodEnd('monthly', at('2026-01-31T09:00:00Z'), at('2026-02-10T00:00:00Z'))).toBe(at('2026-02-28T09:00:00Z'));
    });

    it('still gives a full period when the purchase time is missing', () => {
      expect(periodEnd('monthly', 0, NOW)).toBe(at('2026-11-08T12:00:00Z'));
    });
  });

  describe('whether it counts as Pro right now', () => {
    const until = NOW + 10 * DAY;

    it('is always Pro with lifetime and never without', () => {
      expect(isPro({ kind: 'lifetime' }, NOW + 10000 * DAY)).toBe(true);
      expect(isPro(NO_ENTITLEMENT, NOW)).toBe(false);
    });

    it('ends a cancelled subscription on its date', () => {
      const cancelled: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: until, renews: false };
      expect(isPro(cancelled, until - 1)).toBe(true);
      expect(isPro(cancelled, until)).toBe(false);
    });

    it('gives a renewing subscription a few days past its date, then stops', () => {
      const renewing: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: until, renews: true };
      expect(isPro(renewing, until + RENEWAL_GRACE - 1)).toBe(true);
      expect(isPro(renewing, until + RENEWAL_GRACE)).toBe(false);
    });
  });

  describe('bringing the saved state in line with the store', () => {
    const monthly: Entitlement = { kind: 'subscription', plan: 'monthly', activeUntil: NOW + 5 * DAY, renews: true };

    it('reports Pro as lost on a refund or an ended subscription', () => {
      expect(reconcile({ kind: 'lifetime' }, NO_ENTITLEMENT, NOW)).toEqual({ entitlement: NO_ENTITLEMENT, lost: true });
      expect(reconcile(monthly, NO_ENTITLEMENT, NOW)).toEqual({ entitlement: NO_ENTITLEMENT, lost: true });
    });

    it('does not report a loss when Pro continues, begins, or had already ended', () => {
      expect(reconcile(monthly, { ...monthly, activeUntil: NOW + 35 * DAY }, NOW).lost).toBe(false);
      expect(reconcile(NO_ENTITLEMENT, { kind: 'lifetime' }, NOW)).toEqual({ entitlement: { kind: 'lifetime' }, lost: false });
      expect(reconcile({ ...monthly, activeUntil: NOW - 30 * DAY }, NO_ENTITLEMENT, NOW).lost).toBe(false);
      expect(reconcile(monthly, { kind: 'lifetime' }, NOW).lost).toBe(false);
    });
  });
});
