import { Card, EmptyState, IconCircle, PASTELS, Ring, Stat, Text, resolveIcon, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { budgetStanding, monthProgress } from '@/features/budgets/budget-rules';
import type { BudgetStanding } from '@/features/budgets/budget-rules';
import type { BudgetView } from '@/features/budgets/budget-view';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type BudgetListProps = {
  budgets: readonly BudgetView[];
  today: Date;
  onOpen: (id: number) => void;
  onAdd: () => void;
};

/** The month's budgets, each as a dial, or the invitation to set the first one. */
export function BudgetList({ budgets, today, onOpen, onAdd }: BudgetListProps) {
  const { t } = useTranslation('budgets');
  const styles = useStyles(createStyles);
  if (budgets.length === 0) {
    return <EmptyState compact icon="pie-chart" color="teal" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={onAdd} />;
  }
  return (
    <View style={styles.list}>
      {budgets.map((budget) => <BudgetCard key={budget.id} budget={budget} today={today} onPress={() => onOpen(budget.id)} />)}
    </View>
  );
}

/**
 * The colour a budget's ring is filled in: green with room, the palette's orange in the last
 * fifth, red at the limit. The orange is the pastel, as on Insights' ring: the warning colour is
 * made for text and reads as brown at a ring's width.
 */
export function useDialColor(state: BudgetStanding['state']): string {
  const { colors } = useTheme();
  return state === 'over' ? colors.danger : state === 'near' ? PASTELS.orange : colors.brand;
}

/**
 * One budget as a dial: the ring fills with what is spent, and the mark on it is today, so a fill
 * that is behind the mark is a month going to plan. The category's own mark sits in the middle.
 */
export function BudgetCard({ budget, today, onPress }: { budget: BudgetView; today: Date; onPress?: () => void }) {
  const { t } = useTranslation('budgets');
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  const { category, currency, limit, spent } = budget;
  const standing = budgetStanding(spent, limit);
  const fill = useDialColor(standing.state);
  const money = (amount: number) => formatCurrency(amount, currency);
  const name = category?.name ?? t('overall');
  const over = standing.over > 0;
  const figure = over ? t('row.over', { amount: money(standing.over) }) : standing.state === 'over' ? t('row.reached') : t('row.left', { amount: money(standing.left) });
  const detail = t('row.of', { spent: money(spent), limit: money(limit) });

  return (
    <Card onPress={onPress} accessibilityLabel={`${name}, ${figure}, ${detail}`}>
      <View style={styles.row}>
        <Ring size={size.ringSmall} thickness={space.sm} total={Math.max(limit, 1)} segments={[{ value: Math.min(Math.max(spent, 0), Math.max(limit, 1)), color: fill }]} marker={monthProgress(today).elapsed} accessibilityLabel={detail}>
          {category ? <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} size={size.iconCircleLarge} /> : <IconCircle icon="pie-chart" color="teal" size={size.iconCircleLarge} />}
        </Ring>
        <View style={styles.text}>
          <Text variant="bodyStrong" numberOfLines={1}>{name}</Text>
          <Stat label={over ? t('card.over') : t('card.left')} value={money(over ? standing.over : standing.left)} tone={standing.state === 'over' ? 'danger' : 'default'} />
          <Text variant="callout" tone="muted" numberOfLines={1}>{detail}</Text>
        </View>
      </View>
    </Card>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    list: { gap: size.cardGap },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
    text: { flex: 1, gap: space.xs },
  });
