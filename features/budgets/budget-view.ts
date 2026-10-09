import type { BudgetWithCategory, Spend } from '@/data/repositories/budgets';
import { budgetStanding, crossingOf, limitWithRollover } from '@/features/budgets/budget-rules';
import type { Crossing } from '@/features/budgets/budget-rules';

/** A budget as the screens draw it: what it limits, the limit, and what this month has used. */
export type BudgetView = {
  id: number;
  categoryId: number | null;
  /** The category it limits, or null for the budget over all spending. */
  category: { name: string; icon: string; color: number } | null;
  currency: string;
  /** The limit as set, and whether last month's remainder is added to it. */
  monthlyLimit: number;
  rollover: boolean;
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
    categoryId: budget.categoryId,
    category: budget.category,
    currency: budget.currency,
    monthlyLimit: budget.monthlyLimit,
    rollover: budget.rollover,
    limit: limitWithRollover(budget.monthlyLimit, spentOn(budget, lastMonth), budget.rollover),
    spent: spentOn(budget, thisMonth),
  }));
}

/** An expense about to be counted: what it is for and how much. */
export type Expense = { categoryId: number; currency: string; amount: number };

/** The budgets an expense counts towards: its category's, and the one over all spending, in its currency. */
export const budgetsFor = (budgets: readonly BudgetView[], expense: Pick<Expense, 'categoryId' | 'currency'>): BudgetView[] =>
  budgets.filter((budget) => budget.currency === expense.currency && (budget.categoryId === null || budget.categoryId === expense.categoryId));

export type BudgetWarning = { budget: BudgetView; crossing: Crossing; left: number; over: number };

/**
 * The one thing worth saying after an expense is saved: the budget it took to its limit, else the
 * one it took into its last fifth. The category's budget speaks before the one over all spending.
 */
export function warningAfter(budgets: readonly BudgetView[], expense: Expense): BudgetWarning | null {
  const crossed = budgetsFor(budgets, expense)
    .map((budget) => ({ budget, crossing: crossingOf(budget.spent, budget.spent + expense.amount, budget.limit), ...budgetStanding(budget.spent + expense.amount, budget.limit) }))
    .filter((item): item is typeof item & { crossing: Crossing } => item.crossing !== null)
    .sort((a, b) => Number(b.crossing === 'over') - Number(a.crossing === 'over') || Number(a.budget.categoryId === null) - Number(b.budget.categoryId === null));
  const first = crossed[0];
  return first ? { budget: first.budget, crossing: first.crossing, left: first.left, over: first.over } : null;
}

/** The order budgets are listed in: the one closest to its limit, or furthest past it, first. */
export const byUrgency = (budgets: readonly BudgetView[]): BudgetView[] =>
  [...budgets].sort((a, b) => budgetStanding(b.spent, b.limit).share - budgetStanding(a.spent, a.limit).share || a.id - b.id);
