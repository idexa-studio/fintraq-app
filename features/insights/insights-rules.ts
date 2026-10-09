import type { AnalyticsWindow } from '@/shared/calc/analytics';
import { windowSlots } from '@/shared/calc/analytics';
import type { HeatCell } from '@/shared/calc/month';

/** The periods Insights can look back over. The longer two are part of Pro (`periods`). */
export const PERIODS = [
  { days: 7, pro: false },
  { days: 30, pro: false },
  { days: 90, pro: true },
  { days: 365, pro: true },
] as const;
export type PeriodDays = (typeof PERIODS)[number]['days'];

export const DEFAULT_PERIOD: PeriodDays = 7;

/** The period shown: a longer one chosen while Pro falls back once Pro is gone. */
export const allowedPeriod = (chosen: PeriodDays, isPro: boolean): PeriodDays => (isPro || !PERIODS.find((period) => period.days === chosen)?.pro ? chosen : DEFAULT_PERIOD);

/** How many categories are shown without Pro. */
export const FREE_CATEGORIES = 3;

/** One bar of the period's chart: the days (or month) it covers and what was spent in them. */
export type ChartRun = { start: string; end: string; value: number };

/**
 * The period as bars a phone can show: a bar a day for a week, a bar a week
 * for one or three months (counted back from today, so the last bar is always
 * the latest seven days), a bar a month for the year. Days with nothing spent
 * are still there, as zero.
 */
export function chartRuns(window: AnalyticsWindow, series: readonly { slot: string; expense: number }[]): ChartRun[] {
  const spent = new Map(series.map((bucket) => [bucket.slot, bucket.expense]));
  const slots = windowSlots(window);
  const size = window.byMonth || slots.length <= 7 ? 1 : 7;
  const runs: ChartRun[] = [];
  for (let end = slots.length; end > 0; end -= size) {
    const run = slots.slice(Math.max(0, end - size), end);
    runs.unshift({ start: run[0]!, end: run[run.length - 1]!, value: run.reduce((sum, slot) => sum + (spent.get(slot) ?? 0), 0) });
  }
  return runs;
}

/** The tallest bar, or none when nothing was spent. */
export function peakIndex(values: readonly number[]): number | undefined {
  let peak = -1;
  values.forEach((value, i) => { if (value > 0 && (peak === -1 || value > values[peak]!)) peak = i; });
  return peak === -1 ? undefined : peak;
}

/** Weekday averages, Monday first, with zero for a weekday nothing was spent on. */
export function weekFromMonday(weekdays: readonly { dow: number; total: number }[]): { dow: number; total: number }[] {
  const byDay = new Map(weekdays.map((day) => [day.dow, day.total]));
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ dow, total: byDay.get(dow) ?? 0 }));
}

/** The heat calendar's days up to today as shades from 0 to 1, and where today is. */
export function heatValues(weeks: readonly HeatCell[][]): { values: number[]; today: number } {
  const days = weeks.flat().filter((cell) => !cell.isFuture);
  return { values: days.map((cell) => cell.level / 4), today: days.findIndex((cell) => cell.isToday) };
}

/** Where the month is heading, as shares of last month's total. Null when there is no last month to measure against. */
export function pace(pulse: { expense: number; projected: number; lastMonthTotal: number; monthProgress: number }): { spent: number; projected: number; today: number } | null {
  if (pulse.lastMonthTotal <= 0) return null;
  return { spent: pulse.expense / pulse.lastMonthTotal, projected: pulse.projected / pulse.lastMonthTotal, today: pulse.monthProgress };
}

/**
 * The findings worth showing under a period. Each is about the last 7 days, so under the 7-day
 * period the two that restate the summary above them (the change in spending, and in, out and
 * kept) are left out. A category's rise is left out when it has a budget with room: the budget is
 * the measure the user chose for it, and a red mark beside a green bar says two things at once.
 */
export function findingsToShow<F extends { id: string }>(findings: readonly F[], period: PeriodDays, budgetedWithRoom: ReadonlySet<number>): F[] {
  return findings.filter((finding) => {
    if (period === 7 && (finding.id === 'weekly-spend' || finding.id === 'weekly-summary')) return false;
    const category = /^cat-(\d+)$/.exec(finding.id);
    return !(category && budgetedWithRoom.has(Number(category[1])));
  });
}
