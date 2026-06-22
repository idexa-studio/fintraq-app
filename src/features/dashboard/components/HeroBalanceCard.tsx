import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
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
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);
  const { profile } = useSettings();
  const { isPremium } = usePremium();
  const router = useRouter();

  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToSearch = useCallback(() => router.push('/search'), [router]);

  return (
    <View style={[styles.card, { backgroundColor: heroCard.background }]}>
      <DashboardHeader
        name={profile.name}
        isPremium={isPremium}
        onSearch={isPremium ? navigateToSearch : navigateToPremium}
        heroCard={heroCard}
      />

      <View style={styles.header}>
        <Text style={styles.label}>
          Your balance
        </Text>
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

const createStyles = ({ spacing, radius, typography }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    // ── Hero card
    card: {
      backgroundColor: heroCard.background,
      padding: spacing('5'),
      paddingTop: spacing('7'),
      paddingBottom: spacing('5'),
      borderBottomLeftRadius: radius('2xl'),
      borderBottomRightRadius: radius('2xl'),
      overflow: 'hidden',
      position: 'relative',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing('2'),
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
      marginTop: spacing('4'), // Beautiful vertical gap between balance and stats
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
