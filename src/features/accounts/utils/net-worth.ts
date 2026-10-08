import type { Account } from '@/src/features/accounts/api/accounts';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';

export type CurrencyNetWorth = {
  currency: string;
  /** Positive balances. */
  assets: number;
  /** Negative balances (cards, loans) as a positive number. */
  debts: number;
  net: number;
  /** Accounts in this currency, largest balance first. */
  accounts: Account[];
};

/** Net worth per currency — balances in different currencies are never added together. */
export function netWorthByCurrency(accounts: readonly Account[], defaultCurrency: string): CurrencyNetWorth[] {
  const groups = new Map<string, CurrencyNetWorth>();
  for (const account of accounts) {
    const group = groups.get(account.currency) ?? { currency: account.currency, assets: 0, debts: 0, net: 0, accounts: [] };
    if (account.balance >= 0) group.assets += account.balance;
    else group.debts -= account.balance;
    group.net += account.balance;
    group.accounts.push(account);
    groups.set(account.currency, group);
  }
  return sortCurrenciesWithDefault([...groups.keys()], defaultCurrency).map((currency) => {
    const group = groups.get(currency)!;
    return { ...group, accounts: [...group.accounts].sort((a, b) => b.balance - a.balance) };
  });
}
