import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { AlertCircleIcon, ArrowDown01Icon, ArrowUp01Icon, HandshakeIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/src/components/ui/Icon';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import type { LoanWithStats } from '@/src/features/loans/api/loans';
import { LoanCard } from '@/src/features/loans/components/LoanCard';
import { useLoans, useLoansCount } from '@/src/features/loans/hooks/loans';
import { FREE_LOAN_LIMIT } from '@/src/constants/iap';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

type Tab = 'lend' | 'borrow';

export const LoansScreen = React.memo(function LoansScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, typography } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const router = useRouter();
  const { isPremium } = usePremium();

  const { data: accounts } = useAccounts();
  const { data: lentLoans } = useLoans('lend');
  const { data: borrowedLoans } = useLoans('borrow');
  const { data: activeLoansCount } = useLoansCount();

  const atFreeLimit = !isPremium && (activeLoansCount ?? 0) >= FREE_LOAN_LIMIT;

  const [activeTab, setActiveTab] = useState<Tab>('lend');

  const currencies = useMemo(() => {
    const set = new Set(accounts?.map(a => a.currency) ?? [DEFAULT_CURRENCY]);
    return Array.from(set);
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencies[0] ?? DEFAULT_CURRENCY);

  const activeLent = useMemo(
    () => (lentLoans ?? []).filter(l => l.currency === selectedCurrency && l.computedStatus !== 'repaid'),
    [lentLoans, selectedCurrency],
  );
  const activeBorow = useMemo(
    () => (borrowedLoans ?? []).filter(l => l.currency === selectedCurrency && l.computedStatus !== 'repaid'),
    [borrowedLoans, selectedCurrency],
  );
  const repaidLent = useMemo(
    () => (lentLoans ?? []).filter(l => l.currency === selectedCurrency && l.computedStatus === 'repaid'),
    [lentLoans, selectedCurrency],
  );
  const repaidBorrow = useMemo(
    () => (borrowedLoans ?? []).filter(l => l.currency === selectedCurrency && l.computedStatus === 'repaid'),
    [borrowedLoans, selectedCurrency],
  );

  const totalLent = useMemo(() => activeLent.reduce((s, l) => s + l.outstanding, 0), [activeLent]);
  const totalBorrowed = useMemo(() => activeBorow.reduce((s, l) => s + l.outstanding, 0), [activeBorow]);

  const displayList = activeTab === 'lend' ? activeLent : activeBorow;
  const repaidList = activeTab === 'lend' ? repaidLent : repaidBorrow;

  const handleLoanPress = useCallback((loan: LoanWithStats) => {
    router.push(`/(main)/loans/${loan.id}`);
  }, [router]);

  const handleAdd = useCallback(() => {
    if (atFreeLimit) {
      router.push('/premium');
      return;
    }
    router.push({
      pathname: '/(main)/loans/form',
      params: { type: activeTab },
    });
  }, [router, activeTab, atFreeLimit]);

  return (
    <Screen header={{ title: t('loans.title'), showBack: true }} variant="fixed" edges={['top']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Limit banner */}
        {atFreeLimit && (
          <Pressable style={styles.limitBanner} onPress={() => router.push('/premium')}>
            <Icon icon={AlertCircleIcon} size={16} color={colors.warning} />
            <Text style={[styles.limitBannerText, { color: colors.warning }]}>
              Free plan: {FREE_LOAN_LIMIT} active loans max — upgrade for unlimited
            </Text>
          </Pressable>
        )}

        {/* Currency tabs */}
        {currencies.length > 1 && (
          <View style={styles.currencyRow}>
            {currencies.map(c => (
              <BentoPressable
                key={c}
                style={[styles.currencyPill, c === selectedCurrency && styles.currencyPillActive]}
                onPress={() => setSelectedCurrency(c)}
              >
                <Text style={[styles.currencyText, c === selectedCurrency && styles.currencyTextActive]}>
                  {c}
                </Text>
              </BentoPressable>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, { backgroundColor: alpha(colors.success, 'subtle') }]}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>
              {t('loans.lentOut')}
            </Text>
            <MoneyText amount={totalLent} currency={selectedCurrency} type="CR" weight="bold" compact style={styles.summaryAmount} />
          </View>
          <View style={[styles.summaryTile, { backgroundColor: alpha(colors.danger, 'subtle') }]}>
            <Text style={[styles.summaryLabel, { color: colors.danger }]}>
              {t('loans.borrowed')}
            </Text>
            <MoneyText amount={totalBorrowed} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.summaryAmount} />
          </View>
        </View>

        {/* Tabs */}
        <SegmentedControl
          options={[
            { value: 'lend', label: `${t('loans.lent')} (${activeLent.length})`, icon: ArrowUp01Icon },
            { value: 'borrow', label: `${t('loans.borrowed')} (${activeBorow.length})`, icon: ArrowDown01Icon },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          style={styles.tabs}
        />

        {/* Active list */}
        {displayList.length === 0 ? (
          repaidList.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon icon={HandshakeIcon} size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'lend' ? t('loans.noLent') : t('loans.noBorrowed')}
              </Text>
              <Text style={styles.emptyText}>
                {t('loans.emptyHint')}
              </Text>
              <Button title={t('loans.addLoan')} icon={PlusSignIcon} onPress={handleAdd} />
            </View>
          ) : (
            <View style={styles.inlineEmpty}>
              <Icon icon={HandshakeIcon} size={16} color={colors.textMuted} />
              <Text style={[styles.inlineEmptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                All {activeTab === 'lend' ? 'lent' : 'borrowed'} loans are fully repaid
              </Text>
            </View>
          )
        ) : (
          displayList.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onPress={handleLoanPress}
            />
          ))
        )}

        {/* Repaid */}
        {repaidList.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              {t('loans.repaid')}
            </Text>
            {repaidList.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onPress={handleLoanPress}
              />
            ))}
          </>
        )}
      </ScrollView>

      <BentoPressable style={styles.fab} onPress={handleAdd}>
        <Icon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, shadow, layout, typography, sizes }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    tabs: { marginBottom: spacing('3') },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: insets.bottom > 0 ? insets.bottom + 80 + 24 : 110,
    },
    limitBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: alpha(colors.warning, 'subtle'),
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('2.5'),
      marginBottom: spacing('3'),
    },
    limitBannerText: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
    },
    currencyRow: { flexDirection: 'row', gap: spacing('2'), marginBottom: spacing('3') },
    currencyPill: {
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    currencyPillActive: {
      backgroundColor: alpha(colors.primary, 'subtle'),
    },
    currencyText: {
      ...typography.metrics.xs,
      fontFamily: typography.styles.chipLabel.fontFamily,
      color: colors.textMuted,
    },
    currencyTextActive: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
      color: colors.primaryInk,
    },
    summaryRow: { flexDirection: 'row', gap: spacing('3'), marginBottom: spacing('4') },
    summaryTile: { flex: 1, borderRadius: radius('xl'), padding: spacing('3'), gap: spacing('1') },
    summaryLabel: {
      fontFamily: typography.fonts.semibold,
      ...typography.metrics.xs,
      textTransform: 'uppercase',
    },
    summaryAmount: {
      ...typography.metrics.xxl,
    },
    empty: {
      paddingTop: 60,
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('1'),
    },
    emptyTitle: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      ...typography.metrics.xl,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 220,
    },
    inlineEmpty: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      justifyContent: 'center',
    },
    inlineEmptyText: {
      ...typography.metrics.xs,
    },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: spacing('6'),
      marginBottom: spacing('3'),
    },
    fab: {
      position: 'absolute',
      bottom: insets.bottom > 0 ? insets.bottom + 16 : 16,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
