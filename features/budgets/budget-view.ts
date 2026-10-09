import type { BudgetWithCategory, Spend } from '@/data/repositories/budgets';
import { limitWithRollover } from '@/features/budgets/budget-rules';

/** A budget as the screens draw it: what it limits, the limit, and what this month has used. */
export type BudgetView = {
  id: number;
  /** The category it limits, or null for the budget over all spending. */
  category: { name: string; icon: string; color: number } | null;
  currency: string;
  /** This month's limit, rollover included. */
  limit: number;
  spent: number;
};

/** What a budget counts out of a period's spending: its category's, or everything in its currency. */
export function spentOn(budget: Pick<BudgetWithCategory, 'categoryId' | 'currency'>, spend: readonly Spend[]): number {
  return spend
    .filter((row) => row.currency === budget.currency && (budget.categoryId === null || row.categoryId === budget.categoryId))
    .reduce((sum, row) => sum + row.amount, 0);
}

/** Each budget against this month, with last month's remainder added where it rolls over. */
export function budgetViews(budgets: readonly BudgetWithCategory[], thisMonth: readonly Spend[], lastMonth: readonly Spend[]): BudgetView[] {
  return budgets.map((budget) => ({
    id: budget.id,
    category: budget.category,
    currency: budget.currency,
    limit: limitWithRollover(budget.monthlyLimit, spentOn(budget, lastMonth), budget.rollover),
    spent: spentOn(budget, thisMonth),
  }));
}
