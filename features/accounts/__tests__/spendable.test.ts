import { countsAsSpendable, spendableSplit } from '@/features/accounts/spendable';

const account = (accountType: Parameters<typeof countsAsSpendable>[0]['accountType'], balance: number, countsAs: boolean | null = null, currency = 'INR') =>
  ({ accountType, balance, countsAsSpendable: countsAs, currency });

describe('ready to spend and put aside', () => {
  it('puts savings and investments aside by their kind, and counts every other kind', () => {
    expect(countsAsSpendable(account('savings', 0))).toBe(false);
    expect(countsAsSpendable(account('investment', 0))).toBe(false);
    for (const kind of ['bank', 'cash', 'ewallet', 'credit_card', 'loan'] as const) expect(countsAsSpendable(account(kind, 0))).toBe(true);
    // An account saved before kinds existed is a bank account.
    expect(countsAsSpendable(account(null, 0))).toBe(true);
  });

  it('follows the switch once it was changed by hand, whatever the kind', () => {
    expect(countsAsSpendable(account('savings', 0, true))).toBe(true);
    expect(countsAsSpendable(account('bank', 0, false))).toBe(false);
  });

  it('splits one currency in two parts that add up to everything held', () => {
    const accounts = [account('bank', 3240.1), account('cash', 227.17), account('credit_card', -640), account('savings', 12400), account('bank', 999, null, 'USD')];
    const split = spendableSplit(accounts, 'INR');
    expect(split).toEqual({ ready: 3240.1 + 227.17 - 640, readyAccounts: 3, putAside: 12400, putAsideAccounts: 1 });
    expect(split.ready + split.putAside).toBeCloseTo(3240.1 + 227.17 - 640 + 12400);
  });

  it('puts nothing aside when no account is', () => {
    expect(spendableSplit([account('bank', 100), account('cash', 5)], 'INR')).toMatchObject({ putAside: 0, putAsideAccounts: 0, readyAccounts: 2, ready: 105 });
  });
});
