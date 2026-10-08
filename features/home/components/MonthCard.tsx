import { Card, Ring, Skeleton, Stat, Text, useTheme } from '@/design';
import { monthShape } from '@/features/home/home-rules';
import { useMonthTotals } from '@/features/home/hooks/summaries';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** This month in one currency, as a ring: what came in, what went out, and how much of it is left. */
export function MonthCard({ currency }: { currency: string }) {
  const { t } = useTranslation('home');
  const { colors, size, space, type } = useTheme();
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
  const shape = monthShape(income, expense);
  const line = shape.reading === 'kept' ? t('month.kept', { percent: shape.keptPercent }) : t(`month.${shape.reading}`);

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
        {/* The month as one ring: what went out in ink, what is left of what came in in green. */}
        <Ring
          size={size.illustrationTile * 1.75}
          thickness={space.md}
          total={shape.whole}
          segments={[{ value: shape.spent, color: shape.reading === 'spentMore' ? colors.danger : colors.text }, { value: shape.kept, color: colors.brand }]}
          accessibilityLabel={line}
        >
          {shape.reading === 'kept' ? (
            <>
              <Text variant="amountLarge">{`${shape.keptPercent}%`}</Text>
              <Text variant="caption" tone="muted">{t('month.keptLabel')}</Text>
            </>
          ) : null}
        </Ring>
        <View style={{ flex: 1, gap: space.md }}>
          <Stat label={t('month.moneyIn')} value={formatCurrency(income, currency)} tone="positive" />
          <Stat label={t('month.moneyOut')} value={formatCurrency(expense, currency)} />
        </View>
      </View>
      <Text variant="callout" tone="muted">{line}</Text>
    </Card>
  );
}
