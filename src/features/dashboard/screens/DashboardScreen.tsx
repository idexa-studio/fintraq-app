import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { PremiumUpsellSheet } from '../components/PremiumUpsellSheet';
import { SectionHeader } from '../components/SectionHeader';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { useDashboardStats, useTopExpenseCategories } from '../hooks/dashboard';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();
  const router = useRouter();
  useSettings();

  const { data: transactions, isLoading: txLoading }    = useTransactions(6);
  const { data: accounts,    isLoading: accountsLoading } = useAccounts();

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
  const topExpenseCategories = useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

  const handleCurrencySelect  = useCallback((c: string) => setSelectedCurrency(c), []);
  const navigateToAccountTx   = useCallback((id: number) => router.push(`/transactions?accountId=${id}`), [router]);
  const navigateToAnalytics   = useCallback(() => router.push('/(main)/analytics'), [router]);
  const navigateToSettings    = useCallback(() => router.push('/settings'), [router]);
  const navigateToPremium     = useCallback(() => router.push('/premium'), [router]);
  const navigateToSearch      = useCallback(() => router.push('/search'), [router]);
  const navigateToTransactions = useCallback(() => router.push('/transactions'), [router]);
  const navigateToCreateTx    = useCallback(() => router.push('/transactions/create'), [router]);
  const navigateToEditTx      = useCallback((id: number) => router.push(`/transactions/edit/${id}`), [router]);
  const openAccountForm       = useCallback(() => router.push('/(main)/accounts/form'), [router]);
  const openAccountsScreen    = useCallback(() => router.push('/(main)/accounts'), [router]);

  const greeting  = useMemo(() => getGreeting(), []);
  const dateLabel = useMemo(() => todayLabel(), []);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <DashboardHeader
          greeting={greeting}
          dateLabel={dateLabel}
          isPremium={isPremium}
          onSearch={isPremium ? navigateToSearch : navigateToPremium}
          onAnalytics={navigateToAnalytics}
          onSettings={navigateToSettings}
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
              <TouchableOpacity
                key={c}
                style={[styles.currencyTab, c === selectedCurrency && styles.currencyTabActive]}
                onPress={() => handleCurrencySelect(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.currencyTabText, c === selectedCurrency && styles.currencyTabTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
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

        <SectionHeader title="Top expenses" rightText={selectedCurrency} />
        <TopExpenseCategoriesCard currency={selectedCurrency} categories={topExpenseCategories} />

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
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={navigateToCreateTx}>
                <Text style={styles.emptyActionText}>Add one now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={navigateToCreateTx} activeOpacity={0.9}>
        <Ionicons name="add" size={26} color={colors.background} />
      </TouchableOpacity>

      <PremiumUpsellSheet visible={showUpsell} onClose={dismissUpsell} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    content:   { paddingBottom: 110 },

    // ── Currency tabs
    currencyTabsWrap: { marginHorizontal: layout.screenPadding, marginBottom: spacing('4') },
    currencyTabs:     { flexDirection: 'row', gap: spacing('1') },
    currencyTab: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5') - 1,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    currencyTabActive:     { backgroundColor: colors.text },
    currencyTabText:       { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 11 },
    currencyTabTextActive: { color: colors.background },

    // ── Activity card
    activityCard: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
    },
    emptyActivity: { paddingVertical: spacing('8'), alignItems: 'center', gap: spacing('2') },
    emptyText:     { fontFamily: typography.fonts.regular, fontSize: 13, color: colors.textMuted },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 30,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      marginTop: spacing('1'),
    },
    emptyActionText: { fontFamily: typography.fonts.semibold, fontSize: 11, color: colors.background },

    // ── FAB
    fab: {
      position: 'absolute',
      bottom: layout.screenPadding,
      right: layout.screenPadding,
      width: 52,
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
