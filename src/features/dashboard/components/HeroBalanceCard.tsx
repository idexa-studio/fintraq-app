import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <View style={styles.deco2} pointerEvents="none" />

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

      <View style={styles.stats}>
        <View style={styles.statContainer}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="arrow-up" size={14} color={heroCard.income} />
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <MoneyText
            amount={income}
            currency={currency}
            type="CR"
            weight="bold"
            style={[styles.statValue, { color: heroCard.income }]}
          />
        </View>

        <View style={styles.statContainer}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="arrow-down" size={14} color={heroCard.expense} />
            <Text style={styles.statLabel}>Expenses</Text>
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

const createStyles = ({ heroCard, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      borderRadius: radius('2xl'),
      backgroundColor: heroCard.background,
      padding: spacing('5'),
      gap: spacing('5'),
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
    deco2: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: heroCard.decoOverlay,
      bottom: -60,
      left: -40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
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
    },
    statContainer: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.045)',
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3.5'),
      borderRadius: radius('lg'),
      gap: spacing('1'),
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontSize: 11,
      fontFamily: typography.fonts.regular,
      color: heroCard.textMuted,
    },
    statValue: {
      fontSize: 15,
      lineHeight: 18,
    },
  });
