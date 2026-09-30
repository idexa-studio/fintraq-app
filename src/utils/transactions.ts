import { format } from 'date-fns';

type Totalable = { type: string; amount: number; account: { currency: string } };

export type CurrencyTotals = Record<string, { income: number; expense: number }>;

/** Income/expense per currency. Transfers are neither, so they're excluded. */
export function sumByCurrency(items: readonly Totalable[]): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const tx of items) {
    const bucket = (totals[tx.account.currency] ??= { income: 0, expense: 0 });
    if (tx.type === 'CR') bucket.income += tx.amount;
    else if (tx.type === 'DR') bucket.expense += tx.amount;
  }
  return totals;
}

/**
 * Groups items into day sections, preserving input order (the DB already sorted them).
 * Keyed by calendar date — not the display label, which has no year and would merge
 * different days (e.g. "Wed, 1 Oct" in 2025 and 2031).
 */
export function groupByDay<T extends { datetime: string }>(
  items: readonly T[],
  now: Date = new Date(),
): { key: string; title: string; data: T[] }[] {
  const currentYear = now.getFullYear();
  const sections = new Map<string, { key: string; title: string; data: T[] }>();
  for (const item of items) {
    const date = new Date(item.datetime);
    const key = format(date, 'yyyy-MM-dd');
    let section = sections.get(key);
    if (!section) {
      // The year only appears when it isn't this year, so older entries aren't ambiguous.
      const title = format(date, date.getFullYear() === currentYear ? 'EEE, d MMM' : 'EEE, d MMM yyyy');
      section = { key, title, data: [] };
      sections.set(key, section);
    }
    section.data.push(item);
  }
  return Array.from(sections.values());
}
