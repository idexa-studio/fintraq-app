import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/src/components/ui';
import type { AdvancedFilters } from '@/src/features/filters/api/advanced-filters.service';
import type { ClearableFilter } from '@/src/features/transactions/hooks/useTransactionFilters';
import { useSortLabel } from '@/src/features/transactions/components/TransactionSortDialog';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Named = { id: number; name: string };

type ActiveFilterChipsProps = {
  filters: AdvancedFilters;
  activeFilterCount: number;
  isSortActive: boolean;
  accounts: readonly Named[];
  categories: readonly Named[];
  persons: readonly Named[];
  onEditFilters: () => void;
  onEditSort: () => void;
  onClearFilter: (key: ClearableFilter) => void;
  onResetSort: () => void;
  onResetFilters: () => void;
};

const tap = () => Haptics.selectionAsync().catch(() => {});

/** One chip per active filter/sort: tap to edit, ✕ to clear; plus "Clear all". */
export const ActiveFilterChips = React.memo(function ActiveFilterChips({
  filters,
  activeFilterCount,
  isSortActive,
  accounts,
  categories,
  persons,
  onEditFilters,
  onEditSort,
  onClearFilter,
  onResetSort,
  onResetFilters,
}: ActiveFilterChipsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sortLabel = useSortLabel(filters);

  const chips = useMemo(() => {
    const nameOf = (list: readonly Named[], id: number) => list.find((item) => item.id === id)?.name;
    const multi = (ids: number[] | undefined, single: (id: number) => string, many: (count: number) => string) =>
      !ids?.length ? null : ids.length === 1 ? single(ids[0]) : many(ids.length);

    const types = filters.types ?? [];
    const typeName = { CR: t('transactions.income'), DR: t('transactions.expense'), TR: t('transactions.transfer') };
    const amount = filters.amountRange;

    const entries: { key: ClearableFilter; label: string | null }[] = [
      { key: 'types', label: types.length === 0 ? null : types.length === 1 ? typeName[types[0]] : t('transactions.typesCount', { count: types.length }) },
      {
        key: 'accountIds',
        label: multi(filters.accountIds, (id) => nameOf(accounts, id) ?? t('transactions.oneAccount'), (count) => t('transactions.accountsCount', { count })),
      },
      {
        key: 'categoryIds',
        label: multi(filters.categoryIds, (id) => nameOf(categories, id) ?? t('transactions.oneCategory'), (count) => t('transactions.categoriesCount', { count })),
      },
      {
        key: 'personIds',
        // First name only — chips are narrow.
        label: multi(filters.personIds, (id) => nameOf(persons, id)?.split(' ')[0] ?? t('transactions.onePerson'), (count) => t('transactions.personsCount', { count })),
      },
      {
        key: 'dateRange',
        label: filters.dateRange
          ? `${format(new Date(filters.dateRange.startDate), 'MMM d')} – ${format(new Date(filters.dateRange.endDate), 'MMM d')}`
          : null,
      },
      {
        key: 'amountRange',
        label:
          amount?.min !== undefined && amount.max !== undefined
            ? `${amount.min} – ${amount.max}`
            : amount?.min !== undefined
              ? `≥${amount.min}`
              : amount?.max !== undefined
                ? `≤${amount.max}`
                : null,
      },
    ];
    return entries.filter((entry): entry is { key: ClearableFilter; label: string } => entry.label !== null);
  }, [filters, accounts, categories, persons, t]);

  if (activeFilterCount === 0 && !isSortActive) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {activeFilterCount > 0 && <Chip label={t('transactions.clearAll')} icon="x" onPress={onResetFilters} />}
      {isSortActive && (
        <Chip
          label={sortLabel}
          icon="sorting-down"
          isActive
          onPress={onEditSort}
          onClear={() => {
            tap();
            onResetSort();
          }}
        />
      )}
      {chips.map(({ key, label }) => (
        <Chip
          key={key}
          label={label}
          icon="filter"
          isActive
          onPress={onEditFilters}
          onClear={() => {
            tap();
            onClearFilter(key);
          }}
        />
      ))}
    </ScrollView>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      gap: spacing('1.5'),
      paddingTop: spacing('2'),
      paddingBottom: spacing('2'),
    },
  });
