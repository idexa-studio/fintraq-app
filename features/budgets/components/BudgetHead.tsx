import { Card, Money, Ring, Stat, Text, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { budgetStanding, monthProgress, projectedSpend } from '@/features/budgets/budget-rules';
import type { BudgetView } from '@/features/budgets/budget-view';
import { useDialColor } from '@/features/budgets/components/BudgetList';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * The top of a budget's screen, as the dial from the Plan tab drawn large: what is left in the
 * middle of the ring, the mark for today on it, the limit and what is spent beneath, and one line
 * for where the month ends at the pace so far.
 */
export function BudgetHead({ budget, today }: { budget: BudgetView; today: Date }) {
  const { t } = useTranslation('budgets');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const { currency, limit, spent } = budget;
  const standing = budgetStanding(spent, limit);
  const fill = useDialColor(standing.state);
  const month = monthProgress(today);
  const projected = projectedSpend(spent, month.elapsed);
  const money = (amount: number) => formatCurrency(amount, currency);
  const over = standing.over > 0;
  const reached = standing.state === 'over';
  const label = over ? t('head.over') : reached ? t('head.reached') : t('head.left');

  return (
    <Card style={styles.card}>
      <View style={styles.centre}>
        <Ring size={size.ring} total={Math.max(limit, 1)} segments={[{ value: Math.min(Math.max(spent, 0), Math.max(limit, 1)), color: fill }]} marker={month.elapsed} accessibilityLabel={t('head.pace')}>
          <Text variant="callout" tone="muted">{label}</Text>
          <Money value={money(over ? standing.over : standing.left)} variant="amountLarge" tone={reached ? 'danger' : 'default'} />
          <Text variant="caption" tone="muted">{month.daysLeft > 0 ? t('head.daysLeft', { count: month.daysLeft }) : t('head.lastDay')}</Text>
        </Ring>
      </View>
      <View style={styles.stats}>
        <Stat label={t('head.spent')} value={money(spent)} />
        <Stat label={t('head.limit')} value={money(limit)} />
      </View>
      {/* A month already over its limit has nothing left to forecast. */}
      {reached || month.daysLeft === 0 || limit <= 0 ? null : (
        <Text variant="callout">{projected > limit ? t('head.paceOver', { amount: money(projected - limit) }) : t('head.paceUnder', { amount: money(limit - projected) })}</Text>
      )}
      <Text variant="callout" tone="muted">{t('head.reading')}</Text>
    </Card>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.xl },
    centre: { alignItems: 'center' },
    stats: { flexDirection: 'row', justifyContent: 'space-around', gap: space.xl },
  });
