import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { Down, Up } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { typography, heroCard, colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useSettings();
  const { isPremium } = usePremium();
  const router = useRouter();

  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToSearch = useCallback(() => router.push('/search'), [router]);

  return (
    <View>

      <View style={styles.card}>
        {/* Currency tabs */}


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
              <HugeiconsIcon icon={Up} size={14} color={colors.text} />
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <MoneyText
              amount={income}
              currency={currency}
              type="CR"
              weight="semibold"
              style={[styles.statValue]}
            />
          </View>

          <View style={styles.statContainer}>
            <View style={styles.statHeader}>
              <HugeiconsIcon icon={Down} size={14} color={colors.text} />
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <MoneyText
              amount={expense}
              currency={currency}
              type="DR"
              weight="semibold"
              style={[styles.statValue]}
            />
          </View>
        </View>
      </View>
      {currencies && currencies.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.currencyTabs}
          style={styles.currencyTabsWrap}
        >
          {currencies.map(c => (
            <BentoPressable
              key={c}
              style={[styles.currencyTab, c === currency && styles.currencyTabActive]}
              onPress={() => onCurrencySelect?.(c)}
            >
              <Text style={[styles.currencyTabText, c === currency && styles.currencyTabTextActive]}>
                {c}
              </Text>
            </BentoPressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

const createStyles = ({ heroCard, spacing, radius, layout, typography, colors }: ThemeContextType) =>
  StyleSheet.create({

    // ── Currency tabs
    currencyTabsWrap: { marginHorizontal: layout.screenPadding, marginBottom: spacing('2'), },
    currencyTabs: { flexDirection: 'row' },
    currencyTab: {
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('1.5'),
      borderBottomLeftRadius: radius('lg'),
      borderBottomRightRadius: radius('lg'),
    },
    currencyTabActive: { backgroundColor: colors.primary },
    currencyTabText: { fontFamily: typography.fonts.medium, color: colors.textMuted, fontSize: 12 },
    currencyTabTextActive: { color: colors.text, fontFamily: typography.fonts.semibold },

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
