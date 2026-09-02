import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { TRANSACTIONS_LIST_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { ArrowRight01Icon, CancelCircleIcon, Delete01Icon, FilterIcon, PencilEdit01Icon, PlusSignIcon, ReceiptTextIcon, SortingDownIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EdgeInsets, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { sortCurrenciesWithDefault } from '../../../constants/currency';
import { StorageKeys } from '../../../constants/keys';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { AdvancedFilterService, AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../../filters/api/advanced-filters.service';
import { AdvancedFilterBottomSheet } from '../../filters/components/AdvancedFilterBottomSheet';
import { usePersons } from '../../persons/hooks/persons';
import type { TransactionListItem } from '../api/transactions';
import { TransactionSummaryCard } from '../components/TransactionSummaryCard';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransactionTotals,
} from '../hooks/transactions';

import { format } from 'date-fns';

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
  icon: IconSvgElement;
  color: string;
  backgroundColor: string;
}) {
  return (
    <BentoPressable
      onPress={onPress}
      style={[swipeActionStyles.actionBase, { backgroundColor }]}
    >
      <HugeiconsIcon icon={icon} size={18} color={color} />
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
    editBg: colors.primary + '1A',
    editIcon: colors.primary,
    deleteBg: colors.danger + '1A',
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
  icon?: IconSvgElement;
  onPress: () => void;
  onClear?: () => void;
  isClearAll?: boolean;
}

const FilterChip = React.memo(function FilterChip({
  label,
  icon,
  onPress,
  onClear,
  isClearAll = false,
}: FilterChipProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isClearAll) {
    return (
      <BentoPressable onPress={onPress} style={styles.clearAllChip} scaleOnPress={false}>
        <HugeiconsIcon icon={CancelCircleIcon} size={12} color={colors.textMuted} />
        <Text style={styles.clearAllText}>{label}</Text>
      </BentoPressable>
    );
  }

  return (
    <View style={styles.chip}>
      <BentoPressable
        onPress={onPress}
        style={[styles.chipButton, { paddingLeft: spacing('2.5'), paddingRight: onClear ? spacing('1') : spacing('2.5') }]}
        scaleOnPress={false}
      >
        {icon && (
          <HugeiconsIcon icon={icon} size={12} color={colors.primary} style={{ marginRight: spacing('1') }} />
        )}
        <Text style={styles.chipText}>{label}</Text>
      </BentoPressable>
      {onClear && (
        <BentoPressable
          onPress={onClear}
          style={styles.chipCloseBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          scaleOnPress={false}
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={13} color={colors.primary} />
        </BentoPressable>
      )}
    </View>
  );
});


export const TransactionsScreen = React.memo(function TransactionsScreen() {
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
    () => activeFilterCount > 0 ? 'Filtered summary' : 'Net savings',
    [activeFilterCount],
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
    if (types.length === 0) return 'Type';
    if (types.length === 1) {
      return types[0] === 'CR' ? 'Income' : types[0] === 'DR' ? 'Expense' : 'Transfer';
    }
    return `${types.length} types`;
  }, [advancedFilters.types]);

  const accountLabel = useMemo(() => {
    const ids = advancedFilters.accountIds ?? [];
    if (ids.length === 0) return 'Account';
    if (ids.length === 1) {
      const acc = accountsQuery.data?.find(a => a.id === ids[0]);
      return acc ? acc.name : '1 account';
    }
    return `${ids.length} accounts`;
  }, [advancedFilters.accountIds, accountsQuery.data]);

  const categoryLabel = useMemo(() => {
    const ids = advancedFilters.categoryIds ?? [];
    if (ids.length === 0) return 'Category';
    if (ids.length === 1) {
      const cat = categoriesQuery.data?.find(c => c.id === ids[0]);
      return cat ? cat.name : '1 category';
    }
    return `${ids.length} categories`;
  }, [advancedFilters.categoryIds, categoriesQuery.data]);

  const dateLabel = useMemo(() => {
    if (!advancedFilters.dateRange) return 'Date';
    const start = format(new Date(advancedFilters.dateRange.startDate), 'MMM d');
    const end = format(new Date(advancedFilters.dateRange.endDate), 'MMM d');
    return `${start} - ${end}`;
  }, [advancedFilters.dateRange]);

  const amountLabel = useMemo(() => {
    if (!advancedFilters.amountRange) return 'Amount';
    const { min, max } = advancedFilters.amountRange;
    if (min !== undefined && max !== undefined) return `${min} – ${max}`;
    if (min !== undefined) return `≥${min}`;
    if (max !== undefined) return `≤${max}`;
    return 'Amount';
  }, [advancedFilters.amountRange]);

  const personLabel = useMemo(() => {
    const ids = advancedFilters.personIds ?? [];
    if (ids.length === 0) return 'Person';
    if (ids.length === 1) {
      const person = personsQuery.data?.find(p => p.id === ids[0]);
      return person ? person.name.split(' ')[0] : '1 person';
    }
    return `${ids.length} persons`;
  }, [advancedFilters.personIds, personsQuery.data]);

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
          <Text style={styles.dayTitle}>{title}</Text>
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
              <Text style={styles.dayTotalCount}>{data.length} txns</Text>
            )}
          </View>
        </View>
      );
    },
    [styles]);


  const renderSectionFooter = React.useCallback(() => <View style={{ height: 24 }} />, []);

  if (txQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <Header
        title="Transactions"
        showBack
        rightAction={(
          <View style={styles.headerActions}>
            <BentoPressable onPress={handleOpenFilter} style={[styles.iconBtn, activeFilterCount > 0 && styles.iconBtnActive]}>
              <HugeiconsIcon icon={FilterIcon} size={22} color={activeFilterCount > 0 ? colors.primary : colors.text} />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.primaryForeground }]}>{activeFilterCount}</Text>
                </View>
              )}
            </BentoPressable>
            <BentoPressable onPress={handleOpenSort} style={[styles.iconBtn, isSortActive && styles.iconBtnActive]}>
              <HugeiconsIcon icon={SortingDownIcon} size={22} color={isSortActive ? colors.primary : colors.text} />
            </BentoPressable>
          </View>
        )}
      />

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
                      label="Clear all"
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
              <HugeiconsIcon icon={ReceiptTextIcon} size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilterCount > 0 ? 'No results' : 'Nothing here yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0
                ? 'No transactions match the active filters. Try adjusting or clearing them.'
                : 'Add your first transaction to start tracking.'}
            </Text>
            {activeFilterCount > 0 ? (
              <BentoPressable style={[styles.emptyAction, { backgroundColor: colors.surface }]} onPress={handleResetFilters}>
                <Text style={[styles.emptyActionText, { color: colors.text }]}>Clear filters</Text>
              </BentoPressable>
            ) : (
              <BentoPressable style={styles.emptyAction} onPress={handleAddTransaction}>
                <Text style={styles.emptyActionText}>Add Transaction</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primaryForeground} />
              </BentoPressable>
            )}
          </View>
        )}
        ListFooterComponent={txQuery.isFetchingNextPage ? (
          <View style={styles.loadMoreWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      />



      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Transaction"
        message="This will remove the transaction and reverse its account balance impact."
        confirmLabel="Delete"
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
        title="Sort transactions"
        options={[
          {
            key: 'newest',
            label: 'Newest first',
            selected: advancedFilters.sortBy === 'date' && advancedFilters.sortOrder === 'desc',
            onPress: () => handleSortSelect('date', 'desc'),
          },
          {
            key: 'oldest',
            label: 'Oldest first',
            selected: advancedFilters.sortBy === 'date' && advancedFilters.sortOrder === 'asc',
            onPress: () => handleSortSelect('date', 'asc'),
          },
          {
            key: 'highest',
            label: 'Highest amount',
            selected: advancedFilters.sortBy === 'amount' && advancedFilters.sortOrder === 'desc',
            onPress: () => handleSortSelect('amount', 'desc'),
          },
          {
            key: 'lowest',
            label: 'Lowest amount',
            selected: advancedFilters.sortBy === 'amount' && advancedFilters.sortOrder === 'asc',
            onPress: () => handleSortSelect('amount', 'asc'),
          },
        ]}
      />
      <BentoPressable style={styles.fab} onPress={handleAddTransaction}>
        <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>

      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_TRANSACTIONS} steps={TRANSACTIONS_LIST_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const ZERO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };
const createStyles = ({ colors, typography, spacing, radius, layout, shadow, isDark }: ThemeContextType, insets: EdgeInsets = ZERO_INSETS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    iconBtn: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    iconBtnActive: {
      backgroundColor: colors.primary + '14',
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 15,
      height: 15,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    filterBadgeText: {
      fontSize: 9,
      fontFamily: typography.styles.badge.fontFamily,
      lineHeight: 12,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: insets.bottom > 0 ? insets.bottom + 90 : 100,
    },
    listHeader: {
      gap: spacing('5'),
      marginBottom: spacing('6'),
    },
    daySection: { gap: spacing('3') },
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
      fontSize: typography.sizes.xs,
    },
    dayTotals: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    dayTotalValue: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
    },
    dayTotalCount: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
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
      borderRadius: radius('2xl'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      color: colors.text,
      fontSize: 18,
    },
    emptySubtitle: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 240,
      lineHeight: 20,
    },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      paddingHorizontal: layout.screenPadding,
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      marginTop: spacing('2'),
    },
    emptyActionText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      color: colors.primaryForeground,
      fontSize: 15,
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
      borderRadius: radius('xl'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow('md'),
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
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius('full'),
      height: 30,
      backgroundColor: colors.primary + '1A',
      overflow: 'hidden',
    },
    chipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      height: '100%',
    },
    chipCloseBtn: {
      paddingRight: spacing('2.5'),
      paddingLeft: spacing('1'),
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipText: {
      fontFamily: typography.fonts.medium,
      fontSize: 11.5,
      color: colors.primary,
    },
    clearAllChip: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 30,
      paddingHorizontal: spacing('2.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      gap: spacing('1'),
      overflow: 'hidden',
    },
    clearAllText: {
      fontFamily: typography.fonts.medium,
      fontSize: 11.5,
      color: colors.textMuted,
    },
  });
