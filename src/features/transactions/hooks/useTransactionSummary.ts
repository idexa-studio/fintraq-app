import { useMemo, useState } from 'react';
import { sortCurrenciesWithDefault } from '@/src/constants/currency';
import type { TransactionTotals } from '@/src/features/transactions/api/transactions';

const EMPTY_TOTALS = { income: 0, expense: 0 };
const NO_TOTALS: TransactionTotals = {};

/**
 * Income/expense for the summary card, per currency, with the user's currency choice. The totals
 * come from SQL with the list's exact filters, so they cover every matching row, not just the
 * pages scrolled so far.
 */
export function useTransactionSummary(dbTotals: TransactionTotals | undefined, defaultCurrency: string) {
  const totalsByCurrency = dbTotals ?? NO_TOTALS;
  const currencies = useMemo(
    () => sortCurrenciesWithDefault(Object.keys(totalsByCurrency), defaultCurrency),
    [totalsByCurrency, defaultCurrency],
  );

  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  // Fall back to the first available currency when the choice disappears (e.g. after filtering),
  // derived during render instead of synced through an effect; with no entries at all, the
  // default currency, so an empty list still reads "$0.00", not a bare "0.00".
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : (currencies[0] ?? defaultCurrency);
  const totals = currency ? (totalsByCurrency[currency] ?? EMPTY_TOTALS) : EMPTY_TOTALS;

  return { totals, currency, currencies, setCurrency };
}
