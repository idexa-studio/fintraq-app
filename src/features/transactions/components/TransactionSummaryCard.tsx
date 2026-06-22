import { MoneyText } from '@/src/components/ui/MoneyText';
import { CurrencyPickerTab } from '@/src/features/dashboard/components/CurrencyPickerTab';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  income: number;
  expense: number;
  currency: string | null;
  currencies: string[];
  onCurrencySelect: (currency: string) => void;
};

export const TransactionSummaryCard = React.memo(function TransactionSummaryCard({
  income,
  expense,
  currency,
  currencies,
  onCurrencySelect,
}: Props) {
  const theme = useTheme();
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cur = currency ?? undefined;
  const net = income - expense;
  const isPositive = net >= 0;

  return (
    <View style={[styles.card, { backgroundColor: heroCard.background }]}>
      <Text style={[styles.label, { color: heroCard.textMuted }]}>Net savings</Text>

      <MoneyText
        amount={Math.abs(net)}
        currency={cur}
        type={isPositive ? 'CR' : 'DR'}
        weight="bold"
        style={[styles.netAmount, { color: heroCard.textPrimary }]}
      />

      <View style={styles.stats}>
        <View style={[styles.statTile, { backgroundColor: heroCard.separator }]}>
          <View style={styles.statHeader}>
            <HugeiconsIcon icon={ArrowUp01Icon} size={13} color={heroCard.income} />
            <Text style={[styles.statLabel, { color: heroCard.textMuted }]}>Income</Text>
          </View>
          <MoneyText
            amount={income}
            currency={cur}
            type="CR"
            weight="semibold"
            style={[styles.statValue, { color: heroCard.textPrimary }]}
          />
        </View>

        <View style={[styles.statTile, { backgroundColor: heroCard.separator }]}>
          <View style={styles.statHeader}>
            <HugeiconsIcon icon={ArrowDown01Icon} size={13} color={heroCard.expense} />
            <Text style={[styles.statLabel, { color: heroCard.textMuted }]}>Expenses</Text>
          </View>
          <MoneyText
            amount={expense}
            currency={cur}
            type="DR"
            weight="semibold"
            style={[styles.statValue, { color: heroCard.textPrimary }]}
          />
        </View>
      </View>

      <CurrencyPickerTab
        currencies={currencies}
        selectedCurrency={currency ?? ''}
        onCurrencySelect={onCurrencySelect}
        heroCard={heroCard}
      />
    </View>
  );
});

const createStyles = ({ spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      paddingBottom: spacing('3'),
    },
    label: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      marginBottom: spacing('1'),
    },
    netAmount: {
      fontSize: 36,
      lineHeight: 42,
      marginBottom: spacing('4'),
    },
    stats: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    statTile: {
      flex: 1,
      borderRadius: radius('lg'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      gap: spacing('0.5'),
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.fonts.regular,
    },
    statValue: {
      fontSize: typography.sizes.lg,
      lineHeight: 20,
    },
  });
