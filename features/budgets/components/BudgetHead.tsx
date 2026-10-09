import { Card, Money, PaceBar, Stat, Text, useStyles } from '@/design';
import type { Theme } from '@/design';
import { budgetStanding, monthProgress, projectedSpend } from '@/features/budgets/budget-rules';
import type { BudgetView } from '@/features/budgets/budget-view';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * The top of a budget's screen: what is left as the one large figure, the limit and what is spent
 * beside it, and the month on one line with where it is heading at the pace so far.
 */
export function BudgetHead({ budget, today }: { budget: BudgetView; today: Date }) {
  const { t } = useTranslation('budgets');
  const styles = useStyles(createStyles);
  const { currency, limit, spent } = budget;
  const standing = budgetStanding(spent, limit);
  const month = monthProgress(today);
  const projected = projectedSpend(spent, month.elapsed);
  const money = (amount: number) => formatCurrency(amount, currency);
  const over = standing.over > 0;
  const reached = standing.state === 'over';

  return (
    <Card style={styles.card}>
      <View style={styles.figure}>
        <Text variant="callout" tone="muted">{over ? t('head.over') : reached ? t('head.reached') : t('head.left')}</Text>
        <Money value={money(over ? standing.over : standing.left)} variant="amountHero" tone={reached ? 'danger' : 'default'} />
        <Text variant="callout" tone="muted">{month.daysLeft > 0 ? t('head.daysLeft', { count: month.daysLeft }) : t('head.lastDay')}</Text>
      </View>
      <View style={styles.stats}>
        <Stat label={t('head.spent')} value={money(spent)} />
        <Stat label={t('head.limit')} value={money(limit)} />
      </View>
      {limit > 0 ? (
        <View style={styles.pace}>
          <PaceBar spent={spent / limit} projected={projected / limit} today={month.elapsed} startLabel={money(0)} endLabel={money(limit)} todayLabel={t('head.today')} accessibilityLabel={t('head.pace')} />
          {/* A month already over its limit has nothing left to forecast. */}
          {reached || month.daysLeft === 0 ? null : (
            <Text variant="callout">{projected > limit ? t('head.paceOver', { amount: money(projected - limit) }) : t('head.paceUnder', { amount: money(limit - projected) })}</Text>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.xl },
    figure: { gap: space.xs },
    stats: { flexDirection: 'row', gap: space.xl },
    pace: { gap: space.md },
  });
