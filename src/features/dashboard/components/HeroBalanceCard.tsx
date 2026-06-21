import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CurrencyPickerTab } from './CurrencyPickerTab';
import { DashboardHeader } from './DashboardHeader';

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
  const { typography, colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useSettings();
  const { isPremium } = usePremium();
  const router = useRouter();

  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToSearch = useCallback(() => router.push('/search'), [router]);

  return (
    <View>
      <View style={styles.card}>
        <DashboardHeader
          name={profile.name}
          isPremium={isPremium}
          onSearch={isPremium ? navigateToSearch : navigateToPremium}
        />

        <View style={styles.header}>
          <Text style={[styles.label, { fontFamily: typography.fonts.medium }]}>
            Your balance
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
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} color={colors.success} />
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
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={colors.danger} />
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
      </View>

      <CurrencyPickerTab
        currencies={currencies || []}
        selectedCurrency={currency}
        onCurrencySelect={onCurrencySelect}
      />
    </View>
  );
});

const createStyles = ({ spacing, radius, layout, typography, colors }: ThemeContextType) =>
  StyleSheet.create({
    // ── Hero card
    card: {
      backgroundColor: colors.primary,
      padding: spacing('5'),
      paddingTop: spacing('7'),
      overflow: 'hidden',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing('2'),
    },
    label: {
      fontSize: 11,
      color: colors.text,
    },
    balance: {
      fontSize: 40,
      lineHeight: 46,
      color: colors.text,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('3')
    },
    statContainer: {
      flex: 1,
      paddingVertical: spacing('2.5'),
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
      color: colors.text,
    },
    statValue: {
      fontSize: 15,
      lineHeight: 18,
      color: colors.text,
    },
  });
