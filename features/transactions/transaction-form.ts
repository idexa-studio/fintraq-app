import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import type { TransactionType } from '@/shared/types';

/** The three kinds of entry, as the app's routes and analytics name them. */
export const KINDS = ['expense', 'income', 'transfer'] as const;
export type Kind = (typeof KINDS)[number];

const TYPE_OF: Record<Kind, TransactionType> = { expense: 'DR', income: 'CR', transfer: 'TR' };
const KIND_OF: Record<TransactionType, Kind> = { DR: 'expense', CR: 'income', TR: 'transfer' };

export const typeOfKind = (kind: Kind): TransactionType => TYPE_OF[kind];
export const kindOfType = (type: TransactionType): Kind => KIND_OF[type];
export const isKind = (value: unknown): value is Kind => (KINDS as readonly unknown[]).includes(value);

/**
 * The categories offered for a type: the user's own first, system catch-alls
 * ("Others") last, where a fallback belongs.
 */
export const categoriesFor = (categories: readonly Category[], type: TransactionType): Category[] =>
  categories.filter((c) => c.type.split(',').includes(type)).sort((a, b) => Number(a.isSystem) - Number(b.isSystem));

/** The category a new entry starts on: the first real one, not the catch-all. */
export const defaultCategoryId = (offered: readonly Category[]): number | null => (offered.find((c) => !c.isSystem) ?? offered[0])?.id ?? null;

/** The account a new entry starts on: the one asked for, else the default, else the first. */
export const defaultAccountId = (accounts: readonly Account[], preferredId?: number | null): number | null =>
  (accounts.find((a) => a.id === preferredId) ?? accounts.find((a) => a.isDefault) ?? accounts[0])?.id ?? null;

export type FormState = {
  type: TransactionType;
  amount: number | undefined;
  accountId: number | null;
  toAccountId: number | null;
  categoryId: number | null;
  personId: number | null;
  when: Date;
  note: string;
};

/** Why the entry cannot be saved yet, most pressing first; null when it can. */
export type Blocker = 'amount' | 'account' | 'destination' | 'category' | 'repaymentTooHigh';

/**
 * What still stands between the form and saving. `repaymentLimit` applies
 * when editing a loan repayment: it cannot exceed what was outstanding.
 */
export function blockerOf(state: FormState, repaymentLimit?: number): Blocker | null {
  if (!state.amount || state.amount <= 0) return 'amount';
  if (state.accountId == null) return 'account';
  if (state.type === 'TR' && (state.toAccountId == null || state.toAccountId === state.accountId)) return 'destination';
  if (state.categoryId == null) return 'category';
  if (repaymentLimit !== undefined && state.amount > repaymentLimit) return 'repaymentTooHigh';
  return null;
}

/**
 * The record to save. A note left blank is stored blank: every list names such a transaction by
 * its category as it is now. (Until 2.1.0 the category's name was stored in its place, a copy
 * that went stale when the category was changed or renamed; migration 0011 cleared those copies.)
 */
export function payloadOf(state: FormState) {
  return {
    accountId: state.accountId as number,
    categoryId: state.categoryId as number,
    toAccountId: state.type === 'TR' ? state.toAccountId : null,
    personId: state.personId,
    amount: state.amount as number,
    type: state.type,
    datetime: state.when.toISOString(),
    note: state.note.trim(),
  };
}
