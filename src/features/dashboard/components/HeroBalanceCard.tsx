import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CARD_BG    = '#13131A';
const CARD_TEXT  = '#FFFFFF';
const CARD_MUTED = 'rgba(255,255,255,0.40)';

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
        colors={[colors.primary + '22', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Upper: label + balance + flow bar */}
      <View style={styles.upper}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontFamily: typography.fonts.semibold }]}>
            TOTAL BALANCE
          </Text>
          <StreakBadge />
        </View>

        <MoneyText amount={balance} currency={currency} style={styles.balance} weight="bold" />

        <View style={styles.flowTrack}>
          <View style={[styles.flowSeg, { flex: incomeRatio, backgroundColor: colors.success }]} />
          <View style={[styles.flowSeg, { flex: 1 - incomeRatio, backgroundColor: colors.danger }]} />
        </View>
      </View>

      {/* Lower: income / expense stat boxes */}
      <View style={styles.lower}>
        <View style={[styles.statBox, { backgroundColor: colors.success + '1A' }]}>
          <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.success + 'BB' }]}>
            Income
          </Text>
          <MoneyText amount={income} currency={currency} type="CR" weight="bold" style={styles.statValue} />
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.danger + '1A' }]}>
          <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.danger + 'BB' }]}>
            Expenses
          </Text>
          <MoneyText amount={expense} currency={currency} type="DR" weight="bold" style={styles.statValue} />
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: CARD_BG,
      overflow: 'hidden',
    },

    upper: {
      padding: spacing('4'),
      paddingBottom: spacing('3'),
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('2'),
    },
    label: {
      fontSize: 9,
      color: CARD_MUTED,
      letterSpacing: 1.2,
    },
    balance: {
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: -1.2,
      color: CARD_TEXT,
      marginBottom: spacing('3'),
    },
    flowTrack: {
      flexDirection: 'row',
      height: 3,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: 2,
    },
    flowSeg: {
      borderRadius: radius('full'),
    },

    lower: {
      flexDirection: 'row',
      gap: spacing('2'),
      padding: spacing('2'),
      paddingTop: spacing('2'),
    },
    statBox: {
      flex: 1,
      borderRadius: radius('lg'),
      padding: spacing('3'),
      gap: spacing('0.5'),
    },
    statLabel: {
      fontSize: 9,
      letterSpacing: 0.3,
    },
    statValue: {
      fontSize: 14,
    },
  });
