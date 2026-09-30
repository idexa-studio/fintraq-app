/** Pure analytics maths, shared by the Analytics screen and unit-tested. */

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
 * Each item's share (0–1) of the positive total. Negative values (overdrawn accounts) count as
 * zero share rather than shrinking everyone else's.
 */
export function withShares<T extends { amount: number }>(items: readonly T[]): (T & { share: number })[] {
  const total = items.reduce((sum, item) => sum + Math.max(item.amount, 0), 0);
  return items.map((item) => ({ ...item, share: total > 0 ? Math.max(item.amount, 0) / total : 0 }));
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
