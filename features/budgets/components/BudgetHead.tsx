import { Card, Money, ProgressBar, Stat, Text, useStyles } from '@/design';
import type { Theme } from '@/design';
import { budgetPeriod, budgetStanding, monthProgress, perDayLeft } from '@/features/budgets/budget-rules';
import type { BudgetView } from '@/features/budgets/budget-view';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * The top of a budget's screen: what is left as the one large figure, how much of the limit is
 * used, and what that leaves for each day still to come. A day's allowance is true whatever the
 * budget is for; a forecast from the pace so far is not, since rent is paid once.
 */
export type BudgetHeadProps = {
  budget: BudgetView;
  today: Date;
  /** The day budgets start on; anything but the 1st puts the budget month's dates under its days left. */
  startDay?: number;
};

export function BudgetHead({ budget, today, startDay = 1 }: BudgetHeadProps) {
  const { t } = useTranslation('budgets');
  const styles = useStyles(createStyles);
  const { currency, limit, spent } = budget;
  const standing = budgetStanding(spent, limit);
  const month = monthProgress(today, startDay);
  const period = budgetPeriod(today, startDay);
  const day = (key: string) => formatDate(parseDateKey(key), { day: 'numeric', month: 'short' });
  const left = month.daysLeft > 0 ? t('head.daysLeft', { count: month.daysLeft }) : t('head.lastDay');
  const money = (amount: number) => formatCurrency(amount, currency);
  const over = standing.over > 0;
  const reached = standing.state === 'over';
  const label = over ? t('head.over') : reached ? t('head.reached') : t('head.left');

  return (
    <Card style={styles.card}>
      <View style={styles.figure}>
        <Text variant="callout" tone="muted">{label}</Text>
        <Money value={money(over ? standing.over : standing.left)} variant="amountHero" tone={reached ? 'danger' : 'default'} />
        {/* A month that is not the calendar's says which days it is, so its end is never a surprise. */}
        <Text variant="callout" tone="muted">{startDay === 1 ? left : `${left} · ${t('head.period', { from: day(period.start), to: day(period.end) })}`}</Text>
      </View>
      <ProgressBar value={standing.share} over={reached} near={standing.state === 'near'} accessibilityLabel={t('head.used')} />
      <View style={styles.stats}>
        <Stat label={t('head.spent')} value={money(spent)} />
        <Stat label={t('head.limit')} value={money(limit)} />
      </View>
      {/* Nothing left means nothing to share out over the days. */}
      {standing.left > 0 && month.daysLeft > 0 ? <Text variant="callout">{t('head.perDay', { amount: money(perDayLeft(standing.left, month.daysLeft)) })}</Text> : null}
    </Card>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.xl },
    figure: { gap: space.xs },
    stats: { flexDirection: 'row', gap: space.xl },
  });
