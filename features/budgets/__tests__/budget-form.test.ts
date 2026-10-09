import type { Category } from '@/data/repositories/categories';
import { budgetBlockerOf, canBudgetAllSpending, draftOfBudget, isBudgetChanged, newBudgetDraft, newBudgetOf, unbudgetedCategories } from '@/features/budgets/budget-form';

const category = (id: number, over: Partial<Category> = {}): Category => ({ id, name: `c${id}`, icon: 'tag', color: 1, type: 'DR', isSystem: false, createdAt: '', updatedAt: '', ...over });

describe('budgetBlockerOf', () => {
  it('asks for what is limited, then for a limit above zero', () => {
    const draft = newBudgetDraft('USD');
    expect(budgetBlockerOf(draft)).toBe('target');
    expect(budgetBlockerOf({ ...draft, target: 3 })).toBe('amount');
    expect(budgetBlockerOf({ ...draft, target: 3, amountText: '0' })).toBe('amount');
    expect(budgetBlockerOf({ ...draft, target: 'all', amountText: '1,500.50' })).toBeNull();
  });
});

describe('newBudgetOf', () => {
  it('saves all spending as no category', () => {
    expect(newBudgetOf({ target: 'all', currency: 'EUR', amountText: '800', rollover: true })).toEqual({ categoryId: null, currency: 'EUR', monthlyLimit: 800, rollover: true });
    expect(newBudgetOf({ target: 4, currency: 'EUR', amountText: '80,5', rollover: false }).categoryId).toBe(4);
  });
});

describe('draftOfBudget', () => {
  it('reads a saved budget back unchanged', () => {
    const draft = draftOfBudget({ categoryId: null, currency: 'USD', monthlyLimit: 250.5, rollover: true });
    expect(draft).toEqual({ target: 'all', currency: 'USD', amountText: '250.5', rollover: true });
    expect(isBudgetChanged(draft, draft)).toBe(false);
    expect(isBudgetChanged({ ...draft, rollover: false }, draft)).toBe(true);
  });
});

describe('what can still be budgeted', () => {
  const categories = [category(1), category(2), category(3, { type: 'CR' }), category(4, { isSystem: true })];
  const budgets = [{ categoryId: 1, currency: 'USD' }, { categoryId: null, currency: 'EUR' }];

  it('offers the user’s own expense categories that have no budget in that currency', () => {
    expect(unbudgetedCategories(categories, budgets, 'USD').map((c) => c.id)).toEqual([2]);
    expect(unbudgetedCategories(categories, budgets, 'EUR').map((c) => c.id)).toEqual([1, 2]);
  });

  it('allows one budget over all spending per currency', () => {
    expect(canBudgetAllSpending(budgets, 'USD')).toBe(true);
    expect(canBudgetAllSpending(budgets, 'EUR')).toBe(false);
  });
});
