import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import { getDaysAgoLocal } from '@/src/utils/date';
import * as api from '@/src/features/analytics/api/analytics';
import { getPersonBreakdown } from '@/src/features/persons/api/persons';

export const useAnalyticsDailyData = (currency: string, rangeDays: number) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.daily(currency, rangeDays),
    queryFn: () => api.getDailyTimeSeries(currency, getDaysAgoLocal(rangeDays)),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsMonthlyData = (currency: string) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.monthly(currency),
    queryFn: () => api.getMonthlyTimeSeries(currency, 12),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsCategoryBreakdown = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.categories(currency, rangeDays),
    queryFn: () => api.getCategoryBreakdown(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsIncomeCategoryBreakdown = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.incomeCategories(currency, rangeDays),
    queryFn: () => api.getIncomeCategoryBreakdown(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsDow = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.dow(currency, rangeDays),
    queryFn: () => api.getSpendByDayOfWeek(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsPersonBreakdown = (currency: string, rangeDays: number) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.personBreakdown(currency, rangeDays),
    queryFn: () => getPersonBreakdown(currency, rangeDays),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsPreviousPeriod = (currency: string, rangeDays: number) => {
  const prevStart = getDaysAgoLocal(rangeDays * 2);
  const prevEnd = getDaysAgoLocal(rangeDays);
  return useQuery({
    queryKey: QUERY_KEYS.analytics.previousPeriod(currency, rangeDays),
    queryFn: () => api.getPreviousPeriodSummary(currency, prevStart, prevEnd),
    enabled: !!currency,
    staleTime: 30_000,
  });
};

export const useAnalyticsBiggestExpense = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.biggestExpense(currency, rangeDays),
    queryFn: () => api.getBiggestExpense(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });
