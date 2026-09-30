import { Screen } from '@/src/components/ui/Screen';
import { EmptyState, ListGroup, SectionHeader, Skeleton, SkeletonRow } from '@/src/components/ui';
import { ReceiptIcon } from '@/src/components/ui/icons';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/src/constants/currency';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useTransactions } from '@/src/features/transactions/hooks/transactions';
import { BackupPromptModal } from '@/src/features/backup/components/BackupPromptModal';
import { AccountsCarousel } from '@/src/features/dashboard/components/AccountsCarousel';
import { DashboardHeader } from '@/src/features/dashboard/components/DashboardHeader';
import { HeroBalanceCard } from '@/src/features/dashboard/components/HeroBalanceCard';
import { InsightsSection } from '@/src/features/dashboard/components/InsightsSection';
import { LoansGlanceCard } from '@/src/features/dashboard/components/LoansGlanceCard';
import { PremiumUpsellModal } from '@/src/features/dashboard/components/PremiumUpsellModal';
import { TopExpenseCategoriesCard } from '@/src/features/dashboard/components/TopExpenseCategoriesCard';
import { TopPersonsCard } from '@/src/features/dashboard/components/TopPersonsCard';
import { useDashboardPersons, useDashboardStats, useTopExpenseCategories } from '@/src/features/dashboard/hooks/dashboard';
import { useDashboardPrompt } from '@/src/features/dashboard/hooks/useDashboardPrompt';

export const DashboardScreen = React.memo(function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();


  const { prompt, dismiss: dismissPrompt } = useDashboardPrompt(transactions?.length);

  const balancesByCurrency = useMemo(() =>
    accounts?.reduce((acc, a) => {
      acc[a.currency] = (acc[a.currency] || 0) + a.balance;
      return acc;
    }, {} as Record<string, number>) ?? {},
    [accounts],
  );

  const currencyKeys = useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    const list = keys.length > 0 ? keys : [DEFAULT_CURRENCY];
    return sortCurrenciesWithDefault(list, profile.defaultCurrency);
  }, [balancesByCurrency, profile.defaultCurrency]);

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
  const navigateToEditTx = useCallback((id: number) => router.push(`/transactions/${id}`), [router]);
  const openAccountForm = useCallback(() => router.push('/(main)/accounts/form'), [router]);
  const openAccountsScreen = useCallback(() => router.push('/accounts'), [router]);


  if (txLoading || accountsLoading) {
    // Skeleton mirrors the real layout so nothing jumps when data lands.
    return (
      <Screen variant="fixed" edges={['top']}>
        <View style={styles.skeleton}>
          <Skeleton width="45%" height={20} />
          <Skeleton height={190} radius="2xl" />
          <Skeleton width="30%" height={14} />
          <ListGroup>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ListGroup>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="fixed" edges={['top']}>

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

        <SectionHeader title={t('dashboard.accounts')} rightText={t('dashboard.manage')} onPressRight={openAccountsScreen} />
        <AccountsCarousel
          accounts={accounts ?? []}
          onPressAccount={navigateToAccountTx}
          onPressAdd={openAccountForm}
        />

        <InsightsSection currency={selectedCurrency} />

        <SectionHeader title={t('dashboard.topExpenses')} />
        <TopExpenseCategoriesCard currency={selectedCurrency} categories={topExpenseCategories} />

        {topPersonsData && topPersonsData.length > 0 && (
          <>
            <SectionHeader title={t('dashboard.people')} rightText={t('dashboard.seeAll')} onPressRight={() => router.push('/persons')} />
            <TopPersonsCard currency={selectedCurrency} persons={topPersonsData} onPressPerson={(id) => router.push(`/persons/${id}`)} />
          </>
        )}

        <SectionHeader title={t('dashboard.loans')} rightText={t('dashboard.seeAll')} onPressRight={() => router.push('/(main)/loans')} />
        <LoansGlanceCard currency={selectedCurrency} onPress={() => router.push('/(main)/loans')} />

        <SectionHeader title={t('dashboard.recent')} rightText={t('dashboard.seeAll')} onPressRight={navigateToTransactions} />
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
            <EmptyState
              icon={ReceiptIcon}
              title={t('dashboard.noTransactions')}
              description={t('dashboard.transactionHint')}
              actionLabel={t('dashboard.addTransaction')}
              onAction={navigateToCreateTx}
              style={styles.emptyActivity}
            />
          )}
        </View>

      </ScrollView>

      <PremiumUpsellModal visible={prompt === 'upsell'} onClose={dismissPrompt} />
      <BackupPromptModal visible={prompt === 'backup'} onClose={dismissPrompt} />
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, layout, tabBarClearance }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    content: { paddingBottom: tabBarClearance(insets.bottom) },

  

    // ── Activity card
    activityCard: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
    },
    emptyActivity: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('8'),
    },
    skeleton: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('6'),
      gap: spacing('5'),
    },
  });
