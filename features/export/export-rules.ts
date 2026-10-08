import type { CsvExportOptions, ExportDateRange } from '@/data/export/csv-export';
import type { TransactionFilters } from '@/data/repositories/transactions';
import { getLocalISOString } from '@/shared/date/date';
import type { TransactionType } from '@/shared/types';

/** The ready-made periods, counted back from today. */
export const EXPORT_PERIODS = [7, 30, 90, 365] as const;
export type ExportPeriod = (typeof EXPORT_PERIODS)[number] | 'custom';

export const EXPORT_KINDS = ['all', 'expense', 'income', 'transfer'] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

const TYPE_OF: Record<Exclude<ExportKind, 'all'>, TransactionType> = { expense: 'DR', income: 'CR', transfer: 'TR' };

/** Everything the user chooses about the file. */
export type ExportDraft = {
  period: ExportPeriod;
  /** The two days of a custom period, either order. Read only when `period` is `custom`. */
  from: Date;
  to: Date;
  kind: ExportKind;
  /** One account, or all of them. */
  accountId: number | null;
  includeLoans: boolean;
};

export const newExportDraft = (now: Date = new Date()): ExportDraft => ({ period: 30, from: daysBefore(now, 30), to: now, kind: 'all', accountId: null, includeLoans: false });

function daysBefore(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - days);
}

/** The whole of the first day to the whole of the last, whichever order the two days were given in. */
export function rangeOf(draft: Pick<ExportDraft, 'period' | 'from' | 'to'>, now: Date = new Date()): ExportDateRange {
  const [first, last] = draft.period === 'custom' ? (draft.from <= draft.to ? [draft.from, draft.to] : [draft.to, draft.from]) : [daysBefore(now, draft.period), now];
  return {
    startDate: new Date(first.getFullYear(), first.getMonth(), first.getDate(), 0, 0, 0, 0),
    endDate: new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999),
  };
}

/** The draft as the export service takes it. */
export function exportOptionsOf(draft: ExportDraft, now: Date = new Date()): CsvExportOptions {
  return {
    dateRange: rangeOf(draft, now),
    ...(draft.accountId !== null ? { accountId: draft.accountId } : {}),
    ...(draft.kind !== 'all' ? { type: TYPE_OF[draft.kind] } : {}),
    includeLoans: draft.includeLoans,
  };
}

/** The same choices as a list filter, for showing the first rows the file will hold. */
export function previewFiltersOf(draft: ExportDraft, now: Date = new Date()): TransactionFilters {
  const { startDate, endDate } = rangeOf(draft, now);
  return {
    startDate: getLocalISOString(startDate),
    endDate: getLocalISOString(endDate),
    ...(draft.accountId !== null ? { accountIds: [draft.accountId] } : {}),
    ...(draft.kind !== 'all' ? { types: [TYPE_OF[draft.kind]] } : {}),
  };
}

/** Why the file cannot be made yet. Loans alone are enough to make one. */
export const exportBlockerOf = (count: number | undefined, includeLoans: boolean): 'counting' | 'nothing' | null =>
  count === undefined ? 'counting' : count === 0 && !includeLoans ? 'nothing' : null;
