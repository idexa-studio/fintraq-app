import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, EmptyState, Fab, IconButton, Screen, SkeletonScreen, Spinner } from '@/src/components/ui';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCategories } from '@/src/features/categories/hooks/categories';
import { AdvancedFilterBottomSheet } from '@/src/features/filters/components/AdvancedFilterBottomSheet';
import { usePersons } from '@/src/features/persons/hooks/persons';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { ActiveFilterChips } from '@/src/features/transactions/components/ActiveFilterChips';
import { SwipeableTransactionRow } from '@/src/features/transactions/components/SwipeableTransactionRow';
import { TransactionDayHeader } from '@/src/features/transactions/components/TransactionDayHeader';
import { TransactionSortDialog } from '@/src/features/transactions/components/TransactionSortDialog';
import { TransactionSummaryCard } from '@/src/features/transactions/components/TransactionSummaryCard';
import { useDeleteTransaction, useInfiniteTransactions, useTransactionTotals } from '@/src/features/transactions/hooks/transactions';
import { SortOption, useTransactionFilters } from '@/src/features/transactions/hooks/useTransactionFilters';
import { useTransactionSummary } from '@/src/features/transactions/hooks/useTransactionSummary';
import { FeatureTip } from '@/src/features/walkthrough';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { groupByDay } from '@/src/utils/transactions';

type DaySection = { key: string; title: string; data: TransactionListItem[] };

const tap = () => Haptics.selectionAsync().catch(() => {});
const keyExtractor = (item: TransactionListItem) => String(item.id);

const paramToNumber = (value: string | string[] | undefined): number | null => {
  const parsed = Number.parseInt((Array.isArray(value) ? value[0] : value) ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const TransactionsScreen = React.memo(function TransactionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { profile } = useSettings();

  const params = useLocalSearchParams<{ accountId?: string | string[]; categoryId?: string | string[] }>();
  const {
    filters,
    applyFilters,
    setSort,
    resetSort,
    clearFilter,
    resetFilters,
    basicFilters,
    activeFilterCount,
    isSortActive,
  } = useTransactionFilters({ accountId: paramToNumber(params.accountId), categoryId: paramToNumber(params.categoryId) });

  const txQuery = useInfiniteTransactions(basicFilters);
  // Every filter is applied in SQL, so these totals always cover exactly the filtered list.
  const { data: dbTotals } = useTransactionTotals(basicFilters);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();
  const deleteTransaction = useDeleteTransaction();

  const transactions = useMemo(() => txQuery.data?.pages.flat() ?? [], [txQuery.data?.pages]);
  const sections = useMemo(() => groupByDay(transactions), [transactions]);
  const summary = useTransactionSummary(dbTotals, profile.defaultCurrency);

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TransactionListItem | null>(null);

  const openFilters = useCallback(() => {
    tap();
    setShowFilterSheet(true);
  }, []);
  const openSort = useCallback(() => {
    tap();
    setShowSortDialog(true);
  }, []);
  const selectSort = useCallback(
    (sort: SortOption) => {
      tap();
      setSort(sort);
      setShowSortDialog(false);
    },
    [setSort],
  );
  const addTransaction = useCallback(() => {
    tap();
    router.push('/transactions/create');
  }, [router]);
  const openTransaction = useCallback((tx: TransactionListItem) => router.push(`/transactions/${tx.id}`), [router]);

  const loadMore = useCallback(() => {
    if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) void txQuery.fetchNextPage();
  }, [txQuery]);

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<TransactionListItem, DaySection>) => (
      <SwipeableTransactionRow
        tx={item}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        onEdit={openTransaction}
        onDelete={setPendingDelete}
      />
    ),
    [openTransaction],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<TransactionListItem, DaySection> }) => (
      <TransactionDayHeader title={section.title} items={section.data} />
    ),
    [],
  );

  const renderSectionFooter = useCallback(() => <View style={styles.sectionGap} />, [styles.sectionGap]);

  const header = {
    title: t('transactions.title'),
    showBack: true,
    rightAction: (
      <View style={styles.headerActions}>
        <IconButton
          icon="filter"
          onPress={openFilters}
          variant={activeFilterCount > 0 ? 'tonal' : 'surface'}
          badge={activeFilterCount}
          accessibilityLabel={t('filters.title')}
        />
        <IconButton
          icon="sorting-down"
          onPress={openSort}
          variant={isSortActive ? 'tonal' : 'surface'}
          accessibilityLabel={t('transactions.sortTitle')}
        />
      </View>
    ),
  };

  if (txQuery.isLoading) {
    return (
      <Screen header={{ title: t('transactions.title'), showBack: true }} variant="fixed">
        <SkeletonScreen />
      </Screen>
    );
  }

  const isFiltered = activeFilterCount > 0;

  return (
    <Screen header={header} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={12}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <TransactionSummaryCard
              income={summary.totals.income}
              expense={summary.totals.expense}
              currency={summary.currency}
              currencies={summary.currencies}
              onCurrencySelect={summary.setCurrency}
              label={isFiltered ? t('transactions.filteredSummary') : t('transactions.netSavings')}
            />
            <ActiveFilterChips
              filters={filters}
              activeFilterCount={activeFilterCount}
              isSortActive={isSortActive}
              accounts={accounts}
              categories={categories}
              persons={persons}
              onEditFilters={openFilters}
              onEditSort={openSort}
              onClearFilter={clearFilter}
              onResetSort={resetSort}
              onResetFilters={resetFilters}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-text"
            title={isFiltered ? t('transactions.noResults') : t('transactions.nothingYet')}
            description={isFiltered ? t('transactions.noMatch') : t('transactions.addFirst')}
            actionLabel={isFiltered ? t('transactions.clearFilters') : t('transactions.add')}
            onAction={isFiltered ? resetFilters : addTransaction}
          />
        }
        ListFooterComponent={
          txQuery.isFetchingNextPage ? (
            <View style={styles.loadMore}>
              <Spinner size="sm" />
            </View>
          ) : null
        }
      />

      <ConfirmDialog
        destructive
        visible={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('transactions.deleteTitle')}
        message={t('transactions.deleteMessage')}
        confirmLabel={t('transactions.delete')}
        onConfirm={() => {
          if (pendingDelete) deleteTransaction.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
      <AdvancedFilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        onApply={applyFilters}
        onReset={resetFilters}
        accounts={accounts}
        categories={categories}
        persons={persons}
      />
      <TransactionSortDialog visible={showSortDialog} sort={filters} onSelect={selectSort} onClose={() => setShowSortDialog(false)} />

      <Fab onPress={addTransaction} accessibilityLabel={t('transactions.add')} />
      <FeatureTip tip="swipeActions" enabled={sections.length > 0} />
    </Screen>
  );
});

const createStyles = ({ spacing, layout, tabBarClearance }: ThemeContextType, insets: EdgeInsets) =>
  StyleSheet.create({
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: tabBarClearance(insets.bottom),
    },
    listHeader: {
      gap: spacing('4'),
      marginBottom: spacing('6'),
    },
    sectionGap: {
      height: spacing('6'),
    },
    loadMore: {
      paddingVertical: spacing('7'),
      alignItems: 'center',
    },
  });
