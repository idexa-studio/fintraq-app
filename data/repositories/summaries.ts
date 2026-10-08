import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/data/db/client';
import { PAYMENT_LOCAL_DAY } from '@/data/db/sql';
import { accounts, payments } from '@/data/db/schema';
import type { MonthTotals } from '@/shared/calc/month';
import { format, startOfMonth, subMonths } from 'date-fns';

/** Everything ever recorded in one currency — the Home hero's income and expense tiles. */
export const getLifetimeTotals = async (currency: string): Promise<{ income: number; expense: number }> => {
  const [row] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(eq(accounts.currency, currency));
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
};

/** This month's totals plus last month's spend, for the month widgets. */
export const getMonthTotals = async (currency: string, now: Date = new Date()): Promise<MonthTotals> => {
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
  // Same day last month, clamped to its length (31 March compares with 28/29 February).
  const lastMonthSameDay = format(subMonths(now, 1), 'yyyy-MM-dd');
  // Up to today: an entry dated later this month hasn't happened yet.
  const today = format(now, 'yyyy-MM-dd');
  const day = PAYMENT_LOCAL_DAY;

  const [row] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' AND ${day} >= ${monthStart} THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' AND ${day} >= ${monthStart} THEN ${payments.amount} ELSE 0 END)`,
      lastMonthToDate: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' AND ${day} < ${monthStart} AND ${day} <= ${lastMonthSameDay} THEN ${payments.amount} ELSE 0 END)`,
      lastMonthTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' AND ${day} < ${monthStart} THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), sql`${day} BETWEEN ${lastMonthStart} AND ${today}`));

  return {
    income: row?.income ?? 0,
    expense: row?.expense ?? 0,
    lastMonthToDate: row?.lastMonthToDate ?? 0,
    lastMonthTotal: row?.lastMonthTotal ?? 0,
  };
};

/** Expense per local day from `since` (yyyy-MM-dd) onwards. */
export const getDailySpend = async (currency: string, since: string): Promise<Map<string, number>> => {
  const day = PAYMENT_LOCAL_DAY;
  const rows = await db
    .select({ date: day, amount: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR'), sql`${day} >= ${since}`))
    .groupBy(day);
  return new Map(rows.map((r) => [r.date, r.amount ?? 0]));
};
