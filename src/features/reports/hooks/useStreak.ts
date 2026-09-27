import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import * as api from '@/src/features/reports/api/streak.service';

export function useUsageStreak(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.reports.streak(),
    queryFn: () => api.getCurrentStreak(),
    staleTime: 1000 * 60 * 5,
  });
}
