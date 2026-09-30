import type { TransactionType } from '@/src/types';
import { TransactionFilters } from '@/src/features/transactions/api/transactions';

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

/** The fields client-side filtering reads — satisfied by TransactionListItem. */
export type ClientFilterable = {
  type: TransactionType;
  accountId: number;
  categoryId: number;
  personId: number | null;
  note: string;
  category: { name: string };
  account: { name: string };
};

export class AdvancedFilterService {
  /**
   * Convert advanced filters to basic TransactionFilters for API
   */
  static toBasicFilters(advanced: AdvancedFilters): TransactionFilters {
    const basic: TransactionFilters = {};

    // Type filter (use first if single, API only supports single)
    if (advanced.types && advanced.types.length === 1) {
      basic.type = advanced.types[0];
    }

    // Account filter (use first if single, API only supports single)
    if (advanced.accountIds && advanced.accountIds.length === 1) {
      basic.accountId = advanced.accountIds[0];
    }

    // Category filter (use first if single, API only supports single)
    if (advanced.categoryIds && advanced.categoryIds.length === 1) {
      basic.categoryId = advanced.categoryIds[0];
    }

    // Person filter (use first if single, API only supports single)
    if (advanced.personIds && advanced.personIds.length === 1) {
      basic.personId = advanced.personIds[0];
    }

    // Date range — always handled by DB (avoids client-side filtering for this common case)
    if (advanced.dateRange) {
      basic.startDate = advanced.dateRange.startDate.toISOString().split('T')[0];
      basic.endDate = advanced.dateRange.endDate.toISOString().split('T')[0];
    }

    // Amount range — always handled by DB
    if (advanced.amountRange) {
      basic.minAmount = advanced.amountRange.min;
      basic.maxAmount = advanced.amountRange.max;
    }

    // Always pass sort to DB — never sort 500+ items on the JS thread
    basic.sortBy = advanced.sortBy;
    basic.sortOrder = advanced.sortOrder;

    return basic;
  }
  
  /**
   * Check if advanced filters have multi-select that requires client-side filtering
   */
  static requiresClientSideFiltering(advanced: AdvancedFilters): boolean {
    // Only multi-select beyond what DB supports requires client-side work.
    // Date range, amount range, single-select fields all go to DB now.
    const hasMultipleTypes = (advanced.types?.length || 0) > 1;
    const hasMultipleAccounts = (advanced.accountIds?.length || 0) > 1;
    const hasMultipleCategories = (advanced.categoryIds?.length || 0) > 1;
    const hasMultiplePersons = (advanced.personIds?.length || 0) > 1;
    const hasSearchQuery = !!advanced.searchQuery?.trim();

    return hasMultipleTypes ||
           hasMultipleAccounts ||
           hasMultipleCategories ||
           hasMultiplePersons ||
           hasSearchQuery;
  }
  
  /**
   * Count active filters
   */
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

  /**
   * Applies the criteria the DB query can't express (multi-select, text search) to rows that
   * are already sorted and paginated. Never sorts — order comes from the DB.
   */
  static applyClientSide<T extends ClientFilterable>(items: readonly T[], advanced: AdvancedFilters): T[] {
    if (!this.requiresClientSideFiltering(advanced)) return [...items];

    const { types, accountIds, categoryIds, personIds } = advanced;
    const query = advanced.searchQuery?.trim().toLowerCase();

    return items.filter((tx) => {
      if (types?.length && !types.includes(tx.type)) return false;
      if (accountIds?.length && !accountIds.includes(tx.accountId)) return false;
      if (categoryIds?.length && !categoryIds.includes(tx.categoryId)) return false;
      if (personIds?.length && (!tx.personId || !personIds.includes(tx.personId))) return false;
      if (query) {
        const haystack = [tx.note, tx.category.name, tx.account.name];
        if (!haystack.some((field) => field.toLowerCase().includes(query))) return false;
      }
      return true;
    });
  }
}
