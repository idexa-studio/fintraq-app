import { and, desc, eq, sql, sum } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';

export type DashboardStats = {
  income: number;
  expense: number;
};

export const getDashboardStats = async (currency: string): Promise<DashboardStats> => {
  const [result] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(eq(accounts.currency, currency));

  return {
    income: result?.income ?? 0,
    expense: result?.expense ?? 0,
  };
};

export type CategorySpend = {
  id: number;
  name: string;
  icon: string;
  color: number;
  amount: number;
};

export const getTopExpenseCategories = async (currency: string, limit: number = 4): Promise<CategorySpend[]> => {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sum(payments.amount).mapWith(Number),
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR')))
    .groupBy(categories.id)
    .orderBy(desc(sql`amount`))
    .limit(limit);

  return result as CategorySpend[];
};
