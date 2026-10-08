import { Card, ProgressBar, Skeleton, Stat, Text, useTheme } from '@/design';
import { useMonthTotals } from '@/features/home/hooks/summaries';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** This month in one currency: what came in, what went out, and how much of it is left. */
export function MonthCard({ currency }: { currency: string }) {
  const { t } = useTranslation('home');
  const { space, type } = useTheme();
  const { data, isPending } = useMonthTotals(currency);

  if (isPending || !data) {
    return (
      <Card style={{ gap: space.lg }}>
        <Skeleton height={type.amountLarge.lineHeight + type.callout.lineHeight} />
        <Skeleton height={type.callout.lineHeight} width="60%" />
      </Card>
    );
  }

  const { income, expense } = data;
  const share = income > 0 ? expense / income : expense > 0 ? 1 : 0;
  const line =
    income === 0 && expense === 0 ? t('month.nothing')
    : income === 0 ? t('month.onlySpending')
    : expense > income ? t('month.spentMore')
    : expense === income ? t('month.spentAll')
    : t('month.kept', { percent: Math.round((1 - share) * 100) });

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', gap: space.lg }}>
        <Stat label={t('month.moneyIn')} value={formatCurrency(income, currency)} tone="positive" />
        <Stat label={t('month.moneyOut')} value={formatCurrency(expense, currency)} />
      </View>
      <View style={{ gap: space.sm }}>
        <ProgressBar value={share} over={expense > income && income > 0} accessibilityLabel={t('month.progress')} />
        <Text variant="callout" tone="muted">{line}</Text>
      </View>
    </Card>
  );
}
