import { useEffect, useMemo, useRef } from 'react';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { Person } from '@/src/features/persons/api/persons';
import { useGlobalSearch } from '@/src/features/search/hooks/useGlobalSearch';
import { useRecentSearches } from '@/src/features/search/hooks/useRecentSearches';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { Analytics, resultBucket } from '@/src/services/telemetry';

export type SearchKind = 'transactions' | 'accounts' | 'categories' | 'persons';

export type SearchSection =
  | { kind: 'transactions'; items: TransactionListItem[] }
  | { kind: 'accounts'; items: Account[] }
  | { kind: 'categories'; items: Category[] }
  | { kind: 'persons'; items: Person[] };

export const SEARCH_KINDS: readonly SearchKind[] = ['transactions', 'accounts', 'categories', 'persons'];

const MIN_QUERY_LENGTH = 2;

/**
 * Global search results as sections keyed by a stable `kind` — never by the translated heading,
 * which made tab filtering and analytics break in every language but English. Also records
 * successful queries as recents and reports each distinct search once.
 */
export function useSearchResults(query: string) {
  const { data, isFetching, isEnabled, debouncedQuery } = useGlobalSearch(query);
  const { recents, addRecent, removeRecent, clearRecents } = useRecentSearches();

  const sections = useMemo((): SearchSection[] => {
    if (!data) return [];
    const all: SearchSection[] = [
      { kind: 'transactions', items: data.transactions },
      { kind: 'accounts', items: data.accounts },
      { kind: 'categories', items: data.categories },
      { kind: 'persons', items: data.persons },
    ];
    return all.filter((section) => section.items.length > 0);
  }, [data]);

  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const isSettled = isEnabled && !isFetching && debouncedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (isSettled && total > 0) addRecent(debouncedQuery);
  }, [isSettled, total, debouncedQuery, addRecent]);

  const lastTracked = useRef('');
  useEffect(() => {
    if (!isSettled) return;
    const signature = `${debouncedQuery}|${total}`;
    if (lastTracked.current === signature) return;
    lastTracked.current = signature;
    Analytics.track('search', { results: resultBucket(total) });
  }, [isSettled, debouncedQuery, total, sections]);

  return {
    sections,
    total,
    isEnabled,
    debouncedQuery,
    hasNoResults: isSettled && total === 0,
    recents,
    removeRecent,
    clearRecents,
  };
}
