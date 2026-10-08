import { formatCurrency } from '@/shared/format/money';

type Entry = { type: string; amount: number; account: { currency: string } };

/**
 * What a day came to, for its header: money in less money out, in the day's
 * currency. A day that mixes currencies has no single figure, and a day of
 * transfers only moved nothing in or out, so both show none.
 */
export function dayNet(entries: readonly Entry[]): string | undefined {
  const currencies = new Set(entries.map((e) => e.account.currency));
  if (currencies.size !== 1) return undefined;
  const counted = entries.filter((e) => e.type !== 'TR');
  if (counted.length === 0) return undefined;
  const net = counted.reduce((sum, e) => sum + (e.type === 'CR' ? e.amount : -e.amount), 0);
  const text = formatCurrency(net, [...currencies][0]);
  return net > 0 ? `+${text}` : text;
}
