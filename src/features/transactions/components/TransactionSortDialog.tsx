import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionsDialog } from '@/src/components/ui';
import type { SortOption } from '@/src/features/transactions/hooks/useTransactionFilters';

const SORT_OPTIONS = [
  { key: 'newest', sortBy: 'date', sortOrder: 'desc' },
  { key: 'oldest', sortBy: 'date', sortOrder: 'asc' },
  { key: 'highest', sortBy: 'amount', sortOrder: 'desc' },
  { key: 'lowest', sortBy: 'amount', sortOrder: 'asc' },
] as const satisfies readonly (SortOption & { key: string })[];

const keyOf = (sort: SortOption) => SORT_OPTIONS.find((o) => o.sortBy === sort.sortBy && o.sortOrder === sort.sortOrder)?.key ?? 'newest';

/** The label for the current sort, e.g. "Oldest first" — shared by the dialog and the sort chip. */
export function useSortLabel(sort: SortOption): string {
  const { t } = useTranslation();
  return t(`transactions.${keyOf(sort)}`);
}

type TransactionSortDialogProps = {
  visible: boolean;
  sort: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
};

export const TransactionSortDialog = React.memo(function TransactionSortDialog({ visible, sort, onSelect, onClose }: TransactionSortDialogProps) {
  const { t } = useTranslation();
  const selected = keyOf(sort);

  const options = useMemo(
    () =>
      SORT_OPTIONS.map((option) => ({
        key: option.key,
        label: t(`transactions.${option.key}`),
        selected: option.key === selected,
        onPress: () => onSelect({ sortBy: option.sortBy, sortOrder: option.sortOrder }),
      })),
    [selected, onSelect, t],
  );

  return <OptionsDialog visible={visible} onClose={onClose} title={t('transactions.sortTitle')} options={options} />;
});
