import { and, eq, sql, SQL } from 'drizzle-orm';
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

/** A period in local calendar days, both ends inclusive (see analyticsWindow). */
export type DayRange = { start: string; end: string };

const inRange = (range: DayRange): SQL => sql`${PAYMENT_LOCAL_DAY} BETWEEN ${range.start} AND ${range.end}`;
const INCOME = sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END),0)`;
const EXPENSE = sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END),0)`;

/** Income and expense per local day with activity; callers fill the gaps (windowSlots). */
export const getDailyTimeSeries = async (currency: string, range: DayRange): Promise<DayBucket[]> =>
  db
    .select({ day: PAYMENT_LOCAL_DAY, income: INCOME, expense: EXPENSE })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), inRange(range)))
    .groupBy(PAYMENT_LOCAL_DAY)
    .orderBy(PAYMENT_LOCAL_DAY);

/** Income and expense per local month with activity. */
export const getMonthlyTimeSeries = async (currency: string, range: DayRange): Promise<MonthBucket[]> =>
  db
    .select({ month: PAYMENT_LOCAL_MONTH, income: INCOME, expense: EXPENSE })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), inRange(range)))
    .groupBy(PAYMENT_LOCAL_MONTH)
    .orderBy(PAYMENT_LOCAL_MONTH);

/**
 * Every category with spending (or income) in the period, largest first. Complete — not a top-N —
 * so shares of the period total add up and match the summary.
 */
const categoryBreakdown = (type: 'CR' | 'DR') => async (currency: string, range: DayRange): Promise<CategoryBreakdown[]> =>
  db
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
    .where(and(eq(accounts.currency, currency), eq(payments.type, type), inRange(range)))
    .groupBy(categories.id)
    .orderBy(sql`SUM(${payments.amount}) DESC`);

export const getCategoryBreakdown = categoryBreakdown('DR');
export const getIncomeCategoryBreakdown = categoryBreakdown('CR');

export type PeriodSummary = {
  income: number;
  expense: number;
};

export const getPeriodSummary = async (currency: string, range: DayRange): Promise<PeriodSummary> => {
  const rows = await db
    .select({ income: INCOME, expense: EXPENSE })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), inRange(range)));
  return rows[0] ?? { income: 0, expense: 0 };
};

export type BiggestExpense = {
  amount: number;
  category: string;
  categoryColor: number;
  categoryIcon: string;
  categoryId: number;
  note: string;
  /** Local YYYY-MM-DD. */
  date: string;
};

export const getBiggestExpense = async (currency: string, range: DayRange): Promise<BiggestExpense | null> => {
  const [row] = await db
    .select({
      amount: payments.amount,
      note: payments.note,
      date: PAYMENT_LOCAL_DAY,
      categoryId: categories.id,
      category: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR'), inRange(range)))
    .orderBy(sql`${payments.amount} DESC`)
    .limit(1);
  return row ? { ...row, note: row.note || '' } : null;
};

/** Total spend per local weekday in the period; averageByWeekday turns it into a per-day average. */
export const getSpendByDayOfWeek = async (currency: string, range: DayRange): Promise<DowSpend[]> =>
  db
    .select({ dow: PAYMENT_LOCAL_WEEKDAY, total: sql<number>`SUM(${payments.amount})`, count: sql<number>`COUNT(*)` })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR'), inRange(range)))
    .groupBy(PAYMENT_LOCAL_WEEKDAY);
