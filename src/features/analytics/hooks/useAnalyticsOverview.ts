import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrendBucket } from '@/src/features/analytics/components/SpendingTrendChart';
import { DOW_KEYS, MONTH_KEYS } from '@/src/constants/calendar';
import { RangeDays } from '@/src/features/analytics/constants';
import {
  useAnalyticsBiggestExpense,
  useAnalyticsCategoryBreakdown,
  useAnalyticsDailyData,
  useAnalyticsDow,
  useAnalyticsIncomeCategoryBreakdown,
  useAnalyticsMonthlyData,
  useAnalyticsPersonBreakdown,
  useAnalyticsPreviousPeriod,
} from '@/src/features/analytics/hooks/useAnalyticsData';
import { percentChange, sumBuckets, weekdayExtremes } from '@/src/utils/analytics';

/** Everything the Analytics screen shows for one currency and period, derived in one place. */
export function useAnalyticsOverview(currency: string, range: RangeDays) {
  const { t } = useTranslation();
  const daily = useAnalyticsDailyData(currency, range);
  const monthly = useAnalyticsMonthlyData(currency);
  const expenseCategories = useAnalyticsCategoryBreakdown(currency, range);
  const { data: incomeCategories = [] } = useAnalyticsIncomeCategoryBreakdown(currency, range);
  const { data: weekdays = [] } = useAnalyticsDow(currency, range);
  const { data: people = [] } = useAnalyticsPersonBreakdown(currency, range);
  const { data: previous } = useAnalyticsPreviousPeriod(currency, range);
  const { data: biggestExpense = null } = useAnalyticsBiggestExpense(currency, range);

  const isYear = range === 365;
  const buckets = useMemo(() => (isYear ? monthly.data : daily.data) ?? [], [isYear, monthly.data, daily.data]);

  return useMemo(() => {
    const month = (index: number) => {
      const key = MONTH_KEYS[index];
      return key ? t(`calendar.months.${key}`) : '';
    };
    const totals = sumBuckets(buckets);
    const dailyAverage = totals.expense / range;
    const extremes = weekdayExtremes(weekdays);

    const chart: TrendBucket[] = isYear
      ? (monthly.data ?? []).map((m) => ({ label: month(Number(m.month.split('-')[1]) - 1), income: m.income, expense: m.expense }))
      : (daily.data ?? []).map((d) => {
          const [, mm, dd] = d.day.split('-');
          const label = `${Number(dd)} ${month(Number(mm) - 1)}`;
          return { label, income: d.income, expense: d.expense };
        });

    return {
      isLoading: daily.isLoading || monthly.isLoading || expenseCategories.isLoading,
      totals,
      deltas: { income: percentChange(totals.income, previous?.income), expense: percentChange(totals.expense, previous?.expense) },
      dailyAverage,
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
  }, [buckets, range, isYear, weekdays, monthly.data, monthly.isLoading, daily.data, daily.isLoading, expenseCategories.data, expenseCategories.isLoading, incomeCategories, people, previous, biggestExpense, t]);
}
