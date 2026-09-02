import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { getDaysAgoLocal, getLocalISOString } from '../../../utils/date';
import * as api from '../api/analytics';
import { getPersonBreakdown } from '../../persons/api/persons';

export const useAnalyticsDailyData = (currency: string, rangeDays: number) =>
  useQuery({
    queryKey: ['analytics', 'daily', currency, rangeDays] as const,
    queryFn: () => api.getDailyTimeSeries(currency, getDaysAgoLocal(rangeDays)),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsMonthlyData = (currency: string) =>
  useQuery({
    queryKey: ['analytics', 'monthly', currency] as const,
    queryFn: () => api.getMonthlyTimeSeries(currency, 12),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsCategoryBreakdown = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: ['analytics', 'categories', currency, rangeDays] as const,
    queryFn: () => api.getCategoryBreakdown(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsIncomeCategoryBreakdown = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: ['analytics', 'income-categories', currency, rangeDays] as const,
    queryFn: () => api.getIncomeCategoryBreakdown(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });

export const useAnalyticsDow = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: ['analytics', 'dow', currency, rangeDays] as const,
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
    queryKey: ['analytics', 'prev-period', currency, rangeDays] as const,
    queryFn: () => api.getPreviousPeriodSummary(currency, prevStart, prevEnd),
    enabled: !!currency,
    staleTime: 30_000,
  });
};

export const useAnalyticsBiggestExpense = (currency: string, rangeDays: number | null) =>
  useQuery({
    queryKey: ['analytics', 'biggest-expense', currency, rangeDays] as const,
    queryFn: () => api.getBiggestExpense(currency, rangeDays ? getDaysAgoLocal(rangeDays) : null),
    enabled: !!currency,
    staleTime: 30_000,
  });
