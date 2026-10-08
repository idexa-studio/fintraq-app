import type { TransactionListItem } from '@/data/repositories/transactions';
import { dayNet } from '@/features/activity/day-totals';
import { groupByDay } from '@/shared/calc/transactions';

/** One line of the Activity list: a day's heading, or a transaction with its place in the day's card. */
export type ActivityItem =
  | { kind: 'day'; key: string; title: string; net: string | undefined }
  | { kind: 'row'; key: string; transaction: TransactionListItem; first: boolean; last: boolean };

/**
 * The list as flat lines, so the screen can draw only the lines in view. A
 * day is a heading followed by its transactions; each transaction knows
 * whether it opens or closes the day's card, to round the right corners.
 */
export function activityItems(transactions: readonly TransactionListItem[], now: Date = new Date()): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const day of groupByDay(transactions, now)) {
    items.push({ kind: 'day', key: `day-${day.key}`, title: day.title, net: dayNet(day.data) });
    day.data.forEach((transaction, i) => {
      items.push({ kind: 'row', key: `tx-${transaction.id}`, transaction, first: i === 0, last: i === day.data.length - 1 });
    });
  }
  return items;
}
