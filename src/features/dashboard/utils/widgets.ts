/** Pure maths behind the dashboard widgets, kept out of the components so it can be unit-tested. */
import { format } from 'date-fns';
import { monthEndForecast, percentChange } from '@/src/utils/analytics';

export type MonthTotals = {
  income: number;
  expense: number;
  /** Expense in the previous month up to the same day of the month. */
  lastMonthToDate: number;
  /** Expense over the whole previous month. */
  lastMonthTotal: number;
};

export type MonthPulse = MonthTotals & {
  dayOfMonth: number;
  daysInMonth: number;
  /** Share of the month that has passed, 0–1 (today counts as passed). */
  monthProgress: number;
  dailyAverage: number;
  /** Expected spend by month end at the current daily rate. */
  projected: number;
  /** % change vs last month at the same point; null without a baseline. */
  deltaVsLastMonth: number | null;
  /** This month's spend as a share of last month's total; null without a baseline. */
  shareOfLastMonth: number | null;
};

export function buildMonthPulse(totals: MonthTotals, now: Date): MonthPulse {
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAverage = totals.expense / dayOfMonth;
  return {
    ...totals,
    dayOfMonth,
    daysInMonth,
    monthProgress: dayOfMonth / daysInMonth,
    dailyAverage,
    projected: totals.expense + monthEndForecast(dailyAverage, now),
    deltaVsLastMonth: percentChange(totals.expense, totals.lastMonthToDate),
    shareOfLastMonth: totals.lastMonthTotal > 0 ? totals.expense / totals.lastMonthTotal : null,
  };
}

/** 0 = no spend … 4 = the busiest days. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export type HeatCell = {
  /** yyyy-MM-dd, local time. */
  date: string;
  amount: number;
  level: HeatLevel;
  isToday: boolean;
  /** Days after today, drawn as empty slots so every week row is complete. */
  isFuture: boolean;
};

export const HEATMAP_WEEKS = 5;

/** Levels are relative to the busiest day in view, so one big purchase doesn't flatten the rest into level 1. */
export function heatLevel(amount: number, max: number): HeatLevel {
  if (amount <= 0 || max <= 0) return 0;
  const ratio = amount / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.4) return 3;
  if (ratio > 0.15) return 2;
  return 1;
}

/**
 * A calendar grid of the last `weeks` weeks, one row per week, Monday first, ending with the week
 * that contains `today`. `spend` maps yyyy-MM-dd to the day's expense total.
 */
export function buildHeatmap(spend: ReadonlyMap<string, number>, today: Date, weeks = HEATMAP_WEEKS): HeatCell[][] {
  const todayKey = format(today, 'yyyy-MM-dd');
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (weeks - 1) * 7);

  let max = 0;
  const days: { date: string; amount: number; isFuture: boolean }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const date = format(day, 'yyyy-MM-dd');
    const isFuture = date > todayKey;
    const amount = isFuture ? 0 : spend.get(date) ?? 0;
    max = Math.max(max, amount);
    days.push({ date, amount, isFuture });
  }

  const rows: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    rows.push(
      days.slice(w * 7, w * 7 + 7).map((d) => ({ ...d, level: heatLevel(d.amount, max), isToday: d.date === todayKey })),
    );
  }
  return rows;
}

/** First date shown by `buildHeatmap`, for bounding the query. */
export function heatmapStart(today: Date, weeks = HEATMAP_WEEKS): string {
  const mondayOffset = (today.getDay() + 6) % 7;
  return format(new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (weeks - 1) * 7), 'yyyy-MM-dd');
}
