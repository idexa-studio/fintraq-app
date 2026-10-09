import { db } from '@/data/db/client';
import { NOT_LOAN_MONEY, PAYMENT_LOCAL_DAY } from '@/data/db/sql';
import { accounts, budgets, categories, payments } from '@/data/db/schema';
import { and, count, eq, isNull, ne, sql } from 'drizzle-orm';

export type Budget = typeof budgets.$inferSelect;

/** A budget with the category it limits; no category is the budget over all spending. */
export type BudgetWithCategory = Budget & { category: { name: string; icon: string; color: number } | null };

/** What a budget is made from. The category and currency are fixed once made. */
export type NewBudget = { categoryId: number | null; currency: string; monthlyLimit: number; rollover: boolean };

/** There is already a budget for this category (or for all spending) in this currency. */
export class BudgetExistsError extends Error {
  constructor() {
    super('A budget for this already exists.');
    this.name = 'BudgetExistsError';
  }
}

export const getBudgets = async (): Promise<BudgetWithCategory[]> => {
  const rows = await db
    .select({ budget: budgets, name: categories.name, icon: categories.icon, color: categories.color })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .orderBy(budgets.createdAt, budgets.id);
  return rows.map(({ budget, name, icon, color }) => ({ ...budget, category: budget.categoryId === null || name === null ? null : { name, icon: icon ?? 'tag', color: color ?? 0 } }));
};

export const countBudgets = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(budgets);
  return row?.value ?? 0;
};

const sameTarget = (categoryId: number | null, currency: string) =>
  and(categoryId === null ? isNull(budgets.categoryId) : eq(budgets.categoryId, categoryId), eq(budgets.currency, currency));

/** The check and the insert share one transaction, so two taps cannot make two budgets for one thing. */
export const createBudget = async (data: NewBudget): Promise<Budget> =>
  db.transaction((tx) => {
    if (tx.select({ id: budgets.id }).from(budgets).where(sameTarget(data.categoryId, data.currency)).limit(1).all().length > 0) throw new BudgetExistsError();
    return tx.insert(budgets).values(data).returning().all()[0]!;
  });

export const updateBudget = async (id: number, data: Pick<NewBudget, 'monthlyLimit' | 'rollover'>): Promise<Budget | undefined> => {
  const [row] = await db.update(budgets).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(budgets.id, id)).returning();
  return row;
};

export const deleteBudget = async (id: number): Promise<void> => {
  await db.delete(budgets).where(eq(budgets.id, id));
};

/** Whether deleting this category would take a budget with it. */
export const categoryHasBudget = async (categoryId: number): Promise<boolean> => {
  const [row] = await db.select({ id: budgets.id }).from(budgets).where(eq(budgets.categoryId, categoryId)).limit(1);
  return row !== undefined;
};

export type Spend = { currency: string; categoryId: number; amount: number };

/**
 * What was spent between two local days (yyyy-MM-dd, both included), per currency and category.
 * Spending is an expense: transfers move money and are never counted, and money lent out or paid
 * back on a loan is owed, not spent, so anything tied to a loan is left out too.
 */
export const getSpend = async (from: string, to: string): Promise<Spend[]> => {
  const day = PAYMENT_LOCAL_DAY;
  const rows = await db
    .select({ currency: accounts.currency, categoryId: payments.categoryId, amount: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(payments.type, 'DR'), NOT_LOAN_MONEY, sql`${day} BETWEEN ${from} AND ${to}`, ne(payments.amount, 0)))
    .groupBy(accounts.currency, payments.categoryId);
  return rows.map((row) => ({ currency: row.currency, categoryId: row.categoryId, amount: row.amount ?? 0 }));
};
