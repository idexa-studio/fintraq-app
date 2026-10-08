import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { PAYMENT_LOCAL_DAY } from '@/src/db/sql';
import { accounts, categories, payments } from '@/src/db/schema';
import { getDaysAgoLocal, getLocalISOString, getStartOfMonthLocal } from '@/shared/date/date';
import { formatCurrency } from '@/shared/format/money';
import { TransactionType } from '@/shared/types';
import { MaterialIconName } from '@/src/utils/icons';
import { LoggerService } from '@/src/services/logger.service';
import i18n from '@/shared/i18n';

/** How an insight card is styled. */
export type InsightStatus = 'success' | 'danger' | 'info' | 'warning';

/** Which way the figure behind an insight moved. */
export type InsightTrend = 'up' | 'down' | 'neutral';

type InsightBase = {
  id: string;
  type: InsightStatus;
  title: string;
  subtitle: string;
  icon: MaterialIconName;
  trend?: InsightTrend;
};

export type AmountInsight = InsightBase & { valueType: 'amount'; amount: number; currency: string };
export type PercentageInsight = InsightBase & { valueType: 'percentage'; percentage: number };
export type TextInsight = InsightBase & { valueType: 'text'; text: string };
export type DashboardInsight = AmountInsight | PercentageInsight | TextInsight;

/**
 * Rolling weeks ending today: week 0 is today and the six days before it, week 1 the seven days
 * before that, and so on — every weekly figure here uses these, so they compare like with like.
 */
const rollingWeek = (weeksBack: number) => ({ start: getDaysAgoLocal(7 * weeksBack + 6), end: getDaysAgoLocal(7 * weeksBack) });

const getWeekSums = async (weeksBack: number, currency: string) => {
  const { start, end } = rollingWeek(weeksBack);
  const [result] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), sql`${PAYMENT_LOCAL_DAY} BETWEEN ${start} AND ${end}`));
  return { income: result?.income ?? 0, expense: result?.expense ?? 0 };
};

