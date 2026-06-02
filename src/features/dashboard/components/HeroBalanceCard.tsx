import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  balance: number;
  currency: string;
  income: number;
  expense: number;
};

export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, income, expense }: Props) {
  const theme = useTheme();
  const { typography, heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.deco} pointerEvents="none" />

      <View style={styles.header}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold }]}>
          Total balance
        </Text>
        <StreakBadge />
      </View>

      <MoneyText
        amount={balance}
        currency={currency}
        style={styles.balance}
        weight="bold"
      />

      <View style={styles.sep} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons name="arrow-up-circle" size={12} color={heroCard.income} />
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Income</Text>
          </View>
          <MoneyText
            amount={income}
            currency={currency}
            type="CR"
            weight="bold"
            style={[styles.statValue, { color: heroCard.income }]}
          />
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons name="arrow-down-circle" size={12} color={heroCard.expense} />
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Expenses</Text>
          </View>
          <MoneyText
            amount={expense}
            currency={currency}
            type="DR"
            weight="bold"
            style={[styles.statValue, { color: heroCard.expense }]}
          />
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ heroCard, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      borderRadius: radius('2xl'),
      backgroundColor: heroCard.background,
      padding: spacing('5'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
    deco: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: heroCard.decoOverlay,
      top: -100,
      right: -80,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
      color: heroCard.textMuted,
      letterSpacing: 0.3,
    },
    balance: {
      fontSize: 46,
      lineHeight: 52,
      letterSpacing: -1.5,
      color: heroCard.textPrimary,
    },
    sep: {
      height: 1,
      backgroundColor: heroCard.separator,
      marginVertical: -spacing('1'),
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
    },
    stat: {
      flex: 1,
      gap: spacing('1'),
    },
    statLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontSize: 10,
      color: heroCard.textMuted,
    },
    statValue: {
      fontSize: 16,
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: heroCard.separator,
    },
  });
