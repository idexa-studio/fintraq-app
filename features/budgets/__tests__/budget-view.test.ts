import type { BudgetWithCategory, Spend } from '@/data/repositories/budgets';
import { budgetViews, spentOn } from '@/features/budgets/budget-view';

const budget = (over: Partial<BudgetWithCategory>): BudgetWithCategory => ({
  id: 1, categoryId: 3, currency: 'USD', monthlyLimit: 500, rollover: false, createdAt: '', updatedAt: '', category: { name: 'Groceries', icon: 'shopping-cart', color: 1 }, ...over,
});

const spend: Spend[] = [
  { currency: 'USD', categoryId: 3, amount: 320 },
  { currency: 'USD', categoryId: 4, amount: 80 },
  { currency: 'EUR', categoryId: 3, amount: 999 },
];

describe('spentOn', () => {
  it('counts the category in the budget currency only', () => {
    expect(spentOn(budget({}), spend)).toBe(320);
  });

  it('counts everything in the currency for the budget over all spending', () => {
    expect(spentOn(budget({ categoryId: null, category: null }), spend)).toBe(400);
  });
});

describe('budgetViews', () => {
  it('sets this month against the limit', () => {
    expect(budgetViews([budget({})], spend, [])).toEqual([{ id: 1, categoryId: 3, category: { name: 'Groceries', icon: 'shopping-cart', color: 1 }, currency: 'USD', monthlyLimit: 500, rollover: false, limit: 500, spent: 320 }]);
  });

  it('adds what was left last month only where the budget rolls over', () => {
    const last: Spend[] = [{ currency: 'USD', categoryId: 3, amount: 380 }];
    expect(budgetViews([budget({ rollover: true })], spend, last)[0]!.limit).toBe(620);
    expect(budgetViews([budget({})], spend, last)[0]!.limit).toBe(500);
  });
});
