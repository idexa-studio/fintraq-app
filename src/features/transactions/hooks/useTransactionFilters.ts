import { useCallback, useMemo, useState } from 'react';
import { AdvancedFilters, AdvancedFilterService, DEFAULT_ADVANCED_FILTERS } from '@/src/features/filters/api/advanced-filters.service';

/** Filters a chip can clear individually. */
export type ClearableFilter = 'types' | 'accountIds' | 'categoryIds' | 'personIds' | 'dateRange' | 'amountRange';

export type SortOption = Pick<AdvancedFilters, 'sortBy' | 'sortOrder'>;

/**
 * Filter and sort state for the transactions list, seeded from route params (e.g. opening the
 * list from an account or category). Owns the state; derives what the queries and UI need.
 */
export function useTransactionFilters(initial: { accountId: number | null; categoryId: number | null }) {
  const [filters, setFilters] = useState<AdvancedFilters>(() => ({
    ...DEFAULT_ADVANCED_FILTERS,
    ...(initial.accountId !== null ? { accountIds: [initial.accountId] } : {}),
    ...(initial.categoryId !== null ? { categoryIds: [initial.categoryId] } : {}),
  }));

  const setSort = useCallback((sort: SortOption) => setFilters((prev) => ({ ...prev, ...sort })), []);
  const resetSort = useCallback(() => setSort(DEFAULT_ADVANCED_FILTERS), [setSort]);
  const clearFilter = useCallback((key: ClearableFilter) => setFilters((prev) => ({ ...prev, [key]: undefined })), []);
  // Clearing filters keeps the chosen sort.
  const resetFilters = useCallback(
    () => setFilters((prev) => ({ ...DEFAULT_ADVANCED_FILTERS, sortBy: prev.sortBy, sortOrder: prev.sortOrder })),
    [],
  );

  const derived = useMemo(
    () => ({
      basicFilters: AdvancedFilterService.toBasicFilters(filters),
      activeFilterCount: AdvancedFilterService.countActiveFilters(filters),
      isSortActive: AdvancedFilterService.isSortActive(filters),
    }),
    [filters],
  );

  return { filters, applyFilters: setFilters, setSort, resetSort, clearFilter, resetFilters, ...derived };
}
