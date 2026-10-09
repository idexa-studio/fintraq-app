import { EmptyState, IconCircle, LimitRow, ListGroup, resolveIcon } from '@/design';
import { budgetStanding } from '@/features/budgets/budget-rules';
import type { BudgetView } from '@/features/budgets/budget-view';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';

type BudgetListProps = {
  budgets: readonly BudgetView[];
  onOpen: (id: number) => void;
  onAdd: () => void;
};

/** The month's budgets, each with its bar, or the invitation to set the first one. */
export function BudgetList({ budgets, onOpen, onAdd }: BudgetListProps) {
  const { t } = useTranslation('budgets');
  if (budgets.length === 0) {
    return <EmptyState compact icon="pie-chart" color="teal" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={onAdd} />;
  }
  return (
    <ListGroup>
      {budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} onPress={() => onOpen(budget.id)} />)}
    </ListGroup>
  );
}

/** One budget: its category's mark and name, what is left, and how much of the limit is used. */
export function BudgetRow({ budget, onPress }: { budget: BudgetView; onPress?: () => void }) {
  const { t } = useTranslation('budgets');
  const { category, currency, limit, spent } = budget;
  const standing = budgetStanding(spent, limit);
  const money = (amount: number) => formatCurrency(amount, currency);
  const remaining = standing.over > 0 ? t('row.over', { amount: money(standing.over) }) : standing.state === 'over' ? t('row.reached') : t('row.left', { amount: money(standing.left) });
  return (
    <LimitRow
      leading={category ? <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} /> : <IconCircle icon="pie-chart" color="teal" />}
      title={category?.name ?? t('overall')}
      detail={t('row.of', { spent: money(spent), limit: money(limit) })}
      remaining={remaining}
      share={standing.share}
      state={standing.state}
      onPress={onPress}
    />
  );
}
