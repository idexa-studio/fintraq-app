import type { TransactionListItem } from '@/data/repositories/transactions';
import { IconCircle, ListRow, resolveIcon } from '@/design';
import { dayLabel, formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { signedAmount } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type TransactionRowProps = {
  transaction: TransactionListItem;
  /** What the second line starts with: the day, in a mixed list; the time, in a list already grouped by day. */
  when: 'day' | 'time';
  onPress?: (transaction: TransactionListItem) => void;
};

/** One transaction in any list: its category mark, what it was, when and where, and the amount. */
export function TransactionRow({ transaction: tx, when, onPress }: TransactionRowProps) {
  const { t } = useTranslation(['transactions', 'common']);
  const transfer = tx.type === 'TR';
  const where = transfer && tx.toAccount ? t('transferRoute', { from: tx.account.name, to: tx.toAccount.name }) : tx.account.name;
  const lead = when === 'day' ? dayLabel(new Date(tx.datetime), t('common:today'), t('common:yesterday')) : formatDate(new Date(tx.datetime), { hour: 'numeric', minute: '2-digit' });
  return (
    <ListRow
      leading={<IconCircle icon={transfer ? 'arrows-left-right' : resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} />}
      strong
      oneLine
      title={tx.note.trim() || (transfer ? t('kinds.transfer') : tx.category.name)}
      subtitle={`${lead} · ${where}`}
      value={signedAmount(tx)}
      valueTone={tx.type === 'CR' ? 'positive' : 'default'}
      onPress={onPress ? () => onPress(tx) : undefined}
    />
  );
}
