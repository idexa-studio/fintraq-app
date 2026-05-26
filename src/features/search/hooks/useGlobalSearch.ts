import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { globalSearch } from '../api/global-search';

export function useGlobalSearch(rawQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const isEnabled = debouncedQuery.length >= 2;

  return {
    ...useQuery({
      queryKey: QUERY_KEYS.search.results(debouncedQuery),
      queryFn: () => globalSearch(debouncedQuery),
      enabled: isEnabled,
      staleTime: 15_000,
      placeholderData: (prev) => prev,
    }),
    isEnabled,
    debouncedQuery,
  };
}
