import { HandshakeIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { useAccounts } from '../../accounts/hooks/accounts';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import type { LoanWithStats } from '../api/loans';
import { LoanCard } from '../components/LoanCard';
import { useLoans } from '../hooks/loans';

type Tab = 'lend' | 'borrow';

export const LoansScreen = React.memo(function LoansScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const router = useRouter();

  const { data: accounts } = useAccounts();
  const { data: lentLoans } = useLoans('lend');
  const { data: borrowedLoans } = useLoans('borrow');

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
    router.push({
      pathname: '/(main)/loans/form',
      params: { type: activeTab },
    });
  }, [router, activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="Loans" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          <View style={[styles.summaryTile, { backgroundColor: colors.success + '12' }]}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>
              Lent out
            </Text>
            <MoneyText amount={totalLent} currency={selectedCurrency} type="CR" weight="bold" compact style={styles.summaryAmount} />
          </View>
          <View style={[styles.summaryTile, { backgroundColor: colors.danger + '12' }]}>
            <Text style={[styles.summaryLabel, { color: colors.danger }]}>
              Borrowed
            </Text>
            <MoneyText amount={totalBorrowed} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.summaryAmount} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['lend', 'borrow'] as Tab[]).map(tab => {
            const isActive = activeTab === tab;
            return (
              <BentoPressable
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  isActive && {
                    color: colors.primary,
                    fontFamily: typography.styles.chipLabelActive.fontFamily,
                  }
                ]}>
                  {tab === 'lend' ? `Lent (${activeLent.length})` : `Borrowed (${activeBorow.length})`}
                </Text>
              </BentoPressable>
            );
          })}
        </View>

        {/* Active list */}
        {displayList.length === 0 ? (
          repaidList.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <HugeiconsIcon icon={HandshakeIcon} size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                No {activeTab === 'lend' ? 'lent' : 'borrowed'} loans
              </Text>
              <Text style={styles.emptyText}>
                Keep track of money you lend to or borrow from others here.
              </Text>
              <BentoPressable style={styles.emptyBtn} onPress={handleAdd}>
                <HugeiconsIcon icon={PlusSignIcon} size={15} color={colors.primaryForeground} />
                <Text style={styles.emptyBtnText}>Add a loan</Text>
              </BentoPressable>
            </View>
          ) : (
            <View style={styles.inlineEmpty}>
              <HugeiconsIcon icon={HandshakeIcon} size={16} color={colors.textMuted} />
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
              Repaid
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
        <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, shadow, layout, typography }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: insets.bottom > 0 ? insets.bottom + 80 + 24 : 110,
    },
    currencyRow: { flexDirection: 'row', gap: spacing('2'), marginBottom: spacing('3') },
    currencyPill: {
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    currencyPillActive: {
      backgroundColor: colors.primary + '18',
    },
    currencyText: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.styles.chipLabel.fontFamily,
      color: colors.textMuted,
    },
    currencyTextActive: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
      color: colors.primary,
    },
    summaryRow: { flexDirection: 'row', gap: spacing('3'), marginBottom: spacing('4') },
    summaryTile: { flex: 1, borderRadius: radius('xl'), padding: spacing('3'), gap: spacing('1') },
    summaryLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      textTransform: 'uppercase',
    },
    summaryAmount: {
      fontSize: typography.sizes.xxl,
    },
    tabRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      width: '100%',
      marginBottom: spacing('3'),
    },
    tab: {
      flex: 1,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary + '18',
    },
    tabText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
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
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 220,
      lineHeight: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 40,
      paddingHorizontal: spacing('5'),
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      marginTop: spacing('2'),
    },
    emptyBtnText: {
      fontFamily: typography.styles.emptyAction.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.primaryForeground,
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
      fontSize: 12,
    },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
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
      borderRadius: radius('xl'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow('lg'),
    },
  });
