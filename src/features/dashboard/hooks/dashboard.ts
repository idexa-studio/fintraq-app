import { useQuery } from '@tanstack/react-query';
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

export const useDashboardInsights = (currency: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.insights(currency),
    queryFn: () => insightsApi.getDashboardInsights(currency),
    enabled: !!currency,
  });
};
