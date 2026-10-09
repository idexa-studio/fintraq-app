import { BudgetFormScreen } from '@/features/budgets';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/budgets/<id>/edit` */
export default function EditBudgetRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const budgetId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a budget that does not exist.
  return <BudgetFormScreen budgetId={Number.isFinite(budgetId) ? budgetId : -1} />;
}
