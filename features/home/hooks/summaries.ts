import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QUERY_KEYS } from '@/data/query-keys';
import * as api from '@/data/repositories/summaries';
import * as insightsApi from '@/data/repositories/insights';

export const useMonthTotals = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.month(currency),
    queryFn: () => api.getMonthTotals(currency),
    enabled: !!currency,
  });
};

export const useLifetimeTotals = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.lifetime(currency),
    queryFn: () => api.getLifetimeTotals(currency),
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

export const useDashboardInsights = (currency: string) => {
  const { i18n } = useTranslation();
  return useQuery({
    // Insight copy is generated in the active language, so refetch when it changes.
    queryKey: [...QUERY_KEYS.dashboard.insights(currency), i18n.language],
    queryFn: () => insightsApi.getDashboardInsights(currency),
    enabled: !!currency,
  });
};
