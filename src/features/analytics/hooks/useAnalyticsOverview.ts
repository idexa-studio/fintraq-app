import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DOW_KEYS, MONTH_KEYS } from '@/shared/date/calendar';
import type { TrendBucket } from '@/src/features/analytics/components/SpendingTrendChart';
import { RangeDays } from '@/src/features/analytics/constants';
import {
  useAnalyticsBiggestExpense,
  useAnalyticsCategoryBreakdown,
  useAnalyticsDow,
  useAnalyticsIncomeCategoryBreakdown,
  useAnalyticsPersonBreakdown,
  useAnalyticsPreviousPeriod,
  useAnalyticsSeries,
} from '@/src/features/analytics/hooks/useAnalyticsData';
import { analyticsWindow, averageByWeekday, percentChange, sumBuckets, weekdayExtremes, windowSlots } from '@/src/utils/analytics';
import { getLocalISOString } from '@/shared/date/date';

/**
 * Everything the Analytics screen shows for one currency and range, derived from one window: the
 * caption, every query, the chart, the averages and the comparison all cover the same days.
 */
export function useAnalyticsOverview(currency: string, range: RangeDays) {
  const { t } = useTranslation();
  // Keyed by today's date, so the window moves on at midnight.
  const todayKey = getLocalISOString();
  const window = useMemo(() => analyticsWindow(range, new Date()), [range, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const series = useAnalyticsSeries(currency, window);
  const expenseCategories = useAnalyticsCategoryBreakdown(currency, window);
  const { data: incomeCategories = [] } = useAnalyticsIncomeCategoryBreakdown(currency, window);
  const { data: weekdayTotals = [] } = useAnalyticsDow(currency, window);
  const { data: people = [] } = useAnalyticsPersonBreakdown(currency, window);
  const { data: previous } = useAnalyticsPreviousPeriod(currency, window);
  const { data: biggestExpense = null } = useAnalyticsBiggestExpense(currency, window);

  return useMemo(() => {
    const monthName = (index: number) => {
      const key = MONTH_KEYS[index];
      return key ? t(`calendar.months.${key}`) : '';
    };
    // Every day (or month) of the window, zero where nothing happened, so the chart's gaps and
    // average are real.
    const bySlot = new Map((series.data ?? []).map((b) => [b.slot, b]));
    const chart: TrendBucket[] = windowSlots(window).map((slot) => {
      const [, mm, dd] = slot.split('-');
      const label = window.byMonth ? monthName(Number(mm) - 1) : `${Number(dd)} ${monthName(Number(mm) - 1)}`;
      const bucket = bySlot.get(slot);
      return { label, income: bucket?.income ?? 0, expense: bucket?.expense ?? 0 };
    });

    const totals = sumBuckets(chart);
    const weekdays = averageByWeekday(weekdayTotals, window);
    const extremes = weekdayExtremes(weekdays);

    return {
      window,
      isLoading: series.isLoading || expenseCategories.isLoading,
      totals,
      deltas: { income: percentChange(totals.income, previous?.income), expense: percentChange(totals.expense, previous?.expense) },
      dailyAverage: totals.expense / window.days,
      chart,
      expenseCategories: expenseCategories.data ?? [],
      incomeCategories,
      topCategory: expenseCategories.data?.[0] ?? null,
      biggestExpense,
      people,
      weekdays,
      weekdayInsight: extremes
        ? t('analytics.dowInsight', { peak: t(`calendar.days.${DOW_KEYS[extremes.peak]}`), lowest: t(`calendar.days.${DOW_KEYS[extremes.lowest]}`) })
        : null,
    };
  }, [window, series.data, series.isLoading, expenseCategories.data, expenseCategories.isLoading, incomeCategories, weekdayTotals, people, previous, biggestExpense, t]);
}
