import { QUERY_KEYS } from '@/data/query-keys';
import { globalSearch } from '@/data/repositories/search';
import { groupsOf, isSearchable, totalOf } from '@/features/search/search-rules';
import { Analytics, resultBucket } from '@/platform/telemetry';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Long enough that a word being typed is looked up once, short enough to feel immediate. */
const SETTLE_MS = 250;

/**
 * Everything matching what was typed, grouped by kind. The lookup waits for
 * typing to pause, and the last results stay up while the next ones load.
 */
export function useSearch(typed: string) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettled(typed.trim()), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  const searching = isSearchable(typed) && isSearchable(settled);
  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.search.results(settled),
    queryFn: () => globalSearch(settled),
    enabled: searching,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });

  const groups = useMemo(() => (searching ? groupsOf(data) : []), [searching, data]);
  const total = totalOf(groups);
  // The results on screen are the ones for what is typed now.
  const current = searching && !isFetching && data?.query === typed.trim();

  // Each distinct search is counted once. Only how much it found is sent, never the words.
  const counted = useRef('');
  useEffect(() => {
    if (!current || counted.current === settled) return;
    counted.current = settled;
    Analytics.track('search_performed', { results: resultBucket(total) });
  }, [current, settled, total]);

  return {
    groups,
    total,
    /** Typed enough to search, with nothing to show for it yet. */
    waiting: isSearchable(typed) && !data,
    nothingFound: current && total === 0,
    /** What the results on screen are for. */
    query: settled,
  };
}
