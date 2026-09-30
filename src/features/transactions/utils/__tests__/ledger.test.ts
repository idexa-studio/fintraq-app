import { accountDeltas, isLoanPrincipal, LedgerError, loanOutstanding, loanStatus, repaymentType, validateEntry } from '@/src/features/transactions/utils/ledger';

describe('validateEntry', () => {
  it('accepts a normal expense, income and transfer', () => {
    expect(() => validateEntry({ type: 'DR', amount: 10, accountId: 1, toAccountId: null })).not.toThrow();
    expect(() => validateEntry({ type: 'CR', amount: 10, accountId: 1, toAccountId: null })).not.toThrow();
    expect(() => validateEntry({ type: 'TR', amount: 10, accountId: 1, toAccountId: 2 })).not.toThrow();
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('rejects amount %p', (amount) => {
    expect(() => validateEntry({ type: 'DR', amount, accountId: 1, toAccountId: null })).toThrow(LedgerError);
  });

  it('rejects a transfer without a destination or to the same account', () => {
    expect(() => validateEntry({ type: 'TR', amount: 10, accountId: 1, toAccountId: null })).toThrow(LedgerError);
    expect(() => validateEntry({ type: 'TR', amount: 10, accountId: 1, toAccountId: 1 })).toThrow(LedgerError);
  });

  it('rejects a destination on a non-transfer', () => {
    expect(() => validateEntry({ type: 'DR', amount: 10, accountId: 1, toAccountId: 2 })).toThrow(LedgerError);
  });
});

describe('accountDeltas', () => {
  it('moves balance and the matching lifetime counter', () => {
    expect(accountDeltas({ type: 'DR', amount: 25, accountId: 1, toAccountId: null }, 1)).toEqual([{ accountId: 1, balance: -25, income: 0, expense: 25 }]);
    expect(accountDeltas({ type: 'CR', amount: 25, accountId: 1, toAccountId: null }, 1)).toEqual([{ accountId: 1, balance: 25, income: 25, expense: 0 }]);
  });

  it('moves a transfer between two balances without touching income or expense', () => {
    expect(accountDeltas({ type: 'TR', amount: 40, accountId: 1, toAccountId: 2 }, 1)).toEqual([
      { accountId: 1, balance: -40, income: 0, expense: 0 },
      { accountId: 2, balance: 40, income: 0, expense: 0 },
    ]);
  });

  it('reversing exactly cancels applying', () => {
    for (const entry of [
      { type: 'DR' as const, amount: 12.5, accountId: 1, toAccountId: null },
      { type: 'CR' as const, amount: 7, accountId: 3, toAccountId: null },
      { type: 'TR' as const, amount: 99, accountId: 1, toAccountId: 2 },
    ]) {
      const net = new Map<number, number>();
      for (const d of [...accountDeltas(entry, 1), ...accountDeltas(entry, -1)]) net.set(d.accountId, (net.get(d.accountId) ?? 0) + d.balance);
      for (const value of net.values()) expect(value).toBe(0);
    }
  });

  it('still restores the source of a legacy transfer whose destination is gone', () => {
    expect(accountDeltas({ type: 'TR', amount: 30, accountId: 1, toAccountId: null }, -1)).toEqual([{ accountId: 1, balance: 30, income: 0, expense: 0 }]);
  });
});

describe('loanStatus', () => {
  const now = new Date(2026, 8, 30);

  it('is repaid once repayments cover the principal, to the cent', () => {
    expect(loanStatus(100, 33.33 + 33.33 + 33.34, null, now)).toBe('repaid');
    expect(loanStatus(100, 120, null, now)).toBe('repaid');
  });

  it('is overdue past the due date with money outstanding, else active', () => {
    expect(loanStatus(100, 50, '2026-09-01', now)).toBe('overdue');
    expect(loanStatus(100, 50, '2026-12-01', now)).toBe('active');
    expect(loanStatus(100, 0, null, now)).toBe('active');
  });

  it('goes back to active when a repayment is removed', () => {
    expect(loanStatus(100, 60, null, now)).toBe('active');
  });
});

describe('loan payment roles', () => {
  it('money back is a repayment, the opposite direction is the principal', () => {
    expect(repaymentType('lend')).toBe('CR');
    expect(repaymentType('borrow')).toBe('DR');
    expect(isLoanPrincipal('DR', 'lend')).toBe(true);
    expect(isLoanPrincipal('CR', 'lend')).toBe(false);
    expect(isLoanPrincipal('CR', 'borrow')).toBe(true);
    expect(isLoanPrincipal('DR', 'borrow')).toBe(false);
  });
});

describe('loanOutstanding and due days', () => {
  it('rounds to the cent and never goes negative', () => {
    expect(loanOutstanding(100, 33.33 + 33.33 + 33.34)).toBe(0);
    expect(loanOutstanding(100, 99.99)).toBe(0.01);
    expect(loanOutstanding(100, 150)).toBe(0);
  });

  it('is not overdue on the due date itself, only from the next local day', () => {
    const dueDay = new Date(2026, 9, 5, 23, 30);
    expect(loanStatus(100, 0, '2026-10-05', dueDay)).toBe('active');
    expect(loanStatus(100, 0, '2026-10-05', new Date(2026, 9, 6, 0, 5))).toBe('overdue');
  });
});
