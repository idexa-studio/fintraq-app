import { Chip } from '@/src/components/ui/Chip';
import { XIcon } from '@/src/components/ui/icons';
import { IconButton } from '@/src/components/ui/IconButton';
import { Text } from '@/src/components/ui/Text';
import { Spinner, Screen, SkeletonScreen } from '@/src/components/ui';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Icon } from '@/src/components/ui/Icon';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { TRANSACTIONS_LIST_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { ArrowRight01Icon, Delete01Icon, FilterIcon, PencilEdit01Icon, PlusSignIcon, ReceiptTextIcon, SortingDownIcon } from '@hugeicons/core-free-icons';
import type { IconSource } from '@/src/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { sortCurrenciesWithDefault } from '@/src/constants/currency';
import { StorageKeys } from '@/src/constants/keys';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCategories } from '@/src/features/categories/hooks/categories';
import { AdvancedFilterService, AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '@/src/features/filters/api/advanced-filters.service';
import { AdvancedFilterBottomSheet } from '@/src/features/filters/components/AdvancedFilterBottomSheet';
import { usePersons } from '@/src/features/persons/hooks/persons';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { TransactionSummaryCard } from '@/src/features/transactions/components/TransactionSummaryCard';
import { useDeleteTransaction, useInfiniteTransactions, useTransactionTotals } from '@/src/features/transactions/hooks/transactions';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

const SWIPE_ACTION_WIDTH = 44;
type SwipeableInstance = React.ComponentRef<typeof Swipeable>;
let openSwipeRow: SwipeableInstance | null = null;

// Pre-computed styles for swipe actions to avoid recreating on every render
const swipeActionStyles = {
  container: {
    flexDirection: 'row' as const,
    width: SWIPE_ACTION_WIDTH * 2,
    alignItems: 'stretch' as const,
    justifyContent: 'flex-end' as const,
  },
  actionBase: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

const resolveParamNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDateLabel = (iso: string) => {
  return format(new Date(iso), 'EEE, d MMM');
};


// ─── Optimized Swipeable row ───────────────────────────────────────────────────────────
// Separate component for action buttons to prevent unnecessary re-renders
const SwipeActionButton = React.memo(function SwipeActionButton({
  onPress,
  icon,
  color,
  backgroundColor,
}: {
  onPress: () => void;
  icon: IconSource;
  color: string;
  backgroundColor: string;
}) {
  return (
    <BentoPressable
      onPress={onPress}
      style={[swipeActionStyles.actionBase, { backgroundColor }]}
    >
      <Icon icon={icon} size={18} color={color} />
    </BentoPressable>
  );
});

// Pre-computed action render to avoid inline function creation
const RightActions = React.memo(function RightActions({
  onEdit,
  onDelete,
  editBgColor,
  editIconColor,
  deleteBgColor,
  deleteIconColor,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editBgColor: string;
  editIconColor: string;
  deleteBgColor: string;
  deleteIconColor: string;
}) {
  return (
    <View style={swipeActionStyles.container}>
      <SwipeActionButton
        onPress={onEdit}
        icon={PencilEdit01Icon}
        color={editIconColor}
        backgroundColor={editBgColor}
      />
      <SwipeActionButton
        onPress={onDelete}
        icon={Delete01Icon}
        color={deleteIconColor}
        backgroundColor={deleteBgColor}
      />
    </View>
  );
});

const SwipeableRow = React.memo(function SwipeableRow({
  tx,
  isFirst,
  isLast,
  onEdit,
  onDelete,
}: {
  tx: TransactionListItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (tx: TransactionListItem) => void;
  onDelete: (tx: TransactionListItem) => void;
}) {
  const { colors } = useTheme(); // Get colors from context to prevent prop-drilling re-renders
  const swipeRef = React.useRef<SwipeableInstance>(null);

  // Use refs to avoid dependency issues while maintaining stable callbacks
  const txRef = React.useRef(tx);
  React.useEffect(() => {
    txRef.current = tx;
  }, [tx]);

  const handleEdit = React.useCallback(() => {
    swipeRef.current?.close();
    onEdit(txRef.current);
  }, [onEdit]); // Stable reference, uses ref for current tx

  const handleDelete = React.useCallback(() => {
    swipeRef.current?.close();
    onDelete(txRef.current);
  }, [onDelete]);

  // Memoize action colors to prevent re-renders of RightActions
  const actionColors = React.useMemo(() => ({
    editBg: alpha(colors.primary, 'subtle'),
    editIcon: colors.primary,
    deleteBg: alpha(colors.danger, 'subtle'),
    deleteIcon: colors.danger,
  }), [colors.primary, colors.danger]);

  // Use stable render function reference
  const renderRightActions = React.useCallback(
    () => (
      <RightActions
        onEdit={handleEdit}
        onDelete={handleDelete}
        editBgColor={actionColors.editBg}
        editIconColor={actionColors.editIcon}
        deleteBgColor={actionColors.deleteBg}
        deleteIconColor={actionColors.deleteIcon}
      />
    ),
    [handleEdit, handleDelete, actionColors],
  );

  // Stable swipe event handlers
  const onSwipeableWillOpen = React.useCallback(() => {
    if (openSwipeRow && openSwipeRow !== swipeRef.current) {
      openSwipeRow.close();
    }
    openSwipeRow = swipeRef.current;
  }, []);

  const onSwipeableClose = React.useCallback(() => {
    if (openSwipeRow === swipeRef.current) {
      openSwipeRow = null;
    }
  }, []);

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={30}
      friction={1.8}
      overshootRight={false}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableClose={onSwipeableClose}

    >
      <TransactionRow
        tx={tx}
        isFirst={isFirst}
        isLast={isLast}
        onPress={handleEdit}
      />
    </Swipeable>
  );
});

interface FilterChipProps {
  label: string;
  icon?: IconSource;
  onPress: () => void;
  onClear?: () => void;
  isClearAll?: boolean;
}

/** Active-filter chip: tap to edit, ✕ to clear. The "clear all" variant stays neutral. */
const FilterChip = React.memo(function FilterChip({
  label,
  icon,
  onPress,
  onClear,
  isClearAll = false,
}: FilterChipProps) {
  return isClearAll
    ? <Chip label={label} icon={XIcon} onPress={onPress} />
    : <Chip label={label} icon={icon} isActive onPress={onPress} onClear={onClear} />;
});


export const TransactionsScreen = React.memo(function TransactionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string | string[]; categoryId?: string | string[] }>();
  const initialAccountId = React.useMemo(() => resolveParamNumber(params.accountId), [params.accountId]);
  const initialCategoryId = React.useMemo(() => resolveParamNumber(params.categoryId), [params.categoryId]);

  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { profile } = useSettings();

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(() => {
    const initial: AdvancedFilters = { ...DEFAULT_ADVANCED_FILTERS };
    if (initialAccountId !== null) {
      initial.accountIds = [initialAccountId];
    }
    if (initialCategoryId !== null) {
      initial.categoryIds = [initialCategoryId];
    }
    return initial;
  });

  const [showAdvancedFilterSheet, setShowAdvancedFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<TransactionListItem | null>(null);

  const handleSortSelect = useCallback((sortBy: 'date' | 'amount', sortOrder: 'asc' | 'desc') => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, sortBy, sortOrder }));
    setShowSortSheet(false);
  }, []);

  // Convert advanced filters to basic API filters — sort is always passed to the DB
  const basicFilters = useMemo(() => {
    return AdvancedFilterService.toBasicFilters(advancedFilters);
  }, [advancedFilters]);

  // Memoized so both `enabled` and the `transactions` filter read the same stable boolean.
  const needsClientSide = useMemo(
    () => AdvancedFilterService.requiresClientSideFiltering(advancedFilters),
    [advancedFilters],
  );

  // Fetch transactions
  const txQuery = useInfiniteTransactions(basicFilters);
  // DB aggregate for KPI — always accurate regardless of scroll position.
  // Disabled when client-side multi-select is active; computed from loaded pages then.
  const { data: dbTotals } = useTransactionTotals(basicFilters, !needsClientSide);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const personsQuery = usePersons();
  const deleteTransaction = useDeleteTransaction();

  // Apply client-side filtering ONLY for advanced features the DB can't do.
  // NEVER sort here — sorting is done server-side in the DB query.
  // We only flat-map pages because pagination accumulates them; the JS filter
  // runs on the already-paginated slice, not on the entire 500+ item history.
  const transactions = useMemo(() => {
    const allTransactions = txQuery.data?.pages.flat() ?? [];

    if (!needsClientSide) return allTransactions;

    return allTransactions.filter((transaction) => {
      // Multi-select type filter
      if (advancedFilters.types && advancedFilters.types.length > 0) {
        if (!advancedFilters.types.includes(transaction.type)) {
          return false;
        }
      }

      // Multi-select account filter
      if (advancedFilters.accountIds && advancedFilters.accountIds.length > 0) {
        if (!advancedFilters.accountIds.includes(transaction.accountId)) {
          return false;
        }
      }

      // Multi-select category filter
      if (advancedFilters.categoryIds && advancedFilters.categoryIds.length > 0) {
        if (!advancedFilters.categoryIds.includes(transaction.categoryId)) {
          return false;
        }
      }

      // Multi-select person filter
      if (advancedFilters.personIds && advancedFilters.personIds.length > 0) {
        if (!transaction.personId || !advancedFilters.personIds.includes(transaction.personId)) {
          return false;
        }
      }

      // Search in notes/category/account
      if (advancedFilters.searchQuery?.trim()) {
        const query = advancedFilters.searchQuery.toLowerCase().trim();
        const noteMatch = transaction.note.toLowerCase().includes(query);
        const categoryMatch = transaction.category.name.toLowerCase().includes(query);
        const accountMatch = transaction.account.name.toLowerCase().includes(query);

        if (!noteMatch && !categoryMatch && !accountMatch) {
          return false;
        }
      }

      return true;
      // NOTE: No .sort() here — sorting is done by the DB ORDER BY clause.
    });
  }, [txQuery.data?.pages, advancedFilters, needsClientSide]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    transactions.forEach((item) => {
      const key = getDateLabel(item.datetime);
      const prev = map.get(key) ?? [];
      prev.push(item);
      map.set(key, prev);
    });
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  const loadMore = useCallback(() => {
    if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
      txQuery.fetchNextPage();
    }
  }, [txQuery]);

  // DB aggregate when filters map 1:1 to SQL (no client-side multi-select).
  // Falls back to summing loaded pages when client-side filtering is active.
  const kpiTotalsByCurrency = useMemo(() => {
    if (!needsClientSide && dbTotals) return dbTotals;
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx) => {
      const currency = tx.account.currency;
      if (!map[currency]) map[currency] = { income: 0, expense: 0 };
      if (tx.type === 'CR') map[currency].income += tx.amount;
      else if (tx.type === 'DR') map[currency].expense += tx.amount;
    });
    return map;
  }, [needsClientSide, dbTotals, transactions]);

  const kpiCurrencies = useMemo(
    () => sortCurrenciesWithDefault(Object.keys(kpiTotalsByCurrency), profile.defaultCurrency),
    [kpiTotalsByCurrency, profile.defaultCurrency],
  );

  const [selectedKpiCurrency, setSelectedKpiCurrency] = useState<string | null>(null);
  useEffect(() => {
    if (kpiCurrencies.length === 0) setSelectedKpiCurrency(null);
    else if (!selectedKpiCurrency || !kpiCurrencies.includes(selectedKpiCurrency))
      setSelectedKpiCurrency(kpiCurrencies[0]);
  }, [kpiCurrencies, selectedKpiCurrency]);

  const activeTotals = selectedKpiCurrency
    ? (kpiTotalsByCurrency[selectedKpiCurrency] ?? { income: 0, expense: 0 })
    : { income: 0, expense: 0 };

  const activeFilterCount = AdvancedFilterService.countActiveFilters(advancedFilters);
  const summaryLabel = useMemo(
    () => activeFilterCount > 0 ? t('transactions.filteredSummary') : t('transactions.netSavings'),
    [activeFilterCount, t],
  );

  const isSortActive = useMemo(() => {
    return advancedFilters.sortBy !== 'date' || advancedFilters.sortOrder !== 'desc';
  }, [advancedFilters.sortBy, advancedFilters.sortOrder]);

  const activeTypesCount = useMemo(() => advancedFilters.types?.length ?? 0, [advancedFilters.types]);
  const activeAccountsCount = useMemo(() => advancedFilters.accountIds?.length ?? 0, [advancedFilters.accountIds]);
  const activeCategoriesCount = useMemo(() => advancedFilters.categoryIds?.length ?? 0, [advancedFilters.categoryIds]);
  const activePersonsCount = useMemo(() => advancedFilters.personIds?.length ?? 0, [advancedFilters.personIds]);
  const isDateActive = useMemo(() => !!advancedFilters.dateRange, [advancedFilters.dateRange]);
  const isAmountActive = useMemo(() => !!advancedFilters.amountRange, [advancedFilters.amountRange]);

  const sortLabel = useMemo(() => {
    if (advancedFilters.sortBy === 'date') {
      return advancedFilters.sortOrder === 'desc' ? 'Sort' : 'Oldest first';
    } else {
      return advancedFilters.sortOrder === 'desc' ? 'Highest amount' : 'Lowest amount';
    }
  }, [advancedFilters.sortBy, advancedFilters.sortOrder]);

  const typeLabel = useMemo(() => {
    const types = advancedFilters.types ?? [];
    if (types.length === 0) return t('transactions.type');
    if (types.length === 1) {
      return types[0] === 'CR' ? t('transactions.income') : types[0] === 'DR' ? t('transactions.expense') : t('transactions.transfer');
    }
    return t('transactions.typesCount', { count: types.length });
  }, [advancedFilters.types, t]);

  const accountLabel = useMemo(() => {
    const ids = advancedFilters.accountIds ?? [];
    if (ids.length === 0) return t('transactions.account');
    if (ids.length === 1) {
      const acc = accountsQuery.data?.find(a => a.id === ids[0]);
      return acc ? acc.name : t('transactions.oneAccount');
    }
    return t('transactions.accountsCount', { count: ids.length });
  }, [advancedFilters.accountIds, accountsQuery.data, t]);

  const categoryLabel = useMemo(() => {
    const ids = advancedFilters.categoryIds ?? [];
    if (ids.length === 0) return t('transactions.category');
    if (ids.length === 1) {
      const cat = categoriesQuery.data?.find(c => c.id === ids[0]);
      return cat ? cat.name : t('transactions.oneCategory');
    }
    return t('transactions.categoriesCount', { count: ids.length });
  }, [advancedFilters.categoryIds, categoriesQuery.data, t]);

  const dateLabel = useMemo(() => {
    if (!advancedFilters.dateRange) return t('transactions.date');
    const start = format(new Date(advancedFilters.dateRange.startDate), 'MMM d');
    const end = format(new Date(advancedFilters.dateRange.endDate), 'MMM d');
    return `${start} - ${end}`;
  }, [advancedFilters.dateRange, t]);

  const amountLabel = useMemo(() => {
    if (!advancedFilters.amountRange) return t('transactions.amount');
    const { min, max } = advancedFilters.amountRange;
    if (min !== undefined && max !== undefined) return `${min} – ${max}`;
    if (min !== undefined) return `≥${min}`;
    if (max !== undefined) return `≤${max}`;
    return t('transactions.amount');
  }, [advancedFilters.amountRange, t]);

  const personLabel = useMemo(() => {
    const ids = advancedFilters.personIds ?? [];
    if (ids.length === 0) return t('transactions.person');
    if (ids.length === 1) {
      const person = personsQuery.data?.find(p => p.id === ids[0]);
      return person ? person.name.split(' ')[0] : t('transactions.onePerson');
    }
    return t('transactions.personsCount', { count: ids.length });
  }, [advancedFilters.personIds, personsQuery.data, t]);

  const handleOpenSort = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setShowSortSheet(true);
  }, []);

  const handleOpenFilter = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setShowAdvancedFilterSheet(true);
  }, []);

  const clearTypes = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, types: undefined }));
  }, []);

  const clearAccounts = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, accountIds: undefined }));
  }, []);

  const clearCategories = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, categoryIds: undefined }));
  }, []);

  const clearDateRange = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, dateRange: undefined }));
  }, []);

  const clearAmountRange = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, amountRange: undefined }));
  }, []);

  const clearPersons = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, personIds: undefined }));
  }, []);

  const handleResetSort = useCallback((e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, sortBy: 'date', sortOrder: 'desc' }));
  }, []);

  const handleApplyFilters = useCallback((filters: AdvancedFilters) => {
    setAdvancedFilters(filters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(prev => ({
      ...DEFAULT_ADVANCED_FILTERS,
      sortBy: prev.sortBy,
      sortOrder: prev.sortOrder,
    }));
  }, []);

  const handleAddTransaction = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    router.push('/transactions/create');
  }, [router]);

  const handleEdit = React.useCallback(
    (tx: TransactionListItem) => {
      router.push(`/transactions/${tx.id}`);
    },
    [router],
  );

  const handleDelete = React.useCallback(
    (tx: TransactionListItem) => {
      setPendingDeleteTx(tx);
      setShowDeleteDialog(true);
    },
    [],
  );

  type TxSection = { title: string; data: TransactionListItem[] };

  const renderItem = React.useCallback(
    ({ item: tx, index, section }: SectionListRenderItemInfo<TransactionListItem, TxSection>) => (
      <SwipeableRow
        tx={tx}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDelete],
  );

  // Stable key extractor - prevents unnecessary re-renders
  const keyExtractor = React.useCallback((item: TransactionListItem) =>
    item.id.toString(), []
  );

  const renderSectionHeader = React.useCallback(
    ({ section: { title, data } }: { section: SectionListData<TransactionListItem, TxSection> }) => {
      // Group totals by currency — multi-currency days show count instead of ambiguous sum
      const byCurrency: Record<string, { income: number; expense: number }> = {};
      data.forEach(tx => {
        const cur = tx.account.currency;
        if (!byCurrency[cur]) byCurrency[cur] = { income: 0, expense: 0 };
        if (tx.type === 'CR') byCurrency[cur].income += tx.amount;
        else if (tx.type === 'DR') byCurrency[cur].expense += tx.amount;
      });
      const dayCurrencies = Object.keys(byCurrency);
      const isSingleCurrency = dayCurrencies.length === 1;
      const singleCur = dayCurrencies[0];

      return (
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.dayTotals}>
            {isSingleCurrency ? (
              <>
                {byCurrency[singleCur].income > 0 && (
                  <MoneyText amount={byCurrency[singleCur].income} currency={singleCur} type="CR" style={styles.dayTotalValue} />
                )}
                {byCurrency[singleCur].expense > 0 && (
                  <MoneyText amount={byCurrency[singleCur].expense} currency={singleCur} type="DR" style={styles.dayTotalValue} />
                )}
              </>
            ) : (
              <Text style={styles.dayTotalCount}>{t('transactions.dayCount', { count: data.length })}</Text>
            )}
          </View>
        </View>
      );
    },
    [styles, t]);


  const renderSectionFooter = React.useCallback(() => <View style={{ height: 24 }} />, []);

  if (txQuery.isLoading) {
    return (
      <Screen header={{ title: t('transactions.title'), showBack: true }} variant="fixed">
        <SkeletonScreen />
      </Screen>
    );
  }

  return (
    <Screen header={{ title: t('transactions.title'), showBack: true, rightAction: (
          <View style={styles.headerActions}>
            <IconButton
              icon={FilterIcon}
              onPress={handleOpenFilter}
              variant={activeFilterCount > 0 ? 'tonal' : 'surface'}
              badge={activeFilterCount}
              accessibilityLabel={t('filters.title')}
            />
            <IconButton
              icon={SortingDownIcon}
              onPress={handleOpenSort}
              variant={isSortActive ? 'tonal' : 'surface'}
              accessibilityLabel={t('transactions.sortTitle')}
            />
          </View>
        ) }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>


      <SectionList
        sections={groupedByDate}
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
        removeClippedSubviews={true}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <TransactionSummaryCard
              income={activeTotals.income}
              expense={activeTotals.expense}
              currency={selectedKpiCurrency}
              currencies={kpiCurrencies}
              onCurrencySelect={setSelectedKpiCurrency}
              label={summaryLabel}
            />

            {/* ── Active filter + sort chips ── */}
            {(activeFilterCount > 0 || isSortActive) && (
              <View style={styles.chipsScrollContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {activeFilterCount > 0 && (
                    <FilterChip
                      label={t('transactions.clearAll')}
                      onPress={handleResetFilters}
                      isClearAll
                    />
                  )}
                  {isSortActive && (
                    <FilterChip
                      label={sortLabel}
                      icon={SortingDownIcon}
                      onPress={handleOpenSort}
                      onClear={handleResetSort}
                    />
                  )}
                  {activeTypesCount > 0 && (
                    <FilterChip
                      label={typeLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearTypes}
                    />
                  )}
                  {activeAccountsCount > 0 && (
                    <FilterChip
                      label={accountLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearAccounts}
                    />
                  )}
                  {activeCategoriesCount > 0 && (
                    <FilterChip
                      label={categoryLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearCategories}
                    />
                  )}
                  {activePersonsCount > 0 && (
                    <FilterChip
                      label={personLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearPersons}
                    />
                  )}
                  {isDateActive && (
                    <FilterChip
                      label={dateLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearDateRange}
                    />
                  )}
                  {isAmountActive && (
                    <FilterChip
                      label={amountLabel}
                      icon={FilterIcon}
                      onPress={handleOpenFilter}
                      onClear={clearAmountRange}
                    />
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBox}>
              <Icon icon={ReceiptTextIcon} size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilterCount > 0 ? t('transactions.noResults') : t('transactions.nothingYet')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0
                ? t('transactions.noMatch')
                : t('transactions.addFirst')}
            </Text>
            {activeFilterCount > 0 ? (
              <BentoPressable style={[styles.emptyAction, { backgroundColor: colors.surface }]} onPress={handleResetFilters}>
                <Text style={[styles.emptyActionText, { color: colors.text }]}>{t('transactions.clearFilters')}</Text>
              </BentoPressable>
            ) : (
              <BentoPressable style={styles.emptyAction} onPress={handleAddTransaction}>
                <Text style={styles.emptyActionText}>{t('transactions.add')}</Text>
                <Icon icon={ArrowRight01Icon} size={14} color={colors.primaryForeground} />
              </BentoPressable>
            )}
          </View>
        )}
        ListFooterComponent={txQuery.isFetchingNextPage ? (
          <View style={styles.loadMoreWrap}>
            <Spinner size="sm" />
          </View>
        ) : null}
      />



      <ConfirmDialog
        destructive
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title={t('transactions.deleteTitle')}
        message={t('transactions.deleteMessage')}
        confirmLabel={t('transactions.delete')}
        onConfirm={() => {
          if (!pendingDeleteTx) return;
          deleteTransaction.mutate(pendingDeleteTx.id);
          setPendingDeleteTx(null);
        }}
      />

      <AdvancedFilterBottomSheet
        visible={showAdvancedFilterSheet}
        onClose={() => setShowAdvancedFilterSheet(false)}
        filters={advancedFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        persons={personsQuery.data ?? []}
      />

      <OptionsDialog
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title={t('transactions.sortTitle')}
        options={[
          {
            key: 'newest',
            label: t('transactions.newest'),
            selected: advancedFilters.sortBy === 'date' && advancedFilters.sortOrder === 'desc',
            onPress: () => handleSortSelect('date', 'desc'),
          },
          {
            key: 'oldest',
            label: t('transactions.oldest'),
            selected: advancedFilters.sortBy === 'date' && advancedFilters.sortOrder === 'asc',
            onPress: () => handleSortSelect('date', 'asc'),
          },
          {
            key: 'highest',
            label: t('transactions.highest'),
            selected: advancedFilters.sortBy === 'amount' && advancedFilters.sortOrder === 'desc',
            onPress: () => handleSortSelect('amount', 'desc'),
          },
          {
            key: 'lowest',
            label: t('transactions.lowest'),
            selected: advancedFilters.sortBy === 'amount' && advancedFilters.sortOrder === 'asc',
            onPress: () => handleSortSelect('amount', 'asc'),
          },
        ]}
      />
      <BentoPressable style={styles.fab} onPress={handleAddTransaction}>
        <Icon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>

      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_TRANSACTIONS} steps={TRANSACTIONS_LIST_WALKTHROUGH_STEPS} />
    </Screen>
  );
});

