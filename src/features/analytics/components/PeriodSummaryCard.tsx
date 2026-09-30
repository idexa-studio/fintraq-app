import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { MoneyText, StatColumn, StatColumns, Text } from '@/src/components/ui';
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

  const columns: StatColumn[] = [
    { key: 'income', label: t('analytics.income'), amount: totals.income, currency, type: 'CR', delta: deltas.income, positiveIsGood: true },
    { key: 'expense', label: t('analytics.expenses'), amount: totals.expense, currency, type: 'DR', delta: deltas.expense, positiveIsGood: false },
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
        <StatColumns columns={columns} />
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('1') },
    net: { ...typography.metrics.xxxl },
    columns: { marginTop: spacing('3') },
  });
