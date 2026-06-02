import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';

export type DayBucket = {
  day: string; // YYYY-MM-DD
  income: number;
  expense: number;
};

export type MonthBucket = {
  month: string; // YYYY-MM
  income: number;
  expense: number;
};

export type CategoryBreakdown = {
  id: number;
  name: string;
  icon: string;
  color: number;
  amount: number;
  count: number;
};

export type DowSpend = {
  dow: number; // 0=Sun … 6=Sat
  total: number;
  count: number;
};

export const getDailyTimeSeries = async (
  currency: string,
  startIso: string,
): Promise<DayBucket[]> => {
  return db
    .select({
      day: sql<string>`date(${payments.datetime})`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), sql`date(${payments.datetime}) >= ${startIso}`))
    .groupBy(sql`date(${payments.datetime})`)
    .orderBy(sql`date(${payments.datetime})`);
};

export const getMonthlyTimeSeries = async (
  currency: string,
  monthsBack = 12,
): Promise<MonthBucket[]> => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return db
    .select({
      month: sql<string>`strftime('%Y-%m', ${payments.datetime})`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(
      eq(accounts.currency, currency),
      sql`strftime('%Y-%m', ${payments.datetime}) >= ${startStr}`,
    ))
    .groupBy(sql`strftime('%Y-%m', ${payments.datetime})`)
    .orderBy(sql`strftime('%Y-%m', ${payments.datetime})`);
};

export const getCategoryBreakdown = async (
  currency: string,
  startIso: string | null,
): Promise<CategoryBreakdown[]> => {
  const where = startIso
    ? and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`date(${payments.datetime}) >= ${startIso}`)
    : and(eq(accounts.currency, currency), eq(payments.type, 'DR'));
  return db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sql<number>`SUM(${payments.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(where)
    .groupBy(categories.id)
    .orderBy(sql`SUM(${payments.amount}) DESC`)
    .limit(8);
};

export const getSpendByDayOfWeek = async (
  currency: string,
  startIso: string | null,
): Promise<DowSpend[]> => {
  const where = startIso
    ? and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`date(${payments.datetime}) >= ${startIso}`)
    : and(eq(accounts.currency, currency), eq(payments.type, 'DR'));
  return db
    .select({
      dow: sql<number>`CAST(strftime('%w', ${payments.datetime}) AS INTEGER)`,
      total: sql<number>`SUM(${payments.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(where)
    .groupBy(sql`strftime('%w', ${payments.datetime})`);
};
