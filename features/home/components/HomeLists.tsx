import type { Account } from '@/data/repositories/accounts';
import type { PersonNetRow } from '@/data/repositories/summaries';
import type { TransactionListItem } from '@/data/repositories/transactions';
import { Card, EmptyState, IconCircle, ListGroup, ListRow, Skeleton, resolveIcon, useTheme } from '@/design';
import type { IconName } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { differenceInCalendarDays } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Empty = { icon: IconName; title: string; body: string; action: string; onAction: () => void };

/** A list that is still loading, has nothing yet, or has rows: the three states every Home section shares. */
function HomeList<T>({ items, loading, empty, children }: { items: readonly T[] | undefined; loading: boolean; empty: Empty; children: (item: T) => React.ReactNode }) {
  const { size, space } = useTheme();
  if (loading || !items) {
    return (
      <Card style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
        <Skeleton height={size.iconCircle} circle />
        <View style={{ flex: 1, gap: space.sm }}>
          <Skeleton height={space.lg} width="60%" />
          <Skeleton height={space.md} width="40%" />
        </View>
      </Card>
    );
  }
  if (items.length === 0) return <EmptyState compact icon={empty.icon} title={empty.title} body={empty.body} actionLabel={empty.action} onAction={empty.onAction} />;
  return <ListGroup>{items.map(children)}</ListGroup>;
}

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

type AccountListProps = { accounts: readonly Account[] | undefined; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

export function AccountList({ accounts, loading, onOpen, onAdd }: AccountListProps) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <HomeList items={accounts} loading={loading} empty={{ icon: 'wallet', title: t('accounts.emptyTitle'), body: t('accounts.emptyBody'), action: t('accounts.emptyAction'), onAction: onAdd }}>
      {(account) => (
        <ListRow
          key={account.id}
          leading={<IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />}
          strong
          title={account.name}
          subtitle={t(`common:accountTypes.${account.accountType ?? 'bank'}`)}
          value={formatCurrency(account.balance, account.currency)}
          onPress={() => onOpen(account.id)}
        />
      )}
    </HomeList>
  );
}

type RecentListProps = { transactions: readonly TransactionListItem[] | undefined; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

export function RecentList({ transactions, loading, onOpen, onAdd }: RecentListProps) {
  const { t } = useTranslation(['home', 'common']);
  const today = new Date();

  const dayOf = (datetime: string) => {
    const day = parseDateKey(datetime);
    const ago = differenceInCalendarDays(today, day);
    if (ago === 0) return t('common:today');
    if (ago === 1) return t('common:yesterday');
    return formatDate(day, day.getFullYear() === today.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <HomeList items={transactions} loading={loading} empty={{ icon: 'receipt', title: t('recent.emptyTitle'), body: t('recent.emptyBody'), action: t('recent.emptyAction'), onAction: onAdd }}>
      {(tx) => {
        const transfer = tx.type === 'TR';
        // Money out carries the minus sign the app's language uses; money in is marked with a plus.
        const amount = formatCurrency(tx.type === 'DR' ? -tx.amount : tx.amount, tx.account.currency);
        const where = transfer && tx.toAccount ? t('recent.transferRoute', { from: tx.account.name, to: tx.toAccount.name }) : tx.account.name;
        return (
          <ListRow
            key={tx.id}
            leading={<IconCircle icon={transfer ? 'arrows-left-right' : resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} />}
            strong
            title={tx.note.trim() || (transfer ? t('recent.transfer') : tx.category.name)}
            subtitle={`${dayOf(tx.datetime)} · ${where}`}
            value={tx.type === 'CR' ? `+${amount}` : amount}
            valueTone={tx.type === 'CR' ? 'positive' : 'default'}
            onPress={() => onOpen(tx.id)}
          />
        );
      }}
    </HomeList>
  );
}

type PeopleListProps = { people: readonly PersonNetRow[] | undefined; currency: string; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

export function PeopleList({ people, currency, loading, onOpen, onAdd }: PeopleListProps) {
  const { t } = useTranslation('home');
  return (
    <HomeList items={people} loading={loading} empty={{ icon: 'users', title: t('people.emptyTitle'), body: t('people.emptyBody'), action: t('people.emptyAction'), onAction: onAdd }}>
      {(person) => (
        <ListRow
          key={person.id}
          leading={<IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} />}
          strong
          title={person.name}
          subtitle={person.net > 0 ? t('people.owesYou') : person.net < 0 ? t('people.youOwe') : t('people.settled')}
          value={person.net === 0 ? undefined : formatCurrency(Math.abs(person.net), currency)}
          valueTone={person.net > 0 ? 'positive' : 'default'}
          onPress={() => onOpen(person.id)}
        />
      )}
    </HomeList>
  );
}
