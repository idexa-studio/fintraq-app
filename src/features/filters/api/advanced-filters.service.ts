import type { TransactionType } from '@/shared/types';
import type { TransactionFilters } from '@/src/features/transactions/api/transactions';
import { getLocalISOString } from '@/shared/date/date';

export interface AdvancedFilters {
  // Date range
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  
  // Multi-select accounts
  accountIds?: number[];
  
  // Multi-select categories
  categoryIds?: number[];

  // Multi-select persons
  personIds?: number[];

  // Transaction types (can select multiple)
  types?: TransactionType[];
  
  // Amount range
  amountRange?: {
    min?: number;
    max?: number;
  };
  
  // Search in notes
  searchQuery?: string;
  
  // Sort order
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  sortBy: 'date',
  sortOrder: 'desc',
};

export class AdvancedFilterService {
  /**
   * The sheet's selections as SQL filters. Everything is expressed in the query, so the list, its
   * totals and pagination always cover the same rows. Dates are local calendar days — the same
   * days the list groups by.
   */
  static toBasicFilters(advanced: AdvancedFilters): TransactionFilters {
    const nonEmpty = <T,>(values: T[] | undefined): T[] | undefined => (values && values.length > 0 ? values : undefined);
    return {
      types: nonEmpty(advanced.types),
      accountIds: nonEmpty(advanced.accountIds),
      categoryIds: nonEmpty(advanced.categoryIds),
      personIds: nonEmpty(advanced.personIds),
      search: advanced.searchQuery?.trim() || undefined,
      startDate: advanced.dateRange ? getLocalISOString(advanced.dateRange.startDate) : undefined,
      endDate: advanced.dateRange ? getLocalISOString(advanced.dateRange.endDate) : undefined,
      minAmount: advanced.amountRange?.min,
      maxAmount: advanced.amountRange?.max,
      sortBy: advanced.sortBy,
      sortOrder: advanced.sortOrder,
    };
  }

  /** How many filter groups are in use (a group with several values counts once). */
  static countActiveFilters(advanced: AdvancedFilters): number {
    let count = 0;
    if (advanced.dateRange) count++;
    if (advanced.accountIds && advanced.accountIds.length > 0) count++;
    if (advanced.categoryIds && advanced.categoryIds.length > 0) count++;
    if (advanced.personIds && advanced.personIds.length > 0) count++;
    if (advanced.types && advanced.types.length > 0) count++;
    if (advanced.amountRange && (advanced.amountRange.min !== undefined || advanced.amountRange.max !== undefined)) count++;
    if (advanced.searchQuery?.trim()) count++;
    return count;
  }

  /** Anything other than the default newest-first order. */
  static isSortActive(advanced: AdvancedFilters): boolean {
    return advanced.sortBy !== DEFAULT_ADVANCED_FILTERS.sortBy || advanced.sortOrder !== DEFAULT_ADVANCED_FILTERS.sortOrder;
  }
}
