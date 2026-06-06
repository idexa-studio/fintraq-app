import { usePremium } from '@/src/providers/PremiumProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { PageBackground } from '../../../components/ui/PageBackground';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { AccountsCarousel } from '../components/AccountsCarousel';
import { DashboardHeader } from '../components/DashboardHeader';
import { HeroBalanceCard } from '../components/HeroBalanceCard';
import { InsightsSection } from '../components/InsightsSection';
import { PremiumUpsellBottomSheet } from '../components/PremiumUpsellBottomSheet';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { TopPersonsCard } from '../components/TopPersonsCard';
import { useDashboardPersons, useDashboardStats, useTopExpenseCategories } from '../hooks/dashboard';
import { WalkthroughOverlay, DASHBOARD_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();
  const router = useRouter();
  const { profile } = useSettings();

  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const [showUpsell, setShowUpsell] = React.useState(false);
  const UPSELL_KEY = '@luno/upsell_dismissed_at';
  const UPSELL_TTL = 3 * 24 * 60 * 60 * 1000;

  React.useEffect(() => {
    if (isPremium) return;
    AsyncStorage.getItem(UPSELL_KEY).then(val => {
      if (!val || Date.now() - parseInt(val, 10) > UPSELL_TTL) setShowUpsell(true);
    });
  }, [isPremium]);

  const dismissUpsell = useCallback(() => {
    setShowUpsell(false);
    AsyncStorage.setItem(UPSELL_KEY, String(Date.now()));
  }, []);

  const balancesByCurrency = useMemo(() =>
    accounts?.reduce((acc, a) => {
      acc[a.currency] = (acc[a.currency] || 0) + a.balance;
      return acc;
    }, {} as Record<string, number>) ?? {},
    [accounts],
  );

  const currencyKeys = useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [balancesByCurrency]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) setSelectedCurrency(currencyKeys[0]);
  }, [currencyKeys, selectedCurrency]);

  const { data: statsData } = useDashboardStats(selectedCurrency);
  const totals = useMemo(() => statsData ?? { income: 0, expense: 0 }, [statsData]);

  const { data: topCategoriesData } = useTopExpenseCategories(selectedCurrency);
  const { data: topPersonsData } = useDashboardPersons(selectedCurrency);
  const topExpenseCategories = useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const navigateToAccountTx = useCallback((id: number) => router.push(`/transactions?accountId=${id}`), [router]);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToSearch = useCallback(() => router.push('/search'), [router]);
  const navigateToTransactions = useCallback(() => router.push('/transactions'), [router]);
  const navigateToCreateTx = useCallback(() => router.push('/transactions/create'), [router]);
  const navigateToEditTx = useCallback((id: number) => router.push(`/transactions/edit/${id}`), [router]);
  const openAccountForm = useCallback(() => router.push('/(main)/accounts/form'), [router]);
  const openAccountsScreen = useCallback(() => router.push('/accounts'), [router]);


  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <DashboardHeader
          name={profile.name}
          isPremium={isPremium}
          onSearch={isPremium ? navigateToSearch : navigateToPremium}
        />

        {/* Currency tabs */}
        {currencyKeys.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencyTabs}
            style={styles.currencyTabsWrap}
          >
            {currencyKeys.map(c => (
              <BentoPressable
                key={c}
                style={[styles.currencyTab, c === selectedCurrency && styles.currencyTabActive]}
                onPress={() => handleCurrencySelect(c)}
              >
                <Text style={[styles.currencyTabText, c === selectedCurrency && styles.currencyTabTextActive]}>
                  {c}
                </Text>
              </BentoPressable>
            ))}
          </ScrollView>
        )}

        <HeroBalanceCard
          balance={balancesByCurrency[selectedCurrency] || 0}
          currency={selectedCurrency}
          income={totals.income}
          expense={totals.expense}
        />

        <SectionHeader title="Accounts" rightText="Manage" onPressRight={openAccountsScreen} />
        <AccountsCarousel
          accounts={accounts ?? []}
          onPressAccount={navigateToAccountTx}
          onPressAdd={openAccountForm}
        />

        <InsightsSection currency={selectedCurrency} />

        <SectionHeader title="Top expenses" />
        <TopExpenseCategoriesCard currency={selectedCurrency} categories={topExpenseCategories} />

        {topPersonsData && topPersonsData.length > 0 && (
          <>
            <SectionHeader title="Persons" rightText="See all" onPressRight={() => router.push('/persons')} />
            <TopPersonsCard currency={selectedCurrency} persons={topPersonsData} onPressPerson={(id) => router.push(`/persons/${id}`)} />
          </>
        )}

        <SectionHeader title="Recent" rightText="See all" onPressRight={navigateToTransactions} />
        <View style={styles.activityCard}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 6).map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === Math.min(transactions.length, 6) - 1}
                showDate
                onPress={() => navigateToEditTx(tx.id)}
              />
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons name="receipt-text-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start recording your daily payments, income, or transfers here.</Text>
              <BentoPressable style={styles.emptyAction} onPress={navigateToCreateTx}>
                <Text style={styles.emptyActionText}>Add transaction</Text>
                <MaterialCommunityIcons name="arrow-right" size={12} color={colors.background} />
              </BentoPressable>
            </View>
          )}
        </View>

      </ScrollView>

      <BentoPressable style={styles.fab} onPress={navigateToCreateTx}>
        <MaterialCommunityIcons name="plus" size={26} color={colors.background} />
      </BentoPressable>

      <WalkthroughOverlay storageKey="@luno_walkthrough_dashboard" steps={DASHBOARD_WALKTHROUGH_STEPS} />
      <PremiumUpsellBottomSheet visible={showUpsell && !isPremium} onClose={dismissUpsell} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    content: { paddingBottom: 100 },

    // ── Currency tabs
    currencyTabsWrap: { marginHorizontal: layout.screenPadding, marginBottom: spacing('4') },
    currencyTabs: { flexDirection: 'row', gap: spacing('2') },
    currencyTab: {
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
    },
    currencyTabActive: { backgroundColor: colors.primary + '15' },
    currencyTabText: { fontFamily: typography.fonts.medium, color: colors.textMuted, fontSize: 12 },
    currencyTabTextActive: { color: colors.primary },

    // ── Activity card
    activityCard: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
    },
    emptyActivity: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('7'),
      paddingHorizontal: spacing('4'),
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    emptyIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('1'),
    },
    emptyTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    emptySubtext: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 240,
      lineHeight: 16,
      marginBottom: spacing('1.5'),
    },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 36,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
    },
    emptyActionText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.background,
    },

    // ── FAB
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
