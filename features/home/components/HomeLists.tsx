import type { Account } from '@/data/repositories/accounts';
import type { TransactionListItem } from '@/data/repositories/transactions';
import { Card, EmptyState, IconCircle, ListGroup, ListRow, Skeleton, useTheme } from '@/design';
import type { IconName } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import type { PersonBalance } from '@/features/people';
import { TransactionRow } from '@/features/transactions';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
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
  const { t } = useTranslation('home');
  return (
    <HomeList items={transactions} loading={loading} empty={{ icon: 'receipt', title: t('recent.emptyTitle'), body: t('recent.emptyBody'), action: t('recent.emptyAction'), onAction: onAdd }}>
      {(tx) => <TransactionRow key={tx.id} transaction={tx} when="day" onPress={() => onOpen(tx.id)} />}
    </HomeList>
  );
}

type PeopleListProps = { people: readonly PersonBalance[] | undefined; currency: string; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

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
