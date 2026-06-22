import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CurrencyPickerTab } from './CurrencyPickerTab';

type Props = {
  balance: number;
  currency: string;
  income: number;
  expense: number;
  currencies?: string[];
  onCurrencySelect?: (currency: string) => void;
};

export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, income, expense, currencies, onCurrencySelect }: Props) {
  const theme = useTheme();
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Your balance</Text>
        <StreakBadge heroCard={heroCard} />
      </View>

      <MoneyText
        amount={balance}
        currency={currency}
        style={styles.balance}
        weight="bold"
      />

      <View style={styles.stats}>
        <View style={styles.statContainer}>
          <View style={styles.statHeader}>
            <HugeiconsIcon icon={ArrowUp01Icon} size={14} color={heroCard.income} />
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <MoneyText
            amount={income}
            currency={currency}
            type="CR"
            weight="semibold"
            style={styles.statValue}
          />
        </View>

        <View style={styles.statContainer}>
          <View style={styles.statHeader}>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={heroCard.expense} />
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <MoneyText
            amount={expense}
            currency={currency}
            type="DR"
            weight="semibold"
            style={styles.statValue}
          />
        </View>
      </View>

      <CurrencyPickerTab
        currencies={currencies || []}
        selectedCurrency={currency}
        onCurrencySelect={onCurrencySelect}
        heroCard={heroCard}
      />
    </View>
  );
});

const createStyles = ({ spacing, radius, layout, typography }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      paddingBottom: spacing('5'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('1'),
    },
    label: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.fonts.medium,
      color: heroCard.textMuted,
    },
    balance: {
      fontSize: 40,
      lineHeight: 46,
      color: heroCard.textPrimary,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginTop: spacing('4'),
      marginBottom: spacing('1'),
    },
    statContainer: {
      flex: 1,
      backgroundColor: heroCard.separator,
      paddingVertical: spacing('2'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
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
      color: heroCard.textMuted,
    },
    statValue: {
      fontSize: typography.sizes.md,
      lineHeight: 18,
      color: heroCard.textPrimary,
    },
  });
