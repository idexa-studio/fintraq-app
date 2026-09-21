import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QUERY_KEYS } from '../../../lib/query-keys';
import * as api from '../api/dashboard';
import * as insightsApi from '../api/insights';

export const useDashboardStats = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.stats(currency),
    queryFn: () => api.getDashboardStats(currency),
    enabled: !!currency,
  });
};

export const useTopExpenseCategories = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.topCategories(currency),
    queryFn: () => api.getTopExpenseCategories(currency),
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
