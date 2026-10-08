import type { TransactionFilters, TransactionListItem } from '@/data/repositories/transactions';
import { Button, Card, Chip, DayHeader, Dialog, Divider, EmptyState, Header, IconButton, Screen, Select, Skeleton, Stat, SwipeRow, TabStrip, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { activityItems } from '@/features/activity/activity-list';
import type { ActivityItem } from '@/features/activity/activity-list';
import { useCategories } from '@/features/categories';
import { useSettings } from '@/features/settings';
import { TransactionRow, useDeleteTransaction, useInfiniteTransactions, useTransactionTotals } from '@/features/transactions';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import type { TransactionType } from '@/shared/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

const KINDS = ['all', 'expense', 'income', 'transfer'] as const;
type KindFilter = (typeof KINDS)[number];
const TYPE_OF: Record<Exclude<KindFilter, 'all'>, TransactionType> = { expense: 'DR', income: 'CR', transfer: 'TR' };

const numberParam = (value: string | string[] | undefined): number | undefined => {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : (value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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
  const params = useLocalSearchParams<{ accountId?: string; categoryId?: string }>();
  const accountId = numberParam(params.accountId);
  const categoryId = numberParam(params.categoryId);

  const [kind, setKind] = useState<KindFilter>('all');
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TransactionListItem | null>(null);

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const remove = useDeleteTransaction();

  // The currencies held, the default first. Scoped to one account, the screen is in that account's currency.
  const scopedAccount = accountId === undefined ? undefined : accounts?.find((a) => a.id === accountId);
  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set((accounts ?? []).map((a) => a.currency))], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const currency = scopedAccount?.currency ?? (chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]);

  const filters = useMemo<TransactionFilters>(() => {
    const inCurrency = (accounts ?? []).filter((a) => a.currency === currency).map((a) => a.id);
    return {
      ...(kind === 'all' ? {} : { types: [TYPE_OF[kind]] }),
      // With one currency held there is nothing to narrow; otherwise the list is that currency's accounts.
      ...(accountId !== undefined ? { accountIds: [accountId] } : currencies.length > 1 ? { accountIds: inCurrency } : {}),
      ...(categoryId === undefined ? {} : { categoryIds: [categoryId] }),
    };
  }, [kind, accountId, categoryId, accounts, currency, currencies.length]);

  const list = useInfiniteTransactions(filters);
  const { data: totals } = useTransactionTotals(filters);

  const transactions = useMemo(() => list.data?.pages.flat() ?? [], [list.data?.pages]);
  // Day titles are written in the app's language, so a language change builds the lines again.
  const items = useMemo(() => activityItems(transactions), [transactions, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const inCurrency = currency ? totals?.[currency] : undefined;

  const scopedTo = accountId !== undefined ? t('filteredBy.account', { name: scopedAccount?.name ?? '' }) : categoryId !== undefined ? t('filteredBy.category', { name: categories?.find((c) => c.id === categoryId)?.name ?? '' }) : null;
  const narrowed = kind !== 'all' || scopedTo !== null;
  const showEverything = useCallback(() => {
    setKind('all');
    router.setParams({ accountId: undefined, categoryId: undefined });
  }, [router]);

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
      {scopedTo ? (
        <View style={styles.scope}><Chip label={scopedTo} onRemove={showEverything} removeLabel={t('filteredBy.remove')} /></View>
      ) : null}
      <Card style={styles.summary}>
        <View style={styles.summaryHead}>
          <Text variant="bodyStrong">{t(`summary.title.${kind}`)}</Text>
          {currencies.length > 1 && !scopedAccount ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosenCurrency} accessibilityLabel={t('summary.currency')} /> : null}
        </View>
        <View style={styles.stats}>
          {kind === 'expense' ? null : <Stat label={t('summary.moneyIn')} value={formatCurrency(inCurrency?.income ?? 0, currency)} tone="positive" />}
          {kind === 'income' ? null : <Stat label={t('summary.moneyOut')} value={formatCurrency(inCurrency?.expense ?? 0, currency)} />}
        </View>
      </Card>
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
            <EmptyState icon="receipt" title={t('emptyTitle')} body={t('emptyBody')} actionLabel={t('emptyAction')} onAction={() => router.push('/add')} />
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
    scope: { flexDirection: 'row' },
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
