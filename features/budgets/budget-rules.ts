/**
 * What a budget says about a month: how much of its limit is used, what state that puts it in,
 * and where the month will end at the pace so far. Pure, for testing.
 */

/** From this share of the limit a budget is "near": the point of the first warning. */
export const NEAR_SHARE = 0.8;

/** under: room left. near: 80% or more used. over: the limit is reached or passed. */
export type BudgetState = 'under' | 'near' | 'over';

export type BudgetStanding = {
  /** Spent as a share of the limit, 0 and up. */
  share: number;
  state: BudgetState;
  /** What is left, never below zero. */
  left: number;
  /** How far past the limit, never below zero. */
  over: number;
};

/** Where a budget stands. A limit of zero or less cannot be stood against: everything spent is over. */
export function budgetStanding(spent: number, limit: number): BudgetStanding {
  const used = Math.max(0, spent);
  if (limit <= 0) return { share: used > 0 ? 1 : 0, state: used > 0 ? 'over' : 'under', left: 0, over: used };
  const share = used / limit;
  return { share, state: share >= 1 ? 'over' : share >= NEAR_SHARE ? 'near' : 'under', left: Math.max(0, limit - used), over: Math.max(0, used - limit) };
}

export type MonthProgress = {
  /** How far through the month the end of today is, 0 to 1. */
  elapsed: number;
  /** Days still to come after today. */
  daysLeft: number;
};

/** A budget's month is the calendar month on the phone. */
export function monthProgress(today: Date): MonthProgress {
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return { elapsed: today.getDate() / days, daysLeft: days - today.getDate() };
}

/** Where spending ends if the rest of the month goes as it has so far. */
export const projectedSpend = (spent: number, elapsed: number): number => (elapsed > 0 ? Math.max(0, spent) / elapsed : Math.max(0, spent));

/**
 * This month's limit when what was left last month is carried over. Only last month's remainder
 * is added, and an overspend is never carried: a bad month does not shrink the next one.
 */
export const limitWithRollover = (limit: number, lastMonthSpent: number, rollover: boolean): number => (rollover ? limit + Math.max(0, limit - Math.max(0, lastMonthSpent)) : limit);
