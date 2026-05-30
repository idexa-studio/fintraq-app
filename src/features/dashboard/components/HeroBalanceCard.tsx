import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  balance: number;
  currency: string;
  income: number;
  expense: number;
};

export const HeroBalanceCard = React.memo(function HeroBalanceCard({
  balance,
  currency,
  income,
  expense,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const incomeRatio = income + expense > 0 ? income / (income + expense) : 0.5;

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.labelRow}>
        <Text style={styles.label}>Total balance</Text>
        <StreakBadge />
      </View>

      <MoneyText amount={balance} currency={currency} style={styles.amount} weight="bold" />

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={styles.statBody}>
            <Text style={styles.statLabel}>INCOME</Text>
            <MoneyText amount={income} currency={currency} type="CR" weight="bold" style={styles.statValue} />
          </View>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statItem}>
          <View style={styles.statBody}>
            <Text style={styles.statLabel}>EXPENSES</Text>
            <MoneyText amount={expense} currency={currency} type="DR" weight="bold" style={styles.statValue} />
          </View>
        </View>
      </View>

      <View style={styles.flowBar}>
        <View style={[styles.flowIn, { flex: incomeRatio }]} />
        <View style={[styles.flowOut, { flex: 1 - incomeRatio }]} />
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('5'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('5'),
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: radius('full'),
      backgroundColor: colors.primary + '18',
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('1.5'),
    },
    label: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.5,
    },
    amount: {
      fontSize: 38,
      lineHeight: 42,
      letterSpacing: -1.5,
      marginBottom: spacing('5'),
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('3.5'),
    },
    statItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      minWidth: 0,
    },
    statBody: { flex: 1, minWidth: 0 },
    statLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 9,
      letterSpacing: 1.2,
      marginBottom: spacing('0.5'),
    },
    statValue: { fontSize: 15 },
    statSep: {
      width: 1,
      height: 34,
      backgroundColor: colors.text + '0C',
      marginHorizontal: spacing('4'),
    },
    flowBar: {
      flexDirection: 'row',
      height: 4,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: spacing('0.5'),
    },
    flowIn: { borderRadius: radius('full'), backgroundColor: colors.success },
    flowOut: { borderRadius: radius('full'), backgroundColor: colors.danger },
  });
