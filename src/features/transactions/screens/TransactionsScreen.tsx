import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { OptionsBottomSheet } from '@/src/components/ui/OptionsBottomSheet';
import { TRANSACTIONS_LIST_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { StorageKeys } from '../../../constants/keys';
import { ArrowRight01Icon, CancelCircleIcon, Delete01Icon, FilterIcon, PencilEdit01Icon, PlusSignIcon, ReceiptTextIcon, SortingDownIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { KPICard } from '../../../components/ui/KPICard';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { AdvancedFilterService, AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../../filters/api/advanced-filters.service';
import { AdvancedFilterBottomSheet } from '../../filters/components/AdvancedFilterBottomSheet';
import { usePersons } from '../../persons/hooks/persons';
import type { TransactionListItem } from '../api/transactions';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
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
  isActive: boolean;
  onPress: () => void;
  onClear?: () => void;
  showChevron?: boolean;
}

const FilterChip = React.memo(function FilterChip({
  label,
  isActive,
  onPress,
  onClear,
  showChevron = true,
}: FilterChipProps) {
  const theme = useTheme();
  const { colors, spacing, isDark } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const tintColor = isDark ? colors.primaryLight : colors.primaryDark;

  return (
    <View style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}>
      <BentoPressable
        onPress={onPress}
        style={[
          styles.chipButton,
          isActive ? { paddingLeft: spacing('2.5'), paddingRight: spacing('1') } : { paddingHorizontal: spacing('3') }
        ]}
        scaleOnPress={false}
      >
        {isActive && (
          <HugeiconsIcon icon={FilterIcon} size={13} color={tintColor} style={{ marginRight: spacing('1') }} />
        )}
        <Text style={isActive ? styles.chipTextActive : styles.chipTextInactive}>
          {label}
        </Text>
        {!isActive && showChevron && (
          <HugeiconsIcon icon={SortingDownIcon} size={13} color={colors.textMuted} style={{ marginLeft: spacing('1') }} />
        )}
      </BentoPressable>
      {isActive && onClear && (
        <BentoPressable
          onPress={onClear}
          style={styles.chipCloseBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          scaleOnPress={false}
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={13} color={tintColor} />
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
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  // Fetch transactions
  const txQuery = useInfiniteTransactions(basicFilters);
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

    // If no advanced client-side filtering needed, return DB result as-is
    if (!AdvancedFilterService.requiresClientSideFiltering(advancedFilters)) {
      return allTransactions;
    }

    return allTransactions.filter((transaction) => {
      // Date range filter
      if (advancedFilters.dateRange) {
        const txDate = new Date(transaction.datetime);
        const startDate = new Date(advancedFilters.dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(advancedFilters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);

        if (txDate < startDate || txDate > endDate) {
          return false;
        }
      }

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

      // Amount range filter
      if (advancedFilters.amountRange) {
        const amount = transaction.amount;
        if (advancedFilters.amountRange.min !== undefined && amount < advancedFilters.amountRange.min) {
          return false;
        }
        if (advancedFilters.amountRange.max !== undefined && amount > advancedFilters.amountRange.max) {
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
  }, [txQuery.data?.pages, advancedFilters]);

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

  // Calculate KPI totals from the current visible page only (not all accumulated pages).
  // Scanning all accumulated pages on large datasets blocks the JS thread.
  const kpiTotalsByCurrency = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};

    // Use the last fetched page for KPI display — it reflects the current filter state
    // and is bounded by PAGE_SIZE (20 items), never 500+ items.
    const currentPage = txQuery.data?.pages[txQuery.data.pages.length - 1] ?? [];
    const source = currentPage.length > 0 ? currentPage : (txQuery.data?.pages[0] ?? []);

    source.forEach((tx) => {
      const currency = tx.account.currency;
      if (!map[currency]) map[currency] = { income: 0, expense: 0 };

      if (tx.type === 'CR') {
        map[currency].income += tx.amount;
      } else if (tx.type === 'DR') {
        map[currency].expense += tx.amount;
      }
    });

    return map;
  }, [txQuery.data?.pages]);

  const kpiCurrencies = useMemo(() => Object.keys(kpiTotalsByCurrency), [kpiTotalsByCurrency]);

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

  const isSortActive = useMemo(() => {
    return advancedFilters.sortBy !== 'date' || advancedFilters.sortOrder !== 'desc';
  }, [advancedFilters.sortBy, advancedFilters.sortOrder]);

  const activeTypesCount = useMemo(() => advancedFilters.types?.length ?? 0, [advancedFilters.types]);
  const activeAccountsCount = useMemo(() => advancedFilters.accountIds?.length ?? 0, [advancedFilters.accountIds]);
  const activeCategoriesCount = useMemo(() => advancedFilters.categoryIds?.length ?? 0, [advancedFilters.categoryIds]);
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
    if (min !== undefined && max !== undefined) return `${min} - ${max}`;
    if (min !== undefined) return `>${min}`;
    if (max !== undefined) return `<${max}`;
    return 'Amount';
  }, [advancedFilters.amountRange]);

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

  const handleResetSort = useCallback((e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    Haptics.selectionAsync().catch(() => { });
    setAdvancedFilters(p => ({ ...p, sortBy: 'date', sortOrder: 'desc' }));
  }, []);

  const handleApplyFilters = useCallback((filters: AdvancedFilters) => {
    setAdvancedFilters(filters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  const handleEdit = React.useCallback(
    (tx: TransactionListItem) => {
      router.push(`/transactions/edit/${tx.id}`);
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

  type DayTotals = { in: number; out: number };

  const renderSectionHeader = React.useCallback(
    ({ section: { title, data } }: { section: SectionListData<TransactionListItem, TxSection> }) => {
      const dayTotal = data.reduce<DayTotals>(
        (acc, tx) => {
          if (tx.type === 'CR') acc.in += tx.amount;
          else if (tx.type === 'DR') acc.out += tx.amount;
          return acc;
        },
        { in: 0, out: 0 },
      );
      return (
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayTitle}>{title}</Text>
          <View style={styles.dayTotals}>
            {dayTotal.in > 0 && (
              <MoneyText amount={dayTotal.in} type="CR" style={styles.dayTotalValue} />
            )}
            {dayTotal.out > 0 && (
              <MoneyText amount={dayTotal.out} type="DR" style={styles.dayTotalValue} />
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
            <BentoPressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => { });
                setShowAdvancedFilterSheet(true);
              }}
              style={styles.iconBtn}
            >
              <HugeiconsIcon icon={FilterIcon} size={22} color={colors.text} />
            </BentoPressable>
            <BentoPressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => { });
                setShowSortSheet(true);
              }}
              style={styles.iconBtn}
            >
              <HugeiconsIcon icon={SortingDownIcon} size={22} color={colors.text} />
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
            <KPICard
              currencies={kpiCurrencies}
              selectedCurrency={selectedKpiCurrency}
              onSelectCurrency={setSelectedKpiCurrency}
              metrics={activeTotals}
            />

            {/* ── MD3 Play Store Filter Chips Row ── */}
            {isSortActive || activeTypesCount > 0 || activeAccountsCount > 0 || activeCategoriesCount > 0 || isDateActive || isAmountActive ? (
              <View style={styles.chipsScrollContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {isSortActive && (
                    <FilterChip
                      label={sortLabel}
                      isActive={isSortActive}
                      onPress={handleOpenSort}
                      onClear={handleResetSort}
                    />
                  )}
                  {activeTypesCount > 0 && (
                    <FilterChip
                      label={typeLabel}
                      isActive={activeTypesCount > 0}
                      onPress={handleOpenFilter}
                      onClear={clearTypes}
                    />
                  )}
                  {activeAccountsCount > 0 && (
                    <FilterChip
                      label={accountLabel}
                      isActive={activeAccountsCount > 0}
                      onPress={handleOpenFilter}
                      onClear={clearAccounts}
                    />
                  )}
                  {activeCategoriesCount > 0 && (
                    <FilterChip
                      label={categoryLabel}
                      isActive={activeCategoriesCount > 0}
                      onPress={handleOpenFilter}
                      onClear={clearCategories}
                    />
                  )}
                  {isDateActive && (
                    <FilterChip
                      label={dateLabel}
                      isActive={isDateActive}
                      onPress={handleOpenFilter}
                      onClear={clearDateRange}
                    />
                  )}
                  {isAmountActive && (
                    <FilterChip
                      label={amountLabel}
                      isActive={isAmountActive}
                      onPress={handleOpenFilter}
                      onClear={clearAmountRange}
                    />
                  )}
                </ScrollView>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBox}>
              <HugeiconsIcon icon={ReceiptTextIcon} size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0
                ? 'No transactions match the active filters.'
                : 'Add your first transaction to start tracking.'}
            </Text>
            <BentoPressable style={styles.emptyAction} onPress={() => router.push('/transactions/create')}>
              <Text style={styles.emptyActionText}>Add Transaction</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.background} />
            </BentoPressable>
          </View>
        )}
        ListFooterComponent={txQuery.isFetchingNextPage ? (
          <View style={styles.loadMoreWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      />

      <BentoPressable
        style={styles.fab}
        onPress={() => {
          Haptics.selectionAsync().catch(() => { });
          router.push('/transactions/create');
        }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.background} />
      </BentoPressable>

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

      <OptionsBottomSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
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
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_TRANSACTIONS} steps={TRANSACTIONS_LIST_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark }: ThemeContextType) =>
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
      marginRight: -spacing('2'),
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('4'),
      gap: spacing('3'),
      backgroundColor: colors.background,
    },
    searchBackBtn: {
      width: 44,
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchHeaderInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
      height: 44,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    searchClearBtn: {
      position: 'absolute',
      right: spacing('4') + 10,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: 100,
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
    dayCard: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
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
      fontFamily: typography.fonts.semibold,
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
      backgroundColor: colors.text,
      marginTop: spacing('2'),
    },
    emptyActionText: {
      fontFamily: typography.fonts.semibold,
      color: colors.background,
      fontSize: 15,
    },
    loadMoreWrap: {
      paddingVertical: spacing('7'),
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipsScrollContainer: {
      marginTop: spacing('2'),
      marginBottom: spacing('1'),
    },
    chipsScroll: {
      gap: spacing('2'),
      paddingBottom: spacing('1.5'),
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius('full'),
      height: 30,
      borderWidth: 1,
      overflow: 'hidden',
    },
    chipInactive: {
      backgroundColor: colors.surface,
      borderColor: isDark ? '#2E3039' : '#E2E8F0',
    },
    chipActive: {
      backgroundColor: isDark ? '#11352A' : '#E6F4EA',
      borderColor: isDark ? colors.primary + '50' : colors.primary + '30',
    },
    chipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      height: '100%',
    },
    chipCloseBtn: {
      paddingRight: spacing('2.5'),
      paddingLeft: spacing('1.5'),
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipTextInactive: {
      fontFamily: typography.fonts.medium,
      fontSize: 11.5,
      color: colors.textMuted,
    },
    chipTextActive: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11.5,
      color: isDark ? colors.primaryLight : colors.primaryDark,
    },
  });
