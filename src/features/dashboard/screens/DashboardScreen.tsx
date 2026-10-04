import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ListGroup, Screen, SectionHeader, Skeleton, SkeletonRow } from '@/src/components/ui';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/src/constants/currency';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { BackupPromptModal } from '@/src/features/backup/components/BackupPromptModal';
import { AccountsCarousel } from '@/src/features/dashboard/components/AccountsCarousel';
import { DashboardHeader } from '@/src/features/dashboard/components/DashboardHeader';
import { HeroBalanceCard } from '@/src/features/dashboard/components/HeroBalanceCard';
import { LoansGlanceCard } from '@/src/features/dashboard/components/LoansGlanceCard';
import { MonthPulseCard } from '@/src/features/dashboard/components/MonthPulseCard';
import { PremiumUpsellModal } from '@/src/features/dashboard/components/PremiumUpsellModal';
import { QuickActions } from '@/src/features/dashboard/components/QuickActions';
import { TopPersonsCard } from '@/src/features/dashboard/components/TopPersonsCard';
import { useDashboardPersons, useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { useDashboardPrompt } from '@/src/features/dashboard/hooks/useDashboardPrompt';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { useTransactions } from '@/src/features/transactions/hooks/transactions';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

const RECENT_COUNT = 5;

/**
 * Home answers "where do I stand, and what do I do next": balance, quick entry, this month's facts,
 * accounts, recent activity, and who or what needs settling. Anything that explains *why* — trends,
 * rhythm, breakdowns, insights, forecasts — lives in Analytics, so each tab has its own job.
 * Sections with nothing to show (people, loans) stay out of the way.
 */
export const DashboardScreen = React.memo(function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { isPremium, requirePro } = useProAccess();
  const { profile } = useSettings();
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions(RECENT_COUNT);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { prompt, dismiss: dismissPrompt } = useDashboardPrompt(transactions?.length);

  const balancesByCurrency = useMemo(
    () =>
      (accounts ?? []).reduce<Record<string, number>>((acc, a) => {
        acc[a.currency] = (acc[a.currency] ?? 0) + a.balance;
        return acc;
      }, {}),
    [accounts],
  );

  const currencyKeys = useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return sortCurrenciesWithDefault(keys.length > 0 ? keys : [DEFAULT_CURRENCY], profile.defaultCurrency);
  }, [balancesByCurrency, profile.defaultCurrency]);

  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  // Falls back when the choice disappears (e.g. its last account was deleted).
  const currency = chosenCurrency && currencyKeys.includes(chosenCurrency) ? chosenCurrency : currencyKeys[0]!;

  // The selected currency's accounts lead the row, so switching the hero also brings them into view.
  const orderedAccounts = useMemo(
    () => [...(accounts ?? [])].sort((a, b) => Number(b.currency === currency) - Number(a.currency === currency)),
    [accounts, currency],
  );

  const { data: month } = useMonthTotals(currency);
  const { data: topPersons = [] } = useDashboardPersons(currency);

  const openSearch = useCallback(() => {
    if (requirePro('search')) router.push('/search');
  }, [router, requirePro]);
  const openAccount = useCallback((id: number) => router.push(`/(main)/accounts/${id}`), [router]);
  const openAccountForm = useCallback(() => router.push('/(main)/accounts/form'), [router]);
  const openAccounts = useCallback(() => router.push('/accounts'), [router]);
  const openAnalytics = useCallback(() => router.push('/analytics'), [router]);
  const openTransactions = useCallback(() => router.push('/transactions'), [router]);
  const openTransaction = useCallback((id: number) => router.push(`/transactions/${id}`), [router]);
  const createTransaction = useCallback(() => router.push('/transactions/create'), [router]);
  const openLoans = useCallback(() => router.push('/(main)/loans'), [router]);
  const openPersons = useCallback(() => router.push('/persons'), [router]);
  const openPerson = useCallback((id: number) => router.push(`/persons/${id}`), [router]);

  if (txLoading || accountsLoading) {
    // Skeleton mirrors the real layout so nothing jumps when data lands.
    return (
      <Screen variant="fixed" edges={['top']}>
        <View style={styles.skeleton}>
          <Skeleton width="45%" height={20} />
          <Skeleton height={248} radius="2xl" />
          <Skeleton height={176} radius="xl" />
          <ListGroup>
            <SkeletonRow />
            <SkeletonRow />
          </ListGroup>
        </View>
      </Screen>
    );
  }

  const recent = transactions ?? [];

  return (
    <Screen variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DashboardHeader name={profile.name} isPremium={isPremium} onSearch={openSearch} />

        <HeroBalanceCard
          balance={balancesByCurrency[currency] ?? 0}
          currency={currency}
          monthNet={month ? month.income - month.expense : null}
          currencies={currencyKeys}
          balances={balancesByCurrency}
          onCurrencySelect={setChosenCurrency}
        >
          <QuickActions canTransfer={(accounts?.length ?? 0) > 1} />
        </HeroBalanceCard>

        <SectionHeader title={t('dashboard.thisMonth')} rightText={t('common.analyticsTitle')} onPressRight={openAnalytics} />
        <MonthPulseCard currency={currency} />

        <SectionHeader title={t('dashboard.accounts')} rightText={t('dashboard.manage')} onPressRight={openAccounts} />
        <AccountsCarousel accounts={orderedAccounts} onPressAccount={openAccount} onPressAdd={openAccountForm} />

        <SectionHeader title={t('dashboard.recent')} rightText={t('dashboard.seeAll')} onPressRight={openTransactions} />
        <View style={styles.padded}>
          {recent.length > 0 ? (
            recent.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === recent.length - 1}
                showDate
                onPress={() => openTransaction(tx.id)}
              />
            ))
          ) : (
            <EmptyState
              icon="receipt"
              title={t('dashboard.noTransactions')}
              description={t('dashboard.transactionHint')}
              actionLabel={t('dashboard.addTransaction')}
              onAction={createTransaction}
              style={styles.emptyActivity}
            />
          )}
        </View>

        {topPersons.length > 0 && (
          <>
            <SectionHeader title={t('dashboard.people')} rightText={t('dashboard.seeAll')} onPressRight={openPersons} />
            <TopPersonsCard currency={currency} persons={topPersons} onPressPerson={openPerson} />
          </>
        )}

        <LoansGlanceCard currency={currency} onPress={openLoans} />
      </ScrollView>

      <PremiumUpsellModal visible={prompt === 'upsell'} onClose={dismissPrompt} />
      <BackupPromptModal visible={prompt === 'backup'} onClose={dismissPrompt} />
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, layout, tabBarClearance }: ThemeContextType, insets: EdgeInsets) =>
  StyleSheet.create({
    content: { paddingBottom: tabBarClearance(insets.bottom) },
    padded: { marginHorizontal: layout.screenPadding },
    emptyActivity: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('8'),
    },
    skeleton: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('6'),
      gap: spacing('4'),
    },
  });
