import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { PAYMENT_LOCAL_DAY, PAYMENT_LOCAL_MONTH, PAYMENT_LOCAL_WEEKDAY } from '@/src/db/sql';
import { accounts, categories, payments } from '@/src/db/schema';

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
      day: PAYMENT_LOCAL_DAY,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`))
    .groupBy(PAYMENT_LOCAL_DAY)
    .orderBy(PAYMENT_LOCAL_DAY);
};

export const getMonthlyTimeSeries = async (
  currency: string,
  monthsBack = 12,
): Promise<MonthBucket[]> => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return db
    .select({
      month: PAYMENT_LOCAL_MONTH,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(
      eq(accounts.currency, currency),
      sql`${PAYMENT_LOCAL_MONTH} >= ${startStr}`,
    ))
    .groupBy(PAYMENT_LOCAL_MONTH)
    .orderBy(PAYMENT_LOCAL_MONTH);
};

export const getCategoryBreakdown = async (
  currency: string,
  startIso: string | null,
): Promise<CategoryBreakdown[]> => {
  const where = startIso
    ? and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`)
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

export type PeriodSummary = {
  income: number;
  expense: number;
};

export const getPreviousPeriodSummary = async (
  currency: string,
  startIso: string,
  endIso: string,
): Promise<PeriodSummary> => {
  const rows = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(
      eq(accounts.currency, currency),
      sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`,
      sql`${PAYMENT_LOCAL_DAY} < ${endIso}`,
    ));
  return rows[0] ?? { income: 0, expense: 0 };
};

export type BiggestExpense = {
  amount: number;
  category: string;
  categoryColor: number;
  categoryIcon: string;
  categoryId: number;
  note: string;
  date: string;
};

export const getBiggestExpense = async (
  currency: string,
  startIso: string | null,
): Promise<BiggestExpense | null> => {
  const where = startIso
    ? and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`)
    : and(eq(accounts.currency, currency), eq(payments.type, 'DR'));
  const rows = await db
    .select({
      amount: payments.amount,
      note: payments.note,
      datetime: payments.datetime,
      categoryId: categories.id,
      category: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(where)
    .orderBy(sql`${payments.amount} DESC`)
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    amount: r.amount,
    category: r.category,
    categoryColor: r.categoryColor,
    categoryIcon: r.categoryIcon,
    categoryId: r.categoryId,
    note: r.note || '',
    date: r.datetime.split('T')[0],
  };
};

export const getIncomeCategoryBreakdown = async (
  currency: string,
  startIso: string | null,
): Promise<CategoryBreakdown[]> => {
  const where = startIso
    ? and(eq(accounts.currency, currency), eq(payments.type, 'CR'), sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`)
    : and(eq(accounts.currency, currency), eq(payments.type, 'CR'));
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
    ? and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`${PAYMENT_LOCAL_DAY} >= ${startIso}`)
    : and(eq(accounts.currency, currency), eq(payments.type, 'DR'));
  return db
    .select({
      dow: PAYMENT_LOCAL_WEEKDAY,
      total: sql<number>`SUM(${payments.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(where)
    .groupBy(PAYMENT_LOCAL_WEEKDAY);
};
