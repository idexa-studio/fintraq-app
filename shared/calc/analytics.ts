/** Pure analytics maths, shared by the Analytics screen and unit-tested. */

import { differenceInCalendarDays, format, startOfMonth, subDays, subMonths } from 'date-fns';

export type Totals = { income: number; expense: number; net: number };

export function sumBuckets(buckets: readonly { income: number; expense: number }[]): Totals {
  let income = 0;
  let expense = 0;
  for (const b of buckets) {
    income += b.income;
    expense += b.expense;
  }
  return { income, expense, net: income - expense };
}

/** % change vs the previous period; null when there's no meaningful baseline. */
export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (!previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Spend expected over the rest of the current month at the given daily rate. */
export function monthEndForecast(dailyAverage: number, now: Date): number {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return dailyAverage * (daysInMonth - now.getDate());
}

/** Busiest and quietest spending weekday; null unless at least two days differ. */
export function weekdayExtremes(days: readonly { dow: number; total: number }[]): { peak: number; lowest: number } | null {
  const withSpend = days.filter((d) => d.total > 0);
  if (withSpend.length < 2) return null;
  const peak = withSpend.reduce((a, b) => (b.total > a.total ? b : a));
  const lowest = withSpend.reduce((a, b) => (b.total < a.total ? b : a));
  return peak.dow === lowest.dow ? null : { peak: peak.dow, lowest: lowest.dow };
}

/**
 * Each item's share (0–1). Pass `total` when the items are part of something bigger (a period's
 * categories) so shares are of that whole; otherwise of the items' own positive sum. Negative
 * values (overdrawn accounts) count as zero rather than shrinking everyone else's.
 */
export function withShares<T extends { amount: number }>(items: readonly T[], total?: number): (T & { share: number })[] {
  const whole = total ?? items.reduce((sum, item) => sum + Math.max(item.amount, 0), 0);
  return items.map((item) => ({ ...item, share: whole > 0 ? Math.max(item.amount, 0) / whole : 0 }));
}

export type TrendBar = { label: string; amount: number };

/**
 * Collapses a series into at most `maxBars` bars by summing consecutive runs, so a 90-day range
 * draws weekly bars instead of slivers. A merged bar is labelled with its first and last bucket.
 */
export function toTrendBars(buckets: readonly { label: string; expense: number }[], maxBars: number = 31): TrendBar[] {
  if (buckets.length <= maxBars) return buckets.map((b) => ({ label: b.label, amount: b.expense }));
  const size = buckets.length <= maxBars * 7 ? 7 : Math.ceil(buckets.length / maxBars);
  const bars: TrendBar[] = [];
  // Group from the end so the last bar is always the most recent full run.
  for (let end = buckets.length; end > 0; end -= size) {
    const run = buckets.slice(Math.max(0, end - size), end);
    const first = run[0]!.label;
    const last = run[run.length - 1]!.label;
    bars.unshift({ label: first === last ? first : `${first} – ${last}`, amount: run.reduce((sum, b) => sum + b.expense, 0) });
  }
  return bars;
}

/** The period an Analytics range covers. Every query, caption and average on the screen uses one. */
export type AnalyticsWindow = {
  /** Local YYYY-MM-DD, inclusive on both ends. */
  start: string;
  end: string;
  /** The same number of days immediately before, for "vs previous period". */
  previousStart: string;
  previousEnd: string;
  days: number;
  /** The 12-month view buckets by calendar month. */
  byMonth: boolean;
};

const day = (date: Date) => format(date, 'yyyy-MM-dd');

/**
 * `rangeDays` days ending today (so 7D is today and the six days before it). The 12-month view
 * starts on the 1st, 11 months back, so its months are whole except the current one.
 */
export function analyticsWindow(rangeDays: number, now: Date): AnalyticsWindow {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const byMonth = rangeDays >= 365;
  const start = byMonth ? startOfMonth(subMonths(today, 11)) : subDays(today, rangeDays - 1);
  const days = differenceInCalendarDays(today, start) + 1;
  return {
    start: day(start),
    end: day(today),
    previousStart: day(subDays(start, days)),
    previousEnd: day(subDays(start, 1)),
    days,
    byMonth,
  };
}

/** Every day (or month, 'YYYY-MM') in the window, oldest first — so gaps show as zero, not as nothing. */
export function windowSlots(window: AnalyticsWindow): string[] {
  const [y, m, d] = window.start.split('-').map(Number) as [number, number, number];
  const start = new Date(y, m - 1, d);
  if (window.byMonth) {
    return Array.from({ length: 12 }, (_, i) => format(new Date(start.getFullYear(), start.getMonth() + i, 1), 'yyyy-MM'));
  }
  return Array.from({ length: window.days }, (_, i) => day(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
}

/** How many Sundays, Mondays … Saturdays (index 0-6) fall in the window. */
export function weekdayOccurrences(window: AnalyticsWindow): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const [y, m, d] = window.start.split('-').map(Number) as [number, number, number];
  for (let i = 0; i < window.days; i++) counts[new Date(y, m - 1, d + i).getDay()]!++;
  return counts;
}

/** Spend per weekday averaged over how often that weekday occurs in the window — a true "average by day". */
export function averageByWeekday(totals: readonly { dow: number; total: number }[], window: AnalyticsWindow): { dow: number; total: number }[] {
  const occurrences = weekdayOccurrences(window);
  return totals.map((row) => ({ dow: row.dow, total: occurrences[row.dow] ? row.total / occurrences[row.dow]! : 0 }));
}
