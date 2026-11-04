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

/** The days a budget may start on: those every month has, so a cycle never slips. */
export const BUDGET_START_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/** A start day as stored, made safe: anything not a day from 1 to 28 is the 1st. */
export const budgetStartDayOf = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 28 ? value : 1;

/** A budget's month: its first and last day, and the month before it (all local YYYY-MM-DD). */
export type BudgetPeriod = { start: string; end: string; previousStart: string; previousEnd: string };

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * The budget month that holds `today`, when budgets start on `startDay`: from that day to the day
 * before it next month. On the 1st it is the calendar month; from the 28th, 28 October to 27
 * November. Worked from the calendar day, so no clock change moves it.
 */
export function budgetPeriod(today: Date, startDay: number): BudgetPeriod {
  const day = budgetStartDayOf(startDay);
  const monthsBack = today.getDate() >= day ? 0 : 1;
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, day);
  const next = new Date(start.getFullYear(), start.getMonth() + 1, day);
  const previous = new Date(start.getFullYear(), start.getMonth() - 1, day);
  const before = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return { start: dayKey(start), end: dayKey(before(next)), previousStart: dayKey(previous), previousEnd: dayKey(before(start)) };
}

/** How far through its budget month today is, from the day budgets start on. */
export function monthProgress(today: Date, startDay = 1): MonthProgress {
  const period = budgetPeriod(today, startDay);
  const at = (key: string) => { const [y, m, d] = key.split('-').map(Number) as [number, number, number]; return Date.UTC(y, m - 1, d); };
  const DAY_MS = 24 * 60 * 60 * 1000;
  const days = (at(period.end) - at(period.start)) / DAY_MS + 1;
  const passed = (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - at(period.start)) / DAY_MS + 1;
  return { elapsed: passed / days, daysLeft: days - passed };
}

/**
 * What is left, shared over the days still to come, today included: the amount a day that keeps
 * the budget. It holds whatever the budget is for, where a forecast from the pace so far does not
 * (rent is paid once, not a little each day).
 */
export const perDayLeft = (left: number, daysLeft: number): number => Math.max(0, left) / (Math.max(0, daysLeft) + 1);

/**
 * This month's limit when what was left last month is carried over. Only last month's remainder
 * is added, and an overspend is never carried: a bad month does not shrink the next one.
 */
export const limitWithRollover = (limit: number, lastMonthSpent: number, rollover: boolean): number => (rollover ? limit + Math.max(0, limit - Math.max(0, lastMonthSpent)) : limit);

/** What one more expense does to a budget: takes it to the limit or past it, into the last fifth, or neither. */
export type Crossing = 'near' | 'over';

/**
 * Whether adding to what was spent moves the budget into a new state. Only the expense that
 * crosses a line reports it, so each warning is given once: later expenses in the same state are quiet.
 */
export function crossingOf(spentBefore: number, spentAfter: number, limit: number): Crossing | null {
  const before = budgetStanding(spentBefore, limit).state;
  const after = budgetStanding(spentAfter, limit).state;
  if (after === before || after === 'under') return null;
  return after;
}
