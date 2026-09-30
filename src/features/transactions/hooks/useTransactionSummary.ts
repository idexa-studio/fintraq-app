import { useMemo, useState } from 'react';
import { sortCurrenciesWithDefault } from '@/src/constants/currency';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { CurrencyTotals, sumByCurrency } from '@/src/utils/transactions';

const EMPTY_TOTALS = { income: 0, expense: 0 };

/**
 * Income/expense for the summary card, per currency, with the user's currency choice.
 * Uses the DB aggregate when the filters map 1:1 to SQL (accurate regardless of scroll); when
 * client-side filtering is active it can only sum the rows loaded so far.
 */
export function useTransactionSummary(
  loaded: readonly TransactionListItem[],
  dbTotals: CurrencyTotals | undefined,
  defaultCurrency: string,
) {
  const totalsByCurrency = useMemo(() => dbTotals ?? sumByCurrency(loaded), [dbTotals, loaded]);
  const currencies = useMemo(
    () => sortCurrenciesWithDefault(Object.keys(totalsByCurrency), defaultCurrency),
    [totalsByCurrency, defaultCurrency],
  );

  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  // Fall back to the first available currency when the choice disappears (e.g. after filtering),
  // derived during render instead of synced through an effect.
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : (currencies[0] ?? null);
  const totals = currency ? (totalsByCurrency[currency] ?? EMPTY_TOTALS) : EMPTY_TOTALS;

  const netByCurrency = useMemo(
    () => Object.fromEntries(Object.entries(totalsByCurrency).map(([code, t]) => [code, t.income - t.expense])),
    [totalsByCurrency],
  );

  return { totals, currency, currencies, setCurrency, netByCurrency };
}
