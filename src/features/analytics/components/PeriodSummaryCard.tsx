import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { MoneyText, Text, TrendBadge } from '@/src/components/ui';
import type { Totals } from '@/src/utils/analytics';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  totals: Totals;
  deltas: { income: number | null; expense: number | null };
  currency: string;
};

/** The period in one card: net up top, income and expense (each against the previous period) below. */
export const PeriodSummaryCard = React.memo(function PeriodSummaryCard({ totals, deltas, currency }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const columns = [
    { key: 'income', label: t('analytics.income'), amount: totals.income, type: 'CR' as const, delta: deltas.income, positiveIsGood: true },
    { key: 'expense', label: t('analytics.expenses'), amount: totals.expense, type: 'DR' as const, delta: deltas.expense, positiveIsGood: false },
  ];

  return (
    <View style={styles.card}>
      <Text variant="label" tone="muted">
        {t('analytics.netPosition')}
      </Text>
      <MoneyText
        amount={Math.abs(totals.net)}
        currency={currency}
        type={totals.net >= 0 ? 'CR' : 'DR'}
        weight="bold"
        style={styles.net}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      />
      <View style={styles.columns}>
        {columns.map((c, i) => (
          <View key={c.key} style={[styles.column, i > 0 && styles.columnDivider]}>
            <Text variant="micro" tone="muted">
              {c.label}
            </Text>
            <MoneyText amount={c.amount} currency={currency} type={c.type} weight="semibold" compact style={styles.columnValue} numberOfLines={1} />
            <TrendBadge delta={c.delta} positiveIsGood={c.positiveIsGood} />
          </View>
        ))}
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('1') },
    net: { ...typography.metrics.xxxl },
    columns: {
      flexDirection: 'row',
      marginTop: spacing('3'),
      paddingTop: spacing('3'),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: alpha(colors.text, 'subtle'),
    },
    column: { flex: 1, gap: spacing('1') },
    columnDivider: { paddingLeft: spacing('4'), borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: alpha(colors.text, 'subtle') },
    columnValue: typography.metrics.lg,
  });
