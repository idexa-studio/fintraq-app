import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import { availableFor, blockerOf, categoriesFor, defaultAccountId, defaultCategoryId, isKind, kindOfType, payloadOf, typeOfKind } from '@/features/transactions/transaction-form';
import type { FormState } from '@/features/transactions/transaction-form';

const category = (id: number, type: string, isSystem = false) => ({ id, name: `c${id}`, type, isSystem }) as Category;
const account = (id: number, isDefault = false) => ({ id, isDefault }) as Account;
const state = (over: Partial<FormState> = {}): FormState => ({
  type: 'DR', amount: 10, accountId: 1, toAccountId: null, categoryId: 5, personId: null, when: new Date('2026-10-08T10:00:00Z'), note: '', ...over,
});

describe('transaction form rules', () => {
  it('maps kinds to stored types and back', () => {
    expect(typeOfKind('expense')).toBe('DR');
    expect(kindOfType('TR')).toBe('transfer');
    expect(isKind('income')).toBe(true);
    expect(isKind('DR')).toBe(false);
  });

  it('offers only the categories of the type, the catch-all last', () => {
    const all = [category(1, 'CR,DR,TR', true), category(2, 'DR'), category(3, 'CR'), category(4, 'DR,CR')];
    expect(categoriesFor(all, 'DR').map((c) => c.id)).toEqual([2, 4, 1]);
    expect(defaultCategoryId(categoriesFor(all, 'DR'))).toBe(2);
    expect(defaultCategoryId(categoriesFor(all, 'TR'))).toBe(1);
    expect(defaultCategoryId([])).toBeNull();
  });

  it('starts on the account asked for, else the default, else the first', () => {
    const accounts = [account(1), account(2, true), account(3)];
    expect(defaultAccountId(accounts, 3)).toBe(3);
    expect(defaultAccountId(accounts, 99)).toBe(2);
    expect(defaultAccountId([account(7)])).toBe(7);
    expect(defaultAccountId([])).toBeNull();
  });

  it('names what is missing, most pressing first', () => {
    expect(blockerOf(state({ amount: undefined, accountId: null }))).toBe('amount');
    expect(blockerOf(state({ amount: 0 }))).toBe('amount');
    expect(blockerOf(state({ accountId: null }))).toBe('account');
    expect(blockerOf(state({ categoryId: null }))).toBe('category');
    expect(blockerOf(state())).toBeNull();
  });

  it('needs a different destination for a transfer', () => {
    expect(blockerOf(state({ type: 'TR' }))).toBe('destination');
    expect(blockerOf(state({ type: 'TR', toAccountId: 1 }))).toBe('destination');
    expect(blockerOf(state({ type: 'TR', toAccountId: 2 }))).toBeNull();
  });

  it('caps a loan repayment at what was outstanding', () => {
    expect(blockerOf(state({ amount: 120 }), 100)).toBe('repaymentTooHigh');
    expect(blockerOf(state({ amount: 100 }), 100)).toBeNull();
  });

  it('builds the record, keeping a blank note blank', () => {
    // A blank note stays blank, so the transaction is named by its category as it is now, not a stale copy of its name.
    expect(payloadOf(state({ note: '  ' }))).toMatchObject({ note: '', toAccountId: null, datetime: '2026-10-08T10:00:00.000Z' });
    expect(payloadOf(state({ note: ' Weekly shop ' })).note).toBe('Weekly shop');
    // A destination left over from an earlier choice is not saved on an expense.
    expect(payloadOf(state({ toAccountId: 2 })).toAccountId).toBeNull();
    expect(payloadOf(state({ type: 'TR', toAccountId: 2 })).toAccountId).toBe(2);
  });
});


describe('what an account has for the entry being written', () => {
  const cash = { id: 1, balance: -250 };
  const saved = (type: 'DR' | 'CR' | 'TR', accountId = 1, toAccountId: number | null = null) => ({ type, amount: 250, accountId, toAccountId });

  it('is the balance for a new entry', () => {
    expect(availableFor(cash, null)).toBe(-250);
  });

  it('takes back the transaction being changed, on its own account', () => {
    expect(availableFor(cash, saved('DR'))).toBe(0);
    expect(availableFor(cash, saved('CR'))).toBe(-500);
    expect(availableFor(cash, saved('TR', 1, 2))).toBe(0);
    expect(availableFor(cash, saved('TR', 2, 1))).toBe(-500);
  });

  it('leaves another account as it is', () => {
    expect(availableFor(cash, saved('DR', 2))).toBe(-250);
  });
});
