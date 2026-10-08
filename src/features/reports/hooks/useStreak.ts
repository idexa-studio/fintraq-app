import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/data/query-keys';
import * as api from '@/data/repositories/streak';

export function useUsageStreak(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.reports.streak(),
    queryFn: () => api.getCurrentStreak(),
    staleTime: 1000 * 60 * 5,
  });
}
