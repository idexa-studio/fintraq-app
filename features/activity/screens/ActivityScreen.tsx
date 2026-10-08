import type { TransactionFilters, TransactionListItem } from '@/data/repositories/transactions';
import { Button, Card, Chip, ChipRow, DayHeader, Dialog, Divider, EmptyState, Header, IconButton, Screen, Select, Skeleton, Stat, SwipeRow, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { dayNet } from '@/features/activity/day-totals';
import { useCategories } from '@/features/categories';
import { useSettings } from '@/features/settings';
import { TransactionRow, useDeleteTransaction, useInfiniteTransactions, useTransactionTotals } from '@/features/transactions';
import { groupByDay } from '@/shared/calc/transactions';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import type { TransactionType } from '@/shared/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

const KINDS = ['all', 'expense', 'income', 'transfer'] as const;
type KindFilter = (typeof KINDS)[number];
const TYPE_OF: Record<Exclude<KindFilter, 'all'>, TransactionType> = { expense: 'DR', income: 'CR', transfer: 'TR' };

const numberParam = (value: string | string[] | undefined): number | undefined => {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : (value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** The Activity tab: every transaction, newest first, a day at a time. */
export function ActivityScreen() {
  const { t, i18n } = useTranslation(['activity', 'transactions']);
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { profile } = useSettings();
  const params = useLocalSearchParams<{ accountId?: string; categoryId?: string }>();
  const accountId = numberParam(params.accountId);
  const categoryId = numberParam(params.categoryId);

  const [kind, setKind] = useState<KindFilter>('all');
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TransactionListItem | null>(null);

  const filters = useMemo<TransactionFilters>(
    () => ({
      ...(kind === 'all' ? {} : { types: [TYPE_OF[kind]] }),
      ...(accountId === undefined ? {} : { accountIds: [accountId] }),
      ...(categoryId === undefined ? {} : { categoryIds: [categoryId] }),
    }),
    [kind, accountId, categoryId],
  );

  const list = useInfiniteTransactions(filters);
  const { data: totals } = useTransactionTotals(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const remove = useDeleteTransaction();

  const transactions = useMemo(() => list.data?.pages.flat() ?? [], [list.data?.pages]);
  // Day titles are written in the app's language, so a language change groups again.
  const days = useMemo(() => groupByDay(transactions), [transactions, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Totals come per currency, since currencies cannot be added together: one is shown at a time.
  const currencies = sortCurrenciesWithDefault(Object.keys(totals ?? {}), profile.defaultCurrency);
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];
  const inCurrency = currency ? totals?.[currency] : undefined;

  const scopedTo = accountId !== undefined ? t('filteredBy.account', { name: accounts?.find((a) => a.id === accountId)?.name ?? '' }) : categoryId !== undefined ? t('filteredBy.category', { name: categories?.find((c) => c.id === categoryId)?.name ?? '' }) : null;
  const filtered = kind !== 'all' || scopedTo !== null;
  const showEverything = () => {
    setKind('all');
    router.setParams({ accountId: undefined, categoryId: undefined });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id).then(() => toast.show({ message: t('transactions:detail.deleted') }), () => undefined);
    setDeleting(null);
  };

  const top = (
    <View style={styles.top}>
      {scopedTo ? (
        <View style={styles.scope}><Chip label={scopedTo} onRemove={showEverything} removeLabel={t('filteredBy.remove')} /></View>
      ) : null}
      {inCurrency ? (
        <Card style={styles.summary}>
          <View style={styles.summaryHead}>
            <Text variant="bodyStrong">{t('summary.title')}</Text>
            {currencies.length > 1 ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosenCurrency} accessibilityLabel={t('summary.currency')} /> : null}
          </View>
          <View style={styles.stats}>
            <Stat label={t('summary.moneyIn')} value={formatCurrency(inCurrency.income, currency)} tone="positive" />
            <Stat label={t('summary.moneyOut')} value={formatCurrency(inCurrency.expense, currency)} />
          </View>
        </Card>
      ) : null}
    </View>
  );

  return (
    <Screen
      tabbed
      scroll={false}
      padded={false}
      header={
        <View>
          <Header title={t('title')} right={<IconButton icon="search" onPress={() => router.push('/search')} accessibilityLabel={t('search')} />} />
          <View style={styles.kinds}>
            <ChipRow>
              {KINDS.map((option) => <Chip key={option} label={t(`kinds.${option}`)} selected={option === kind} onPress={() => setKind(option)} />)}
            </ChipRow>
          </View>
        </View>
      }
    >
      {list.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={size.row * 2} />
          <Skeleton height={size.row * 3} />
          <Skeleton height={size.row * 2} />
        </View>
      ) : days.length === 0 ? (
        <View style={styles.empty}>
          {filtered ? (
            <EmptyState icon="search" title={t('noMatchTitle')} body={t('noMatchBody')} actionLabel={t('noMatchAction')} onAction={showEverything} />
          ) : (
            <EmptyState icon="receipt" title={t('emptyTitle')} body={t('emptyBody')} actionLabel={t('emptyAction')} onAction={() => router.push('/add')} />
          )}
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(day) => day.key}
          ListHeaderComponent={top}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={list.isFetchingNextPage ? <Skeleton height={size.row} /> : null}
          renderItem={({ item: day }) => (
            <View style={styles.day}>
              <DayHeader label={day.title} value={dayNet(day.data)} />
              <View style={styles.rows}>
                {day.data.map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    {i > 0 ? <Divider /> : null}
                    <SwipeRow
                      actions={[
                        { label: t('edit'), icon: 'pencil', onPress: () => router.push({ pathname: '/transactions/[id]/edit', params: { id: tx.id } }) },
                        { label: t('delete'), icon: 'trash', tone: 'danger', onPress: () => setDeleting(tx) },
                      ]}
                    >
                      <TransactionRow transaction={tx} when="time" onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } })} />
                    </SwipeRow>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <Dialog visible={!!deleting} onRequestClose={() => setDeleting(null)} title={t('transactions:detail.deleteTitle')} body={t('transactions:detail.deleteBody')}>
        <Button label={t('transactions:detail.deleteConfirm')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
        <Button label={t('transactions:detail.keep')} variant="secondary" onPress={() => setDeleting(null)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    kinds: { paddingBottom: space.md },
    top: { gap: space.lg, paddingBottom: space.sm },
    scope: { flexDirection: 'row' },
    summary: { gap: space.lg },
    summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
    stats: { flexDirection: 'row', gap: space.lg },
    list: { paddingHorizontal: size.screenPadding, paddingTop: space.sm, paddingBottom: space.xxl, gap: space.xl },
    day: { gap: space.sm },
    rows: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
    loading: { padding: size.screenPadding, gap: space.lg },
    empty: { flex: 1, justifyContent: 'center', padding: size.screenPadding },
  });
