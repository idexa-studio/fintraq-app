import { useQuery } from '@tanstack/react-query';
import * as api from '@/src/features/analytics/api/analytics';
import { getPersonBreakdown } from '@/src/features/persons/api/persons';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import type { AnalyticsWindow } from '@/src/utils/analytics';

// Keys carry the window's dates, so a screen left open past midnight refetches for the new day.
const STALE = 30_000;
const current = (w: AnalyticsWindow): api.DayRange => ({ start: w.start, end: w.end });

export const useAnalyticsSeries = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.series(currency, w.start, w.end, w.byMonth),
    queryFn: async () => (w.byMonth
      ? (await api.getMonthlyTimeSeries(currency, current(w))).map((m) => ({ slot: m.month, income: m.income, expense: m.expense }))
      : (await api.getDailyTimeSeries(currency, current(w))).map((d) => ({ slot: d.day, income: d.income, expense: d.expense }))),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsCategoryBreakdown = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.categories(currency, w.start, w.end),
    queryFn: () => api.getCategoryBreakdown(currency, current(w)),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsIncomeCategoryBreakdown = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.incomeCategories(currency, w.start, w.end),
    queryFn: () => api.getIncomeCategoryBreakdown(currency, current(w)),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsDow = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.dow(currency, w.start, w.end),
    queryFn: () => api.getSpendByDayOfWeek(currency, current(w)),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsPersonBreakdown = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.personBreakdown(currency, w.start, w.end),
    queryFn: () => getPersonBreakdown(currency, current(w)),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsPreviousPeriod = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.previousPeriod(currency, w.previousStart, w.previousEnd),
    queryFn: () => api.getPeriodSummary(currency, { start: w.previousStart, end: w.previousEnd }),
    enabled: !!currency,
    staleTime: STALE,
  });

export const useAnalyticsBiggestExpense = (currency: string, w: AnalyticsWindow) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.biggestExpense(currency, w.start, w.end),
    queryFn: () => api.getBiggestExpense(currency, current(w)),
    enabled: !!currency,
    staleTime: STALE,
  });
