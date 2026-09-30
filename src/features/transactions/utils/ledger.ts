import type { TransactionType } from '@/src/types';

/** The fields of a payment that decide how it moves account balances. */
export type LedgerEntry = {
  type: TransactionType;
  amount: number;
  accountId: number;
  toAccountId: number | null;
};

/** One account's change. Transfers move `balance` only; income/expense are lifetime counters. */
export type AccountDelta = { accountId: number; balance: number; income: number; expense: number };

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerError';
  }
}

/**
 * Rejects an entry that would corrupt balances. Runs before anything is written, so a bad entry
 * leaves no partial state behind.
 */
export function validateEntry(entry: LedgerEntry): void {
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) throw new LedgerError('Amount must be a positive number');
  if (entry.type === 'TR') {
    if (entry.toAccountId == null) throw new LedgerError('Transfer requires a destination account');
    if (entry.toAccountId === entry.accountId) throw new LedgerError('Transfer source and destination must differ');
  } else if (entry.toAccountId != null) {
    throw new LedgerError('Only transfers have a destination account');
  }
}

/**
 * How an entry changes each account it touches. `direction` 1 applies the entry, -1 reverses it,
 * so an edit is "reverse old, apply new" and a delete is "reverse".
 *
 * A transfer whose destination is gone (legacy rows; the FK sets it to null) still restores its
 * source on reversal, rather than leaving that money missing.
 */
export function accountDeltas(entry: LedgerEntry, direction: 1 | -1): AccountDelta[] {
  const amount = entry.amount * direction;
  switch (entry.type) {
    case 'CR':
      return [{ accountId: entry.accountId, balance: amount, income: amount, expense: 0 }];
    case 'DR':
      return [{ accountId: entry.accountId, balance: -amount, income: 0, expense: amount }];
    case 'TR': {
      const deltas: AccountDelta[] = [{ accountId: entry.accountId, balance: -amount, income: 0, expense: 0 }];
      if (entry.toAccountId != null) deltas.push({ accountId: entry.toAccountId, balance: amount, income: 0, expense: 0 });
      return deltas;
    }
  }
}

export type LoanStatus = 'active' | 'overdue' | 'repaid';

/**
 * A loan's status from what has been paid back. Compared in cents, so three repayments of 33.33,
 * 33.33 and 33.34 settle 100 despite floating-point sums.
 */
export function loanStatus(principal: number, repaid: number, dueDate: string | null, now: Date): LoanStatus {
  if (Math.round((principal - repaid) * 100) <= 0) return 'repaid';
  if (dueDate && now > new Date(dueDate)) return 'overdue';
  return 'active';
}

/** The payment type that counts as repaying a loan: money coming back for a loan you gave, going out for one you took. */
export const repaymentType = (loanType: 'lend' | 'borrow'): TransactionType => (loanType === 'lend' ? 'CR' : 'DR');
