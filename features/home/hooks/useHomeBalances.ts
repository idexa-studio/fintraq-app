import type { Account } from '@/data/repositories/accounts';
import { useSettings } from '@/features/settings';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { useMemo, useState } from 'react';

export type HomeBalances = {
  /** The currency Home is showing. */
  currency: string;
  /** Every currency the user holds, the default first. One entry means no switcher. */
  currencies: string[];
  setCurrency: (currency: string) => void;
  /** Sum of the balances of the accounts in `currency`. */
  balance: number;
  /** How many accounts are in `currency`. */
  count: number;
};

/** Which currency Home shows, and what the accounts in it add up to. */
export function useHomeBalances(accounts: readonly Account[] | undefined): HomeBalances {
  const { profile } = useSettings();
  const [chosen, setChosen] = useState<string | null>(null);

  return useMemo(() => {
    const held = [...new Set((accounts ?? []).map((a) => a.currency))];
    const currencies = sortCurrenciesWithDefault(held.length ? held : [DEFAULT_CURRENCY], profile.defaultCurrency);
    // Falls back when the chosen currency disappears, e.g. its last account was deleted.
    const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0];
    const inCurrency = (accounts ?? []).filter((a) => a.currency === currency);
    return { currency, currencies, setCurrency: setChosen, balance: inCurrency.reduce((sum, a) => sum + a.balance, 0), count: inCurrency.length };
  }, [accounts, chosen, profile.defaultCurrency]);
}
