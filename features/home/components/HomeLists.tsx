import type { Account } from '@/data/repositories/accounts';
import type { TransactionListItem } from '@/data/repositories/transactions';
import { Card, EmptyState, Icon, IconCircle, ListGroup, ListRow, Skeleton, Text, Touchable, ltr, useStyles, useTheme } from '@/design';
import type { IconName, PastelName, Theme } from '@/design';
import { firstName } from '@/features/home/home-rules';
import { accountTypeIcon } from '@/features/accounts';
import type { PersonBalance } from '@/features/people';
import { TransactionRow } from '@/features/transactions';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

type Empty = { icon: IconName; color: PastelName; title: string; body: string; action: string; onAction: () => void };

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
  if (items.length === 0) return <EmptyState compact icon={empty.icon} color={empty.color} title={empty.title} body={empty.body} actionLabel={empty.action} onAction={empty.onAction} />;
  return <ListGroup>{items.map(children)}</ListGroup>;
}

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

type AccountListProps = { accounts: readonly Account[] | undefined; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

export function AccountList({ accounts, loading, onOpen, onAdd }: AccountListProps) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <HomeList items={accounts} loading={loading} empty={{ icon: 'wallet', color: 'lilac', title: t('accounts.emptyTitle'), body: t('accounts.emptyBody'), action: t('accounts.emptyAction'), onAction: onAdd }}>
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
    <HomeList items={transactions} loading={loading} empty={{ icon: 'receipt', color: 'orange', title: t('recent.emptyTitle'), body: t('recent.emptyBody'), action: t('recent.emptyAction'), onAction: onAdd }}>
      {(tx) => <TransactionRow key={tx.id} transaction={tx} when="day" onPress={() => onOpen(tx.id)} />}
    </HomeList>
  );
}

type PeopleStripProps = { people: readonly PersonBalance[] | undefined; currency: string; loading: boolean; onOpen: (id: number) => void; onAdd: () => void };

/**
 * The people money is shared with, as faces in a row rather than lines in a
 * list: who it is, and under each what stands between you. Whoever has
 * something outstanding comes first; the row scrolls sideways for the rest.
 */
export function PeopleStrip({ people, currency, loading, onOpen, onAdd }: PeopleStripProps) {
  const { t } = useTranslation('home');
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  // A size up from a row's mark: a face, not a headline.
  const face = size.iconCircleLarge;
  if (loading || !people) return <Card><Skeleton height={face + space.xxl} /></Card>;
  if (people.length === 0) return <EmptyState compact icon="users" color="teal" title={t('people.emptyTitle')} body={t('people.emptyBody')} actionLabel={t('people.emptyAction')} onAction={onAdd} />;
  return (
    <Card padded={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {people.map((person) => {
          const standing = person.net > 0 ? t('people.owesYou') : person.net < 0 ? t('people.youOwe') : t('people.settled');
          const amount = person.net === 0 ? null : formatCurrency(Math.abs(person.net), currency);
          return (
            <Touchable key={person.id} onPress={() => onOpen(person.id)} accessibilityLabel={[person.name, standing, amount].filter(Boolean).join(', ')} style={styles.person}>
              <IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} size={face} />
              <Text variant="callout" align="center" numberOfLines={1}>{firstName(person.name)}</Text>
              <View style={styles.standing}>
                <Text variant="caption" tone="muted" align="center" numberOfLines={1}>{standing}</Text>
                {amount ? <Text variant="calloutStrong" tone={person.net > 0 ? 'positive' : 'default'} align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{ltr(amount)}</Text> : null}
              </View>
            </Touchable>
          );
        })}
        <Touchable onPress={onAdd} accessibilityLabel={t('people.emptyAction')} style={styles.person}>
          <View style={[styles.add, { width: face, height: face, borderRadius: face / 2 }]}>
            <Icon name="plus" />
          </View>
          <Text variant="calloutStrong" align="center" numberOfLines={2}>{t('people.add')}</Text>
        </Touchable>
      </ScrollView>
    </Card>
  );
}

const createStyles = ({ colors, border, size, space }: Theme) =>
  StyleSheet.create({
    strip: { padding: size.cardPadding, gap: space.md },
    // Wide enough for an amount under the face, narrow enough that the next one peeks in and shows the row scrolls.
    person: { width: size.illustrationTile + space.sm, alignItems: 'center', gap: space.sm },
    standing: { alignSelf: 'stretch' },
    add: { alignItems: 'center', justifyContent: 'center', borderWidth: border.thin, borderColor: colors.border },
  });
