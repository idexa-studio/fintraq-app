import { useMonthTotals, useDailySpend } from '@/features/home';
import {
  useAnalyticsCategoryBreakdown, useAnalyticsDow, useAnalyticsIncomeCategoryBreakdown, useAnalyticsPersonBreakdown, useAnalyticsPreviousPeriod, useAnalyticsSeries,
} from '@/features/insights/hooks/insights-data';
import { chartRuns, heatValues, pace, weekFromMonday } from '@/features/insights/insights-rules';
import type { PeriodDays } from '@/features/insights/insights-rules';
import { analyticsWindow, averageByWeekday, percentChange, withShares } from '@/shared/calc/analytics';
import { buildHeatmap, buildMonthPulse, heatmapStart } from '@/shared/calc/month';
import { getLocalISOString } from '@/shared/date/date';
import { useMemo } from 'react';

/**
 * Everything Insights shows for one currency and period, from one window:
 * the chart, the totals and the comparison all cover the same days.
 */
export function useInsights(currency: string, period: PeriodDays) {
  // Keyed by today's date, so the window moves on at midnight.
  const todayKey = getLocalISOString();
  const window = useMemo(() => analyticsWindow(period, new Date()), [period, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = useMemo(() => new Date(), [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const series = useAnalyticsSeries(currency, window);
  const spending = useAnalyticsCategoryBreakdown(currency, window);
  const income = useAnalyticsIncomeCategoryBreakdown(currency, window);
  const weekdays = useAnalyticsDow(currency, window);
  const people = useAnalyticsPersonBreakdown(currency, window);
  const previous = useAnalyticsPreviousPeriod(currency, window);
  const month = useMonthTotals(currency);
  const daily = useDailySpend(currency, heatmapStart(today));

  return useMemo(() => {
    const buckets = series.data ?? [];
    const totals = buckets.reduce((sum, bucket) => ({ income: sum.income + bucket.income, expense: sum.expense + bucket.expense }), { income: 0, expense: 0 });
    const pulse = month.data ? buildMonthPulse(month.data, today) : null;
    return {
      window,
      loading: series.isPending || spending.isPending,
      totals,
      /** Spending against the same number of days before, in percent; null with nothing to compare. */
      change: percentChange(totals.expense, previous.data?.expense),
      runs: chartRuns(window, buckets),
      spending: withShares(spending.data ?? [], totals.expense),
      income: withShares(income.data ?? [], totals.income),
      weekdays: weekFromMonday(averageByWeekday(weekdays.data ?? [], window)),
      heat: heatValues(buildHeatmap(daily.data ?? new Map(), today)),
      people: people.data ?? [],
      pulse,
      pace: pulse ? pace(pulse) : null,
    };
  }, [window, today, series.data, series.isPending, spending.data, spending.isPending, income.data, weekdays.data, people.data, previous.data, month.data, daily.data]);
}
