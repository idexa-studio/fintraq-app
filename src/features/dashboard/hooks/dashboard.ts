import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import * as api from '@/src/features/dashboard/api/dashboard';
import * as insightsApi from '@/src/features/dashboard/api/insights';

export const useMonthTotals = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.month(currency),
    queryFn: () => api.getMonthTotals(currency),
    enabled: !!currency,
  });
};

export const useDailySpend = (currency: string, since: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.dailySpend(currency, since),
    queryFn: () => api.getDailySpend(currency, since),
    enabled: !!currency,
  });
};

export const useDashboardPersons = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.topPersons(currency),
    queryFn: () => api.getDashboardPersons(currency),
    enabled: !!currency,
  });
};

export const useDashboardInsights = (currency: string) => {
  const { i18n } = useTranslation();
  return useQuery({
    // Insight copy is generated in the active language, so refetch when it changes.
    queryKey: [...QUERY_KEYS.dashboard.insights(currency), i18n.language],
    queryFn: () => insightsApi.getDashboardInsights(currency),
    enabled: !!currency,
  });
};