export const getDashboardInsights = async (currency: string): Promise<DashboardInsight[]> => {
  const insights: DashboardInsight[] = [];

  try {
    const thisWeek = await getWeekSums(0, currency);
    const lastWeek = await getWeekSums(1, currency);
    const thisWeekStart = rollingWeek(0).start;
    // The three weeks before this one, for a category's usual weekly spend.
    const baselineStart = rollingWeek(3).start;

    // 1. Weekly Spending vs Last Week
    if (thisWeek.expense > 0 && lastWeek.expense > 0) {
      const change = ((thisWeek.expense - lastWeek.expense) / lastWeek.expense) * 100;
      const absChange = Math.abs(change);
      const isUp = change > 0;
      insights.push({
        id: 'weekly-spend',
        type: (isUp ? 'danger' : 'success') as InsightStatus,
        title: isUp ? i18n.t('insights.spendingUp', { pct: absChange.toFixed(0) }) : i18n.t('insights.spendingDown', { pct: absChange.toFixed(0) }),
        valueType: 'text',
        text: `${isUp ? '+' : ''}${absChange.toFixed(0)}%`,
        subtitle: isUp
          ? i18n.t('insights.spendingUpHint')
          : i18n.t('insights.spendingDownHint'),
        icon: isUp ? 'trending-up' : 'trending-down',
        trend: (isUp ? 'up' : 'down') as InsightTrend,
      });
    }

    // 2. Income Insight
    if (thisWeek.income > 0) {
      const prevIncome = lastWeek.income;
      if (prevIncome > 0) {
        const incomeChange = ((thisWeek.income - prevIncome) / prevIncome) * 100;
        const absChange = Math.abs(incomeChange);
        if (absChange > 2) {
          const isUp = incomeChange > 0;
          insights.push({
            id: 'income-change',
            type: (isUp ? 'success' : 'warning') as InsightStatus,
            title: isUp ? i18n.t('insights.incomeUp', { pct: absChange.toFixed(0) }) : i18n.t('insights.incomeDown', { pct: absChange.toFixed(0) }),
            valueType: 'text',
            text: `${isUp ? '+' : ''}${absChange.toFixed(0)}%`,
            subtitle: isUp
              ? i18n.t('insights.incomeUpHint')
              : i18n.t('insights.incomeDownHint'),
            icon: isUp ? 'cash' : 'trending-down',
            trend: (isUp ? 'up' : 'down') as InsightTrend,
          });
        }
      }
    }

    // 2. Savings Rate
    if (thisWeek.income > 0) {
      const rate = ((thisWeek.income - thisWeek.expense) / thisWeek.income) * 100;
      if (rate > 0) {
        const prevRate = lastWeek.income > 0 ? ((lastWeek.income - lastWeek.expense) / lastWeek.income) * 100 : 0;
        const diff = rate - prevRate;
        const dir = diff > 3 ? 'up' : diff < -3 ? 'down' : '';
        const adj = rate > 60 ? 'strong' : rate > 30 ? 'healthy' : 'steady';
        insights.push({
          id: 'savings-rate',
          type: 'success' as InsightStatus,
          title: i18n.t('insights.savingAt', { rate: rate.toFixed(0), adj: i18n.t(`insights.${adj}`) }),
          valueType: 'text',
          text: `${rate.toFixed(0)}%`,
          subtitle: dir
            ? i18n.t(dir === 'up' ? 'insights.savingsUp' : 'insights.savingsDown', { tail: rate > 50 ? i18n.t('insights.cushion') : i18n.t('insights.keepAtIt') })
            : i18n.t('insights.savingsSame', { tail: rate > 50 ? i18n.t('insights.futureSelf') : i18n.t('insights.steadyWins') }),
          icon: 'building',
        });
      }
    }

    // 3. Category Spike or Drop
    const rows = await db
      .select({
        categoryId: payments.categoryId,
        name: categories.name,
        thisWeek: sql<number>`SUM(CASE WHEN ${PAYMENT_LOCAL_DAY} >= ${thisWeekStart} THEN ${payments.amount} ELSE 0 END)`,
        avgWeek: sql<number>`SUM(CASE WHEN ${PAYMENT_LOCAL_DAY} >= ${baselineStart} AND ${PAYMENT_LOCAL_DAY} < ${thisWeekStart} THEN ${payments.amount} ELSE 0 END) / 3.0`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .innerJoin(categories, eq(payments.categoryId, categories.id))
      .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR' as TransactionType), sql`${PAYMENT_LOCAL_DAY} BETWEEN ${baselineStart} AND ${getLocalISOString()}`))
      .groupBy(payments.categoryId)
      .having(sql`SUM(CASE WHEN ${PAYMENT_LOCAL_DAY} >= ${thisWeekStart} THEN ${payments.amount} ELSE 0 END) > 0`)
      .orderBy(desc(sql`SUM(CASE WHEN ${PAYMENT_LOCAL_DAY} >= ${thisWeekStart} THEN ${payments.amount} ELSE 0 END)`))
      .limit(5);

    for (const r of rows) {
      const tw = r.thisWeek ?? 0;
      const avg = r.avgWeek ?? 0;
      if (avg > 0 && tw > 0) {
        const pct = ((tw - avg) / avg) * 100;
        if (Math.abs(pct) > 5) {
          const isUp = pct > 0;
          insights.push({
            id: `cat-${r.categoryId}`,
            type: (isUp ? 'danger' : 'success') as InsightStatus,
            title: isUp ? i18n.t('insights.spike', { name: r.name }) : i18n.t('insights.cutBack', { name: r.name }),
            valueType: 'text',
            text: r.name as string,
            subtitle: isUp
              ? i18n.t('insights.spikeHint', { pct: pct.toFixed(0), name: r.name })
              : i18n.t('insights.cutHint', { pct: Math.abs(pct).toFixed(0), name: r.name }),
            icon: isUp ? 'fire' : 'leaf',
            trend: (isUp ? 'up' : 'down') as InsightTrend,
          });
          break;
        }
      }
    }

    // 4. Weekly Summary
    if (thisWeek.income > 0 || thisWeek.expense > 0) {
      const saved = thisWeek.income - thisWeek.expense;

      let best = '';
      if (saved > 0) {
        const week3 = await getWeekSums(2, currency);
        const week2 = await getWeekSums(3, currency);
        const week1 = await getWeekSums(4, currency);
        const allSaved = [
          week1.income - week1.expense,
          week2.income - week2.expense,
          week3.income - week3.expense,
          lastWeek.income - lastWeek.expense,
          saved,
        ];
        if (saved >= Math.max(...allSaved)) best = i18n.t('insights.bestWeek');
      }

      insights.push({
        id: 'weekly-summary',
        type: saved > 0 ? 'success' : 'warning' as InsightStatus,
        title: i18n.t('insights.weekReview'),
        valueType: 'text',
        text: '',
        subtitle: `${i18n.t('insights.weekSummary', { income: formatCurrency(thisWeek.income, currency), expense: formatCurrency(thisWeek.expense, currency), amount: formatCurrency(Math.abs(saved), currency), verb: saved >= 0 ? i18n.t('insights.saved') : i18n.t('insights.overspent') })}${best}`,
        icon: 'receipt-text',
      });
    }

    // 5. Month Net
    const [monthly] = await db
      .select({
        income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
        expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .where(and(eq(accounts.currency, currency), sql`${PAYMENT_LOCAL_DAY} BETWEEN ${getStartOfMonthLocal()} AND ${getLocalISOString()}`));

    const net = (monthly?.income ?? 0) - (monthly?.expense ?? 0);
    if (net !== 0) {
      insights.push({
        id: 'monthly-net',
        type: (net > 0 ? 'success' : 'warning') as InsightStatus,
        title: net > 0 ? i18n.t('insights.monthGood') : i18n.t('insights.monthTight'),
        valueType: 'amount',
        amount: Math.abs(net),
        currency,
        subtitle: net > 0
          ? i18n.t('insights.monthGoodHint')
          : i18n.t('insights.monthTightHint'),
        icon: 'calendar-outline',
      });
    }

    if (insights.length > 6) insights.splice(6);

  } catch (error) {
    LoggerService.error('INSIGHTS', 'Failed to generate dashboard insights', error);
  }

  return insights;
};
