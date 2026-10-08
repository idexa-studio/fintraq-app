/**
 * How Pro is sold. Three plans unlock the same features; the paywall leads
 * with Lifetime and lets the arithmetic make the case (docs/PRODUCT.md).
 */

/** In the order the paywall lists them. */
export const PRO_PLANS = ['lifetime', 'yearly', 'monthly'] as const;
export type ProPlan = (typeof PRO_PLANS)[number];

/** The plan selected when the paywall opens. */
export const DEFAULT_PLAN: ProPlan = 'lifetime';

export const isSubscription = (plan: ProPlan): boolean => plan !== 'lifetime';

/**
 * Store product ids. Lifetime has been on sale since launch and existing
 * buyers own it, so its ids must never change. Monthly and yearly were
 * created in the stores before launch but disabled before anyone could buy
 * them; they are enabled for the three-plan paywall.
 */
export const PLAN_PRODUCT_IDS: Record<ProPlan, { ios: string; android: string }> = {
  lifetime: { ios: 'com.luno.lifetime', android: 'luno_lifetime' },
  yearly: { ios: 'com.luno.yearly', android: 'luno_yearly' },
  monthly: { ios: 'com.luno.monthly', android: 'luno_monthly' },
};

/** What the store returned for a plan. Amounts are in the store's currency for this user. */
export type PlanPrice = {
  /** As the store formats it, e.g. "₹299.00". This is what is shown. */
  display: string;
  /** The same price as a number, for the comparisons below only. */
  amount: number;
};

/**
 * "Same as N months of monthly": how many months of the monthly plan the
 * lifetime price equals, rounded up. Undefined when either price is missing
 * or not positive, in which case the line is not shown.
 */
export const lifetimeBreakEvenMonths = (lifetime?: PlanPrice, monthly?: PlanPrice): number | undefined => {
  if (!lifetime || !monthly || lifetime.amount <= 0 || monthly.amount <= 0) return undefined;
  return Math.ceil(lifetime.amount / monthly.amount);
};

/**
 * "Save P% on monthly": what a year on the yearly plan saves against twelve
 * monthly payments, rounded down so the claim is never overstated. Undefined
 * when there is no saving to claim.
 */
export const yearlySavingPercent = (yearly?: PlanPrice, monthly?: PlanPrice): number | undefined => {
  if (!yearly || !monthly || yearly.amount <= 0 || monthly.amount <= 0) return undefined;
  const saving = Math.floor((1 - yearly.amount / (monthly.amount * 12)) * 100);
  return saving > 0 ? saving : undefined;
};
