import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CARD_BG    = '#1D1D28';
const CARD_TEXT  = '#FFFFFF';
const CARD_MUTED = 'rgba(255,255,255,0.40)';
const CARD_SEP   = 'rgba(255,255,255,0.08)';

type Props = {
  balance: number;
  currency: string;
  income: number;
  expense: number;
};

export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, income, expense }: Props) {
  const theme = useTheme();
  const { typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold }]}>
          TOTAL BALANCE
        </Text>
        <StreakBadge />
      </View>

      <MoneyText amount={balance} currency={currency} style={styles.balance} weight="bold" />

      <View style={styles.sep} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Income</Text>
          <MoneyText amount={income} currency={currency} type="CR" weight="bold" style={styles.statValue} />
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold }]}>Expenses</Text>
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
      padding: spacing('5'),
      gap: spacing('4'),
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 9,
      color: CARD_MUTED,
      letterSpacing: 1.5,
    },

    balance: {
      fontSize: 46,
      lineHeight: 52,
      letterSpacing: -1.5,
      color: CARD_TEXT,
    },

    sep: {
      height: 1,
      backgroundColor: CARD_SEP,
      marginVertical: -spacing('1'),
    },

    stats: {
      flexDirection: 'row',
      gap: spacing('7'),
    },
    stat: {
      gap: spacing('0.5'),
    },
    statLabel: {
      fontSize: 10,
      color: CARD_MUTED,
    },
    statValue: {
      fontSize: 16,
    },
  });
