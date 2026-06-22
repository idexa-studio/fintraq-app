import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { DASHBOARD_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { useAppConfig } from '@/src/providers/AppConfigProvider';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ArrowRight01Icon, ReceiptTextIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageBackground } from '../../../components/ui/PageBackground';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { StorageKeys } from '../../../constants/keys';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { AccountsCarousel } from '../components/AccountsCarousel';
import { DashboardHeader } from '../components/DashboardHeader';
import { HeroBalanceCard } from '../components/HeroBalanceCard';
import { InsightsSection } from '../components/InsightsSection';
import { PremiumUpsellBottomSheet } from '../components/PremiumUpsellBottomSheet';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { TopPersonsCard } from '../components/TopPersonsCard';
import { useDashboardPersons, useDashboardStats, useTopExpenseCategories } from '../hooks/dashboard';

const UPSELL_KEY = StorageKeys.UPSELL_DISMISSED_AT;
const UPSELL_TTL = 3 * 24 * 60 * 60 * 1000;

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const router = useRouter();


  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const { isLocked } = useAppLock();
  const { hasActivePrompt } = useAppConfig();

  const [showUpsell, setShowUpsell] = React.useState(false);

  React.useEffect(() => {
    if (isPremium || isLocked || hasActivePrompt) return;

    const checkUpsell = async () => {
      // Prevent rendering the premium upsell modal at the same time as the walkthrough modal to avoid iOS UIKit lockup/freeze.
      const walkthroughCompleted = await AsyncStorage.getItem(StorageKeys.WALKTHROUGH_DASHBOARD);
      if (walkthroughCompleted !== 'true') return;

      const val = await AsyncStorage.getItem(UPSELL_KEY);
      if (!val || Date.now() - parseInt(val, 10) > UPSELL_TTL) {
        setShowUpsell(true);
      }
    };

    checkUpsell();
  }, [isPremium, isLocked, hasActivePrompt]);

  const dismissUpsell = useCallback(() => {
    setShowUpsell(false);
    AsyncStorage.setItem(UPSELL_KEY, String(Date.now()));
  }, []);

  const handleWalkthroughFinish = useCallback(() => {
    if (isPremium || isLocked || hasActivePrompt) return;
    AsyncStorage.getItem(UPSELL_KEY).then(val => {
      if (!val || Date.now() - parseInt(val, 10) > UPSELL_TTL) {
        setShowUpsell(true);
      }
    });
  }, [isPremium, isLocked, hasActivePrompt]);

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
  const navigateToAccountTx = useCallback((id: number) => router.push(`/(main)/accounts/${id}`), [router]);

  const navigateToSearch = useCallback(() => router.push('/search'), [router]);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
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

        <HeroBalanceCard
          balance={balancesByCurrency[selectedCurrency] || 0}
          currency={selectedCurrency}
          income={totals.income}
          expense={totals.expense}
          onCurrencySelect={handleCurrencySelect}
          currencies={currencyKeys}
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
                <HugeiconsIcon icon={ReceiptTextIcon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start recording your daily payments, income, or transfers here.</Text>
              <BentoPressable style={styles.emptyAction} onPress={navigateToCreateTx}>
                <Text style={styles.emptyActionText}>Add transaction</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={colors.primaryForeground} />
              </BentoPressable>
            </View>
          )}
        </View>

      </ScrollView>

      <WalkthroughOverlay
        storageKey={StorageKeys.WALKTHROUGH_DASHBOARD}
        steps={DASHBOARD_WALKTHROUGH_STEPS}
        onFinish={handleWalkthroughFinish}
        enabled={!isLocked && !hasActivePrompt}
      />
      <PremiumUpsellBottomSheet visible={showUpsell && !isPremium && !isLocked && !hasActivePrompt} onClose={dismissUpsell} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    content: { paddingBottom: insets.bottom > 0 ? insets.bottom + 80 + 24 : 110 },

  

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
      borderRadius: radius('full'),
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
      color: colors.primaryForeground,
    },

  });
