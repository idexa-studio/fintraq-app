import type { BudgetWithCategory, NewBudget } from '@/data/repositories/budgets';
import type { Category } from '@/data/repositories/categories';
import { parseAmountInput } from '@/shared/format/amount';

/** What a budget limits: one category, or all spending. */
export type BudgetTarget = number | 'all';

/** A budget as it is being filled in. Nothing is saved until the form is confirmed. */
export type BudgetDraft = {
  /** Null until one is chosen. */
  target: BudgetTarget | null;
  currency: string;
  /** The monthly limit as typed. */
  amountText: string;
  rollover: boolean;
};

export const newBudgetDraft = (currency: string): BudgetDraft => ({ target: null, currency, amountText: '', rollover: false });

export const draftOfBudget = (budget: Pick<BudgetWithCategory, 'categoryId' | 'currency' | 'monthlyLimit' | 'rollover'>): BudgetDraft => ({
  target: budget.categoryId ?? 'all',
  currency: budget.currency,
  amountText: String(budget.monthlyLimit),
  rollover: budget.rollover,
});

export const limitOf = (draft: BudgetDraft): number => parseAmountInput(draft.amountText) ?? 0;

/** Why the budget cannot be saved yet, in the order the form asks, or null when it can. */
export type BudgetBlocker = 'target' | 'amount';

export function budgetBlockerOf(draft: BudgetDraft): BudgetBlocker | null {
  if (draft.target === null) return 'target';
  if (limitOf(draft) <= 0) return 'amount';
  return null;
}

export const isBudgetChanged = (draft: BudgetDraft, initial: BudgetDraft): boolean =>
  draft.target !== initial.target || draft.currency !== initial.currency || draft.amountText !== initial.amountText || draft.rollover !== initial.rollover;

export const newBudgetOf = (draft: BudgetDraft): NewBudget => ({ categoryId: draft.target === 'all' ? null : draft.target, currency: draft.currency, monthlyLimit: limitOf(draft), rollover: draft.rollover });

type Taken = Pick<BudgetWithCategory, 'categoryId' | 'currency'>;

/**
 * What can still be given a budget in a currency: the user's own expense categories that have
 * none yet. The built-in categories carry loans and transfers, which are never spending.
 */
export function unbudgetedCategories(categories: readonly Category[], budgets: readonly Taken[], currency: string): Category[] {
  const taken = new Set(budgets.filter((budget) => budget.currency === currency).map((budget) => budget.categoryId));
  return categories.filter((category) => category.type === 'DR' && !category.isSystem && !taken.has(category.id));
}

/** One budget over all spending per currency. */
export const canBudgetAllSpending = (budgets: readonly Taken[], currency: string): boolean => !budgets.some((budget) => budget.currency === currency && budget.categoryId === null);
