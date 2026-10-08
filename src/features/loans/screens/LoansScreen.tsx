import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Chip, EmptyState, Fab, Screen, SectionHeader, SegmentedControl, StatTile } from '@/src/components/ui';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { FREE_LOAN_LIMIT } from '@/src/constants/iap';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import type { LoanWithStats } from '@/data/repositories/loans';
import { LoanCard } from '@/src/features/loans/components/LoanCard';
import { useLoans, useLoansCount } from '@/src/features/loans/hooks/loans';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { useSettings } from '@/features/settings';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Tab = 'lend' | 'borrow';

const splitByStatus = (loans: readonly LoanWithStats[] | undefined, currency: string) => {
  const inCurrency = (loans ?? []).filter((l) => l.currency === currency);
  return {
    active: inCurrency.filter((l) => l.computedStatus !== 'repaid'),
    repaid: inCurrency.filter((l) => l.computedStatus === 'repaid'),
  };
};

/** Totals owed each way, then the loans in one direction, open ones first. */
export const LoansScreen = React.memo(function LoansScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { isPremium, openPaywall } = useProAccess();
  const { profile } = useSettings();

  const { data: accounts } = useAccounts();
  const { data: lentLoans } = useLoans('lend');
  const { data: borrowedLoans } = useLoans('borrow');
  const { data: activeLoansCount = 0 } = useLoansCount();
  const atFreeLimit = !isPremium && activeLoansCount >= FREE_LOAN_LIMIT;

  const currencies = useMemo(() => {
    const unique = Array.from(new Set((accounts ?? []).map((a) => a.currency)));
    return sortCurrenciesWithDefault(unique.length > 0 ? unique : [DEFAULT_CURRENCY], profile.defaultCurrency);
  }, [accounts, profile.defaultCurrency]);
  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]!;
  const [tab, setTab] = useState<Tab>('lend');

  const lent = useMemo(() => splitByStatus(lentLoans, currency), [lentLoans, currency]);
  const borrowed = useMemo(() => splitByStatus(borrowedLoans, currency), [borrowedLoans, currency]);
  const current = tab === 'lend' ? lent : borrowed;
  const outstanding = (list: LoanWithStats[]) => list.reduce((sum, l) => sum + l.outstanding, 0);

  const openLoan = useCallback((loan: LoanWithStats) => router.push(`/(main)/loans/${loan.id}`), [router]);
  const addLoan = useCallback(() => {
    if (atFreeLimit) openPaywall('unlimited');
    else router.push({ pathname: '/(main)/loans/form', params: { type: tab } });
  }, [router, tab, atFreeLimit, openPaywall]);

  const tabs = useMemo(
    () => [
      { value: 'lend' as const, label: `${t('loans.lent')} · ${lent.active.length}`, icon: 'trend-up' as const },
      { value: 'borrow' as const, label: `${t('loans.borrowed')} · ${borrowed.active.length}`, icon: 'chevron-down' as const },
    ],
    [t, lent.active.length, borrowed.active.length],
  );

  return (
    <Screen header={{ title: t('loans.title'), showBack: true }} variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {atFreeLimit ? (
          <Banner tone="warning" title={t('loans.freeLimit', { limit: FREE_LOAN_LIMIT })} actionLabel={t('loans.upgrade')} onAction={() => openPaywall('unlimited')} />
        ) : null}

        {currencies.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
            {currencies.map((c) => (
              <Chip key={c} label={c} isActive={c === currency} onPress={() => setCurrency(c)} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.tiles}>
          <StatTile label={t('loans.lentOut')} icon="trend-up" iconColor={colors.success} amount={outstanding(lent.active)} currency={currency} type="CR" compact />
          <StatTile label={t('loans.borrowed')} icon="chevron-down" iconColor={colors.danger} amount={outstanding(borrowed.active)} currency={currency} type="DR" compact />
        </View>

        <SegmentedControl options={tabs} value={tab} onChange={setTab} />

        {current.active.length > 0 ? (
          <View style={styles.list}>
            {current.active.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onPress={openLoan} />
            ))}
          </View>
        ) : current.repaid.length > 0 ? (
          <EmptyState variant="inline" icon="check-circle" title={t('loans.allRepaid')} />
        ) : (
          <EmptyState
            icon="handshake"
            title={tab === 'lend' ? t('loans.noLent') : t('loans.noBorrowed')}
            description={t('loans.emptyHint')}
            actionLabel={t('loans.addLoan')}
            onAction={addLoan}
          />
        )}

        {current.repaid.length > 0 ? (
          <View>
            <SectionHeader title={t('loans.repaid')} noPadding />
            <View style={styles.list}>
              {current.repaid.map((loan) => (
                <LoanCard key={loan.id} loan={loan} onPress={openLoan} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Fab onPress={addLoan} accessibilityLabel={t('loans.addLoan')} />
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: 56 + spacing('12'), gap: spacing('4') },
    bleed: { marginHorizontal: -layout.screenPadding, flexGrow: 0 },
    chips: { gap: spacing('2'), paddingHorizontal: layout.screenPadding },
    tiles: { flexDirection: 'row', gap: spacing('2') },
    list: { gap: spacing('3') },
  });
