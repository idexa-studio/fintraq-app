import type { TransactionListItem } from '@/data/repositories/transactions';
import { IconCircle, ListRow, resolveIcon } from '@/design';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { differenceInCalendarDays } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type TransactionRowProps = {
  transaction: TransactionListItem;
  /** What the second line starts with: the day, in a mixed list; the time, in a list already grouped by day. */
  when: 'day' | 'time';
  onPress?: (transaction: TransactionListItem) => void;
};

/** "Today", "Yesterday", or the date, with the year only when it is not this one. */
export function dayLabel(date: Date, today: string, yesterday: string, now: Date = new Date()): string {
  const ago = differenceInCalendarDays(now, date);
  if (ago === 0) return today;
  if (ago === 1) return yesterday;
  return formatDate(date, date.getFullYear() === now.getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Money out carries the minus sign the app's language uses; money in is marked with a plus; a transfer is neither. */
export function signedAmount(transaction: Pick<TransactionListItem, 'type' | 'amount'> & { account: { currency: string } }): string {
  const amount = formatCurrency(transaction.type === 'DR' ? -transaction.amount : transaction.amount, transaction.account.currency);
  return transaction.type === 'CR' ? `+${amount}` : amount;
}

/** One transaction in any list: its category mark, what it was, when and where, and the amount. */
export function TransactionRow({ transaction: tx, when, onPress }: TransactionRowProps) {
  const { t } = useTranslation(['transactions', 'common']);
  const transfer = tx.type === 'TR';
  const where = transfer && tx.toAccount ? t('transferRoute', { from: tx.account.name, to: tx.toAccount.name }) : tx.account.name;
  const lead = when === 'day' ? dayLabel(parseDateKey(tx.datetime), t('common:today'), t('common:yesterday')) : formatDate(new Date(tx.datetime), { hour: 'numeric', minute: '2-digit' });
  return (
    <ListRow
      leading={<IconCircle icon={transfer ? 'arrows-left-right' : resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} />}
      strong
      title={tx.note.trim() || (transfer ? t('kinds.transfer') : tx.category.name)}
      subtitle={`${lead} · ${where}`}
      value={signedAmount(tx)}
      valueTone={tx.type === 'CR' ? 'positive' : 'default'}
      onPress={onPress ? () => onPress(tx) : undefined}
    />
  );
}
