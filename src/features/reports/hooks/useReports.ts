import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import * as api from '../api/reports.service';
import { ReportData } from '../api/reports.service';

export function useWeeklyReport(currency: string): UseQueryResult<ReportData, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.reports.weekly(currency),
    queryFn: () => api.getWeeklyReport(currency),
    enabled: !!currency,
  });
}

export function useMonthlyReport(currency: string): UseQueryResult<ReportData, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.reports.monthly(currency),
    queryFn: () => api.getMonthlyReport(currency),
    enabled: !!currency,
  });
}
