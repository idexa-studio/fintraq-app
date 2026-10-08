import type { TransactionFilters, TransactionListItem } from '@/data/repositories/transactions';
import { Button, Card, Chip, DayHeader, Dialog, Divider, EmptyState, Header, IconButton, Screen, Select, Skeleton, Stat, SwipeRow, TabStrip, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { KINDS, NO_FILTERS, activeCount, filtersFromLink, toQuery } from '@/features/activity/activity-filters';
import type { ActivityFilters, ActivityLink, KindFilter } from '@/features/activity/activity-filters';
import { activityItems } from '@/features/activity/activity-list';
import type { ActivityItem } from '@/features/activity/activity-list';
import { useCategories } from '@/features/categories';
import { ActivityFilterSheet, periodLabel } from '@/features/activity/components/ActivityFilterSheet';
import { usePersons } from '@/features/people';
import { useSettings } from '@/features/settings';
import { TransactionRow, useDeleteTransaction, useInfiniteTransactions, useTransactionTotals } from '@/features/transactions';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

type RowProps = {
  item: Extract<ActivityItem, { kind: 'row' }>;
  onOpen: (transaction: TransactionListItem) => void;
  onEdit: (transaction: TransactionListItem) => void;
  onDelete: (transaction: TransactionListItem) => void;
  labels: { edit: string; delete: string };
};

/** One transaction line. Memoised with stable handlers, so scrolling and paging never redraw the lines already there. */
const ActivityRow = React.memo(function ActivityRow({ item, onOpen, onEdit, onDelete, labels }: RowProps) {
  const styles = useStyles(createStyles);
  const { transaction } = item;
  return (
    <View style={[styles.row, item.first ? styles.rowFirst : null, item.last ? styles.rowLast : null]}>
      {item.first ? null : <Divider />}
      <SwipeRow
        actions={[
          { label: labels.edit, icon: 'pencil', onPress: () => onEdit(transaction) },
          { label: labels.delete, icon: 'trash', tone: 'danger', onPress: () => onDelete(transaction) },
        ]}
      >
        <TransactionRow transaction={transaction} when="time" onPress={onOpen} />
      </SwipeRow>
    </View>
  );
});

/**
 * The Activity tab: every transaction, newest first, a day at a time. One
 * currency is shown at a time, as on Home, and the choice applies to the
 * whole screen: the totals and the list always describe the same thing.
 */
export function ActivityScreen() {
  const { t, i18n } = useTranslation(['activity', 'transactions']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { profile } = useSettings();
  const params = useLocalSearchParams<ActivityLink>();
  const { accountId, categoryId, personId, from, to } = params;
  // What the link that opened the screen asks for, if anything.
  const linked = useMemo(() => filtersFromLink({ accountId, categoryId, personId, from, to }), [accountId, categoryId, personId, from, to]);

  const [kind, setKind] = useState<KindFilter>('all');
  const [filters, setFilters] = useState<ActivityFilters>(linked ?? NO_FILTERS);
  const [filtering, setFiltering] = useState(false);

  // Arriving by a link narrows the list to what it asks for, replacing whatever was set.
  useEffect(() => {
    if (linked) setFilters(linked);
  }, [linked]);
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TransactionListItem | null>(null);

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: people } = usePersons();
  const remove = useDeleteTransaction();

  // The currencies held, the default first. Scoped to one account, the screen is in that account's currency.
  const scopedAccount = filters.accountId === undefined ? undefined : accounts?.find((a) => a.id === filters.accountId);
  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set((accounts ?? []).map((a) => a.currency))], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const currency = scopedAccount?.currency ?? (chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]);

  const query = useMemo<TransactionFilters>(() => {
    // With one currency held there is nothing to narrow; otherwise the list is that currency's accounts.
    const inCurrency = currencies.length > 1 ? (accounts ?? []).filter((a) => a.currency === currency).map((a) => a.id) : undefined;
    return toQuery(filters, kind, inCurrency);
  }, [filters, kind, accounts, currency, currencies.length]);

  const list = useInfiniteTransactions(query);
  const { data: totals } = useTransactionTotals(query);

  const transactions = useMemo(() => list.data?.pages.flat() ?? [], [list.data?.pages]);
  // Day titles are written in the app's language, so a language change builds the lines again.
  const items = useMemo(() => activityItems(transactions), [transactions, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const inCurrency = currency ? totals?.[currency] : undefined;

  const on = activeCount(filters);
  const narrowed = kind !== 'all' || on > 0;
  const change = useCallback((next: ActivityFilters) => {
    setFilters(next);
    // The link that brought the user here no longer describes the list once they change it.
    router.setParams({ accountId: undefined, categoryId: undefined, personId: undefined, from: undefined, to: undefined });
  }, [router]);
  const showEverything = useCallback(() => {
    setKind('all');
    change(NO_FILTERS);
  }, [change]);

  // What is narrowing the list, each removable on its own.
  const applied = [
    filters.period !== 'all' ? { key: 'period', label: periodLabel(filters, t), without: { ...filters, period: 'all' as const, from: undefined, to: undefined } } : null,
    scopedAccount ? { key: 'account', label: scopedAccount.name, without: { ...filters, accountId: undefined } } : null,
    filters.categoryId !== undefined ? { key: 'category', label: categories?.find((c) => c.id === filters.categoryId)?.name ?? '', without: { ...filters, categoryId: undefined } } : null,
    filters.personId !== undefined ? { key: 'person', label: people?.find((p) => p.id === filters.personId)?.name ?? '', without: { ...filters, personId: undefined } } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  const open = useCallback((tx: TransactionListItem) => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } }), [router]);
  const edit = useCallback((tx: TransactionListItem) => router.push({ pathname: '/transactions/[id]/edit', params: { id: tx.id } }), [router]);
  const labels = useMemo(() => ({ edit: t('edit'), delete: t('delete') }), [t]);

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id).then(() => toast.show({ message: t('transactions:detail.deleted') }), () => undefined);
    setDeleting(null);
  };

  const renderItem = useCallback(
    ({ item }: { item: ActivityItem }) =>
      item.kind === 'day' ? (
        <View style={styles.dayHead}><DayHeader label={item.title} value={item.net} /></View>
      ) : (
        <ActivityRow item={item} onOpen={open} onEdit={edit} onDelete={setDeleting} labels={labels} />
      ),
    [styles.dayHead, open, edit, labels],
  );

  const top = (
    <View style={styles.top}>
      {applied.length > 0 ? (
        <View style={styles.applied}>
          {applied.map((chip) => <Chip key={chip.key} label={chip.label} onRemove={() => change(chip.without)} removeLabel={t('filter.remove', { name: chip.label })} />)}
        </View>
      ) : null}
      {narrowed ? (
        <Card style={styles.summary}>
          <View style={styles.summaryHead}>
            <Text variant="bodyStrong">{on > 0 ? t(`summary.narrowed.${kind}`) : t(`summary.title.${kind}`)}</Text>
            {currencies.length > 1 && !scopedAccount ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosenCurrency} accessibilityLabel={t('summary.currency')} /> : null}
          </View>
          <View style={styles.stats}>
            {kind === 'expense' ? null : <Stat label={t('summary.moneyIn')} value={formatCurrency(inCurrency?.income ?? 0, currency)} tone="positive" />}
            {kind === 'income' ? null : <Stat label={t('summary.moneyOut')} value={formatCurrency(inCurrency?.expense ?? 0, currency)} />}
          </View>
        </Card>
      ) : currencies.length > 1 ? (
        // Unnarrowed, the totals would be everything ever recorded, which answers nothing; only the currency choice is kept.
        <View style={styles.summaryHead}>
          <Text variant="bodyStrong">{t('summary.title.all')}</Text>
          <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosenCurrency} accessibilityLabel={t('summary.currency')} />
        </View>
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
          <Header title={t('title')} right={
              <>
                <IconButton icon="filter" onPress={() => setFiltering(true)} accessibilityLabel={on > 0 ? t('filter.openCount', { count: on }) : t('filter.open')} />
                <IconButton icon="search" onPress={() => router.push('/search')} accessibilityLabel={t('search')} />
              </>
            }
          />
          <TabStrip tabs={KINDS.map((option) => ({ key: option, label: t(`kinds.${option}`) }))} value={kind} onChange={setKind} accessibilityLabel={t('kindLabel')} />
        </View>
      }
    >
      {list.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={size.row * 2} />
          <Skeleton height={size.row * 3} />
          <Skeleton height={size.row * 2} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          {narrowed ? (
            <EmptyState icon="search" title={t('noMatchTitle')} body={t('noMatchBody')} actionLabel={t('noMatchAction')} onAction={showEverything} />
          ) : (
            <EmptyState icon="receipt" color="orange" title={t('emptyTitle')} body={t('emptyBody')} actionLabel={t('emptyAction')} onAction={() => router.push('/add')} />
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          ListHeaderComponent={top}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          // Draw a screenful first and the rest in small batches, and keep only a few screens mounted.
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={list.isFetchingNextPage ? <Skeleton height={size.row} /> : null}
        />
      )}

      <ActivityFilterSheet visible={filtering} onClose={() => setFiltering(false)} filters={filters} onChange={change} accounts={accounts ?? []} categories={categories ?? []} people={people ?? []} />

      <Dialog visible={!!deleting} onRequestClose={() => setDeleting(null)} title={t('transactions:detail.deleteTitle')} body={t('transactions:detail.deleteBody')}>
        <Button label={t('transactions:detail.deleteConfirm')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
        <Button label={t('transactions:detail.keep')} variant="secondary" onPress={() => setDeleting(null)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    top: { gap: space.lg, paddingTop: space.lg },
    applied: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    summary: { gap: space.lg },
    summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
    stats: { flexDirection: 'row', gap: space.lg },
    list: { paddingHorizontal: size.screenPadding, paddingBottom: space.xxl },
    dayHead: { paddingTop: space.xl, paddingBottom: space.sm },
    // A day's lines join into one card: only its first and last line are rounded.
    row: { backgroundColor: colors.surface, overflow: 'hidden' },
    rowFirst: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
    rowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
    loading: { padding: size.screenPadding, gap: space.lg },
    empty: { flex: 1, justifyContent: 'center', padding: size.screenPadding },
  });
