import type { TransactionFilters } from '@/data/repositories/transactions';
import { getLocalISOString, parseDateKey } from '@/shared/date/date';
import type { TransactionType } from '@/shared/types';

/** The stretches of time Activity can be narrowed to. */
export const PERIODS = ['all', 'thisMonth', 'lastMonth', 'last30', 'thisYear', 'custom'] as const;
export type Period = (typeof PERIODS)[number];

export const KINDS = ['all', 'expense', 'income', 'transfer'] as const;
export type KindFilter = (typeof KINDS)[number];

const TYPE_OF: Record<Exclude<KindFilter, 'all'>, TransactionType> = { expense: 'DR', income: 'CR', transfer: 'TR' };

/** What Activity is narrowed to, apart from the kind tab and the currency. */
export type ActivityFilters = {
  period: Period;
  /** The two ends of a custom range; either may be open. Local days. */
  from?: Date;
  to?: Date;
  accountId?: number;
  categoryId?: number;
  personId?: number;
};

export const NO_FILTERS: ActivityFilters = { period: 'all' };

/** How many filters are on, for the mark on the filter button. */
export const activeCount = (filters: ActivityFilters): number =>
  Number(filters.period !== 'all') + Number(filters.accountId !== undefined) + Number(filters.categoryId !== undefined) + Number(filters.personId !== undefined);

/** The first and last day a period covers, inclusive; either end may be open. */
export function periodRange(filters: Pick<ActivityFilters, 'period' | 'from' | 'to'>, now: Date = new Date()): { start?: Date; end?: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (filters.period) {
    case 'thisMonth': return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) };
    case 'lastMonth': return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
    case 'last30': return { start: new Date(y, m, now.getDate() - 29), end: now };
    case 'thisYear': return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    // A range typed backwards is read the way it was meant.
    case 'custom': return filters.from && filters.to && filters.from > filters.to ? { start: filters.to, end: filters.from } : { start: filters.from, end: filters.to };
    default: return {};
  }
}

/**
 * The query for the list and its totals. One account fixes everything; with
 * several currencies held and no account chosen, the list is the accounts of
 * the currency on show, so the totals and the list describe the same money.
 */
export function toQuery(filters: ActivityFilters, kind: KindFilter, currencyAccountIds: readonly number[] | undefined, now: Date = new Date()): TransactionFilters {
  const { start, end } = periodRange(filters, now);
  return {
    ...(kind === 'all' ? {} : { types: [TYPE_OF[kind]] }),
    ...(filters.accountId !== undefined ? { accountIds: [filters.accountId] } : currencyAccountIds ? { accountIds: [...currencyAccountIds] } : {}),
    ...(filters.categoryId === undefined ? {} : { categoryIds: [filters.categoryId] }),
    ...(filters.personId === undefined ? {} : { personIds: [filters.personId] }),
    ...(start ? { startDate: getLocalISOString(start) } : {}),
    ...(end ? { endDate: getLocalISOString(end) } : {}),
  };
}

/** What a link to Activity may carry, as it arrives in the address. */
export type ActivityLink = { accountId?: string; categoryId?: string; personId?: string; from?: string; to?: string };

const idOf = (value: string | undefined): number | undefined => (value && /^\d+$/.test(value) ? Number(value) : undefined);
const dayOf = (value: string | undefined): Date | undefined => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateKey(value) : undefined);

/**
 * The filters a link asks for: an account's, a category's or a person's
 * transactions, optionally between two days (as Insights does for the period
 * it is showing). Null when the link asks for nothing, or nothing readable.
 */
export function filtersFromLink(link: ActivityLink): ActivityFilters | null {
  const from = dayOf(link.from);
  const to = dayOf(link.to);
  const filters: ActivityFilters = {
    period: from || to ? 'custom' : 'all',
    from,
    to,
    accountId: idOf(link.accountId),
    categoryId: idOf(link.categoryId),
    personId: idOf(link.personId),
  };
  return activeCount(filters) > 0 ? filters : null;
}
