import { HandshakeIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    router.push('/(main)/loans/form');
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header
        title="Loans"
        showBack
        rightAction={
          <BentoPressable style={styles.addBtn} onPress={handleAdd}>
            <HugeiconsIcon icon={PlusSignIcon} size={18} color={colors.primaryForeground} />
          </BentoPressable>
        }
      />

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
                <Text style={[styles.currencyText, { fontFamily: typography.fonts.medium },
                  c === selectedCurrency && { color: colors.primaryForeground }]}>
                  {c}
                </Text>
              </BentoPressable>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.summaryLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.success }]}>
              Lent out
            </Text>
            <MoneyText amount={totalLent} currency={selectedCurrency} type="CR" weight="bold" compact style={styles.summaryAmount} />
          </View>
          <View style={[styles.summaryTile, { backgroundColor: colors.danger + '15' }]}>
            <Text style={[styles.summaryLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.danger }]}>
              Borrowed
            </Text>
            <MoneyText amount={totalBorrowed} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.summaryAmount} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['lend', 'borrow'] as Tab[]).map(tab => (
            <BentoPressable
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { fontFamily: typography.fonts.medium },
                activeTab === tab ? { color: colors.primary } : { color: colors.textMuted }]}>
                {tab === 'lend' ? `Lent (${activeLent.length})` : `Borrowed (${activeBorow.length})`}
              </Text>
            </BentoPressable>
          ))}
        </View>

        {/* Active list */}
        {displayList.length === 0 ? (
          <View style={styles.empty}>
            <HugeiconsIcon icon={HandshakeIcon} size={36} color={colors.textMuted + '60'} />
            <Text style={[styles.emptyTitle, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>
              No {activeTab === 'lend' ? 'lent' : 'borrowed'} loans
            </Text>
            <BentoPressable style={styles.emptyAction} onPress={handleAdd}>
              <Text style={[styles.emptyActionText, { fontFamily: typography.fonts.semibold, color: colors.primaryForeground }]}>
                Add a loan
              </Text>
            </BentoPressable>
          </View>
        ) : (
          displayList.map((loan, idx) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onPress={handleLoanPress}
              isFirst={idx === 0}
              isLast={idx === displayList.length - 1 && repaidList.length === 0}
            />
          ))
        )}

        {/* Repaid */}
        {repaidList.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              Repaid
            </Text>
            {repaidList.map((loan, idx) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onPress={handleLoanPress}
                isFirst={idx === 0}
                isLast={idx === repaidList.length - 1}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, shadow }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currencyRow: { flexDirection: 'row', gap: spacing('2'), marginHorizontal: spacing('4'), marginBottom: spacing('3') },
    currencyPill: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      ...shadow('sm'),
    },
    currencyPillActive: { backgroundColor: colors.primary },
    currencyText: { fontSize: 13, color: colors.textMuted },
    summaryRow: { flexDirection: 'row', gap: spacing('3'), marginHorizontal: spacing('4'), marginBottom: spacing('4') },
    summaryTile: { flex: 1, borderRadius: radius('xl'), padding: spacing('3'), gap: spacing('1') },
    summaryLabel: { fontSize: 11, textTransform: 'uppercase' },
    summaryAmount: { fontSize: 20 },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: spacing('4'), marginBottom: spacing('3') },
    tab: { flex: 1, alignItems: 'center', paddingVertical: spacing('2.5'), borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 14 },
    empty: { alignItems: 'center', paddingVertical: spacing('10'), gap: spacing('3') },
    emptyTitle: { fontSize: 15 },
    emptyAction: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('lg'),
    },
    emptyActionText: { fontSize: 14 },
    sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginHorizontal: spacing('4'), marginTop: spacing('4'), marginBottom: spacing('2') },
  });
