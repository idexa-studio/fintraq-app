import { PRODUCT_IDS } from '@/shared/contracts/product-ids';
import type { ProductKey } from '@/shared/contracts/product-ids';

/**
 * What the user has paid for. Lifetime is owned for good; a subscription is
 * Pro until a date, which the store moves forward each time it renews.
 * Nothing here talks to the store or to storage: these are the rules, so
 * every transition can be tested.
 */
export type SubscriptionPlan = 'monthly' | 'yearly';

export type Entitlement =
  | { kind: 'none' }
  | { kind: 'lifetime' }
  | {
      kind: 'subscription';
      plan: SubscriptionPlan;
      /** The end of the period paid for, in milliseconds. */
      activeUntil: number;
      /** Whether the store will charge again at `activeUntil`. False once cancelled. */
      renews: boolean;
    };

export const NO_ENTITLEMENT: Entitlement = { kind: 'none' };

const DAY = 24 * 60 * 60 * 1000;

/**
 * How long past its date a renewing subscription still counts. The phone may
 * be offline when the store renews it, and the store itself gives a failed
 * payment a few days to recover; a paying subscriber is not locked out
 * meanwhile. A cancelled subscription gets none: it ends on its date.
 */
export const RENEWAL_GRACE = 3 * DAY;

export function isPro(entitlement: Entitlement, now: number): boolean {
  if (entitlement.kind === 'lifetime') return true;
  if (entitlement.kind === 'subscription') return now < entitlement.activeUntil + (entitlement.renews ? RENEWAL_GRACE : 0);
  return false;
}

/** Which plan a store product id belongs to, on either platform. */
export function planOfProduct(productId: string): ProductKey | null {
  const keys = Object.keys(PRODUCT_IDS) as ProductKey[];
  return keys.find((key) => PRODUCT_IDS[key].android === productId || PRODUCT_IDS[key].ios === productId) ?? null;
}

/** A purchase as the store reports it, reduced to what the rules need. */
export type StorePurchase = {
  productId: string;
  /** Payment not yet received (cash, bank transfer, a parent's approval). */
  pending: boolean;
  /** When it was bought, in milliseconds. */
  purchasedAt: number;
  renews: boolean;
  /** The end of the current period, where the store says (iOS). Google Play does not. */
  expiresAt?: number | null;
};

/**
 * The end of the period a subscription is in. Google Play reports only when
 * it was bought, so the end is the first monthly or yearly anniversary of
 * that still ahead.
 */
export function periodEnd(plan: SubscriptionPlan, purchasedAt: number, now: number): number {
  const months = plan === 'yearly' ? 12 : 1;
  const start = Number.isFinite(purchasedAt) && purchasedAt > 0 && purchasedAt <= now ? purchasedAt : now;
  let periods = 1;
  while (monthsAfter(start, periods * months) <= now) periods += 1;
  return monthsAfter(start, periods * months);
}

/**
 * The same day and time a number of months on, the last day of the month when
 * that month is shorter. Counted in UTC, as the store bills, so the answer
 * does not depend on where the phone is.
 */
function monthsAfter(time: number, months: number): number {
  const from = new Date(time);
  const first = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1, from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds(), from.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(from.getUTCDate(), lastDay));
  return first.getTime();
}

/**
 * What the store's list of purchases amounts to. A pending purchase grants
 * nothing. Lifetime outranks a subscription; of two subscriptions, the one
 * that lasts longer counts.
 */
export function entitlementFrom(purchases: readonly StorePurchase[], now: number): Entitlement {
  let best: Entitlement = NO_ENTITLEMENT;
  for (const purchase of purchases) {
    if (purchase.pending) continue;
    const plan = planOfProduct(purchase.productId);
    if (plan === null) continue;
    if (plan === 'lifetime') return { kind: 'lifetime' };
    const activeUntil = purchase.expiresAt ?? periodEnd(plan, purchase.purchasedAt, now);
    if (best.kind !== 'subscription' || activeUntil > best.activeUntil) best = { kind: 'subscription', plan, activeUntil, renews: purchase.renews };
  }
  return best;
}

/**
 * Brings what was saved in line with what the store now says. `lost` is true
 * when Pro was there and the store no longer has it: a refund, or a
 * subscription that ended.
 */
export function reconcile(saved: Entitlement, store: Entitlement, now: number): { entitlement: Entitlement; lost: boolean } {
  return { entitlement: store, lost: isPro(saved, now) && !isPro(store, now) };
}

type Saved = { isPremium?: unknown; entitlement?: unknown };

const isPlan = (value: unknown): value is SubscriptionPlan => value === 'monthly' || value === 'yearly';

/**
 * Reads the saved state. Versions up to 1.2.4 wrote only `{ isPremium }`, and
 * sold only Lifetime, so a bare `isPremium: true` is a lifetime licence:
 * everyone who bought stays Pro on first launch, offline.
 */
export function parseSaved(raw: string | null | undefined): Entitlement {
  if (!raw) return NO_ENTITLEMENT;
  let saved: Saved;
  try {
    saved = JSON.parse(raw) as Saved;
  } catch {
    return NO_ENTITLEMENT;
  }
  if (typeof saved !== 'object' || saved === null) return NO_ENTITLEMENT;
  const detail = saved.entitlement as Record<string, unknown> | null | undefined;
  if (typeof detail === 'object' && detail !== null) {
    if (detail.kind === 'lifetime') return { kind: 'lifetime' };
    if (detail.kind === 'subscription' && isPlan(detail.plan) && typeof detail.activeUntil === 'number' && Number.isFinite(detail.activeUntil)) {
      return { kind: 'subscription', plan: detail.plan, activeUntil: detail.activeUntil, renews: detail.renews === true };
    }
    return NO_ENTITLEMENT;
  }
  return saved.isPremium === true ? { kind: 'lifetime' } : NO_ENTITLEMENT;
}

/** What is written back. `isPremium` stays, as every version has written it; the detail is added beside it. */
export function toSaved(entitlement: Entitlement, now: number): string {
  return JSON.stringify({ isPremium: isPro(entitlement, now), entitlement });
}
