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

export const HeroBalanceCard = React.memo(function HeroBalanceCard({
  balance,
  currency,
  income,
  expense,
}: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const incomeRatio = income + expense > 0 ? income / (income + expense) : 0.5;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '06', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
            Total balance
          </Text>
          <StreakBadge />
        </View>

        <MoneyText amount={balance} currency={currency} style={styles.balance} weight="bold" />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Income
            </Text>
            <MoneyText amount={income} currency={currency} type="CR" weight="bold" style={styles.statValue} />
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.text + '0C' }]} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Expenses
            </Text>
            <MoneyText amount={expense} currency={currency} type="DR" weight="bold" style={styles.statValue} />
          </View>
        </View>

        <View style={styles.flow}>
          <View style={[styles.flowBar, { flex: incomeRatio, backgroundColor: colors.success }]} />
          <View style={[styles.flowBar, { flex: 1 - incomeRatio, backgroundColor: colors.danger }]} />
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
    },
    content: {
      padding: spacing('5'),
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('2'),
    },
    label: {
      fontSize: 10,
    },
    balance: {
      fontSize: 40,
      lineHeight: 44,
      marginBottom: spacing('5'),
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('4'),
    },
    stat: {
      flex: 1,
      gap: spacing('1'),
    },
    statDivider: {
      width: 1,
      height: 32,
      marginHorizontal: spacing('4'),
    },
    statLabel: {
      fontSize: 9,
      opacity: 0.6,
    },
    statValue: {
      fontSize: 16,
    },
    flow: {
      flexDirection: 'row',
      height: 4,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: 1,
    },
    flowBar: {
      borderRadius: radius('full'),
    },
  });
