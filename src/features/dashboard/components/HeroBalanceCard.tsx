import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const incomeRatio = income + expense > 0 ? income / (income + expense) : 0.5;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[colors.primary + '22', colors.primary + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold }]}>Total balance</Text>
        <StreakBadge />
      </View>

      <MoneyText amount={balance} currency={currency} style={styles.balance} weight="bold" />

      <View style={styles.flowTrack}>
        <View style={[styles.flowSeg, { flex: incomeRatio, backgroundColor: colors.success }]} />
        <View style={[styles.flowSeg, { flex: 1 - incomeRatio, backgroundColor: colors.danger }]} />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <View>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Income</Text>
            <MoneyText amount={income} currency={currency} type="CR" weight="bold" style={styles.statValue} />
          </View>
        </View>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Expenses</Text>
            <MoneyText amount={expense} currency={currency} type="DR" weight="bold" style={styles.statValue} />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      padding: spacing('5'),
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('2'),
    },
    label: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    balance: {
      fontSize: 44,
      lineHeight: 50,
      letterSpacing: -1.5,
      marginBottom: spacing('4'),
    },
    flowTrack: {
      flexDirection: 'row',
      height: 6,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: 2,
      marginBottom: spacing('4'),
    },
    flowSeg: {
      borderRadius: radius('full'),
    },
    stats: {
      flexDirection: 'row',
      gap: spacing('6'),
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing('2'),
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radius('full'),
      marginTop: 4,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textMuted,
      opacity: 0.7,
      marginBottom: spacing('0.5'),
    },
    statValue: {
      fontSize: 15,
    },
  });
