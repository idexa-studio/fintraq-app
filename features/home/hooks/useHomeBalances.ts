import type { Account } from '@/data/repositories/accounts';
import { spendableSplit } from '@/features/accounts';
import { useSettings } from '@/features/settings';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { useMemo, useState } from 'react';

export type HomeBalances = {
  /** The currency Home is showing. */
  currency: string;
  /** Every currency the user holds, the default first. One entry means no switcher. */
  currencies: string[];
  setCurrency: (currency: string) => void;
  /** What is ready to spend in `currency`: every account's balance, less what is put aside. */
  balance: number;
  /** The accounts in `currency`, in their saved order. Home lists only these. */
  accounts: Account[];
  /**
   * What is put aside in `currency` (savings, investments: phase O), kept out of `balance`; how
   * much and in how many accounts. Absent when nothing is put aside, and the card is as before.
   */
  putAside?: { amount: number; accounts: number };
};

/**
 * Which currency Home shows. Amounts in different currencies cannot be added
 * together, so Home shows one currency at a time and every section follows
 * the same choice: the switch is a lens over the whole screen, never over one
 * card.
 */
export function useHomeBalances(accounts: readonly Account[] | undefined): HomeBalances {
  const { profile } = useSettings();
  const [chosen, setChosen] = useState<string | null>(null);

  return useMemo(() => {
    const held = [...new Set((accounts ?? []).map((a) => a.currency))];
    const currencies = sortCurrenciesWithDefault(held.length ? held : [DEFAULT_CURRENCY], profile.defaultCurrency);
    // Falls back when the chosen currency disappears, e.g. its last account was deleted.
    const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0];
    const inCurrency = (accounts ?? []).filter((a) => a.currency === currency);
    const split = spendableSplit(inCurrency, currency);
    return {
      currency, currencies, setCurrency: setChosen, balance: split.ready, accounts: inCurrency,
      ...(split.putAsideAccounts > 0 ? { putAside: { amount: split.putAside, accounts: split.putAsideAccounts } } : {}),
    };
  }, [accounts, chosen, profile.defaultCurrency]);
}