const ZERO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };
const createStyles = ({ colors, typography, spacing, radius, layout, shadow, isDark, tabBarClearance }: ThemeContextType, insets: EdgeInsets = ZERO_INSETS) =>
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
      gap: spacing('5'),
      marginBottom: spacing('6'),
    },
    dayHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('1'),
      marginBottom: spacing('3'),
    },
    dayTitle: {
      color: colors.textMuted,
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
    },
    // Date never wraps; totals shrink first.
    dayTotals: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing('3'),
      marginLeft: spacing('3'),
    },
    dayTotalValue: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
    },
    dayTotalCount: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    emptyWrap: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: spacing('4'),
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      color: colors.text,
      ...typography.metrics.xl,
    },
    emptySubtitle: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      ...typography.metrics.md,
      textAlign: 'center',
      maxWidth: 240,
    },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      paddingHorizontal: layout.screenPadding,
      height: 48,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      marginTop: spacing('2'),
    },
    emptyActionText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      color: colors.primaryForeground,
      ...typography.metrics.md,
    },
    loadMoreWrap: {
      paddingVertical: spacing('7'),
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
      right: layout.screenPadding,
      width: 56,
      height: 56,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipsScrollContainer: {
      marginTop: spacing('2'),
      marginBottom: spacing('1'),
    },
    chipsScroll: {
      gap: spacing('1.5'),
      // paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('1'),
    },
  });
