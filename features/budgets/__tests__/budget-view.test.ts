import type { BudgetWithCategory, Spend } from '@/data/repositories/budgets';
import { budgetViews, budgetsFor, spentOn, warningAfter } from '@/features/budgets/budget-view';
import type { BudgetView } from '@/features/budgets/budget-view';

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

describe('after an expense', () => {
  const view = (id: number, categoryId: number | null, limit: number, spent: number): BudgetView => ({ id, categoryId, category: null, currency: 'USD', monthlyLimit: limit, rollover: false, limit, spent });
  const food = view(1, 3, 500, 300);
  const all = view(2, null, 1000, 700);

  it('counts towards its category budget and the one over all spending, in its currency', () => {
    expect(budgetsFor([food, all], { categoryId: 3, currency: 'USD' }).map((b) => b.id)).toEqual([1, 2]);
    expect(budgetsFor([food, all], { categoryId: 9, currency: 'USD' }).map((b) => b.id)).toEqual([2]);
    expect(budgetsFor([food, all], { categoryId: 3, currency: 'EUR' })).toEqual([]);
  });

  it('says nothing when no line is crossed', () => {
    expect(warningAfter([food, all], { categoryId: 3, currency: 'USD', amount: 50 })).toBeNull();
  });

  it('names the budget taken into its last fifth, with what is left', () => {
    expect(warningAfter([food, all], { categoryId: 3, currency: 'USD', amount: 120 })).toMatchObject({ budget: { id: 1 }, crossing: 'near', left: 80 });
  });

  it('puts a limit reached before a last fifth, and the category before all spending', () => {
    expect(warningAfter([food, all], { categoryId: 3, currency: 'USD', amount: 250 })).toMatchObject({ budget: { id: 1 }, crossing: 'over', over: 50 });
    expect(warningAfter([food, all], { categoryId: 9, currency: 'USD', amount: 320 })).toMatchObject({ budget: { id: 2 }, crossing: 'over', over: 20 });
  });
});
