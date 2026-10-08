import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/data/db/client';
import { PAYMENT_LOCAL_DAY } from '@/data/db/sql';
import { accounts, payments, persons } from '@/data/db/schema';
import type { MonthTotals } from '@/src/features/dashboard/utils/widgets';
import { getPersonsNetByCurrency } from '@/src/features/persons/api/persons';
import { format, startOfMonth, subMonths } from 'date-fns';

export type PersonNetRow = {
  id: number;
  name: string;
  color: number;
  net: number;
};

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

export const getDashboardPersons = async (currency: string, limit = 6): Promise<PersonNetRow[]> => {
  // Net per person comes from the persons API, so Home and the people screens use one formula.
  // Persons with no transactions in this currency default to net = 0.
  const [allPersons, netMap] = await Promise.all([
    db.select({ id: persons.id, name: persons.name, color: persons.color }).from(persons),
    getPersonsNetByCurrency(currency),
  ]);

  // Everyone is listed, including people with nothing recorded yet: someone just added should
  // appear on Home rather than leave the section saying there is nobody. People with a balance
  // come first (largest owed first, as before), then the rest by name.
  return allPersons
    .map(p => ({ ...p, net: netMap.get(p.id) ?? 0 }))
    .sort((a, b) => Number(a.net === 0) - Number(b.net === 0) || a.net - b.net || a.name.localeCompare(b.name))
    .slice(0, limit);
};
